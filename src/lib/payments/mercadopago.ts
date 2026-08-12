import MercadoPagoConfig, { Payment, Preference } from 'mercadopago'
import type { PaymentIntent, PaymentProvider, PaymentSession } from './types'
import type { PaymentStatus } from '../enums'

// Integração via Checkout Pro: a loja cria uma preferência e redireciona o
// comprador para o ambiente hospedado do Mercado Pago, que cuida de Pix,
// boleto e cartão. A confirmação chega pelo webhook em
// /api/webhooks/mercadopago.

function client() {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error(
      'MP_ACCESS_TOKEN não configurado. Preencha o .env ou use PAYMENT_PROVIDER=sandbox.',
    )
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 10000 } })
}

/**
 * Restringe os meios de pagamento à escolha feita na loja.
 *
 * O Checkout Pro mostra tudo por padrão; excluindo os outros tipos, o
 * comprador que escolheu Pix não cai numa tela de cartão.
 */
function paymentMethodRules(method: PaymentIntent['method']) {
  if (method === 'PIX') {
    return { excluded_payment_types: [{ id: 'credit_card' }, { id: 'ticket' }] }
  }
  if (method === 'BOLETO') {
    return { excluded_payment_types: [{ id: 'credit_card' }, { id: 'bank_transfer' }] }
  }
  return {
    excluded_payment_types: [{ id: 'ticket' }, { id: 'bank_transfer' }],
    installments: 12,
  }
}

/** Traduz o status do Mercado Pago para o vocabulário do pedido. */
export function translateStatus(mpStatus: string | undefined): PaymentStatus {
  switch (mpStatus) {
    case 'approved':
    case 'authorized':
      return 'APPROVED'
    case 'rejected':
    case 'cancelled':
      return 'REJECTED'
    case 'refunded':
    case 'charged_back':
      return 'REFUNDED'
    default:
      return 'PENDING'
  }
}

export const mercadoPagoProvider: PaymentProvider = {
  id: 'mercadopago',

  async createCheckout(intent: PaymentIntent): Promise<PaymentSession> {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const preference = new Preference(client())

    const items = intent.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      picture_url: item.imageUrl ?? undefined,
      quantity: item.quantity,
      currency_id: 'BRL',
      unit_price: item.unitPrice / 100,
    }))

    // Desconto entra como item negativo: o Checkout Pro não tem campo próprio
    // para abatimento, e o total precisa fechar com o pedido gravado aqui.
    if (intent.discount > 0) {
      items.push({
        id: 'desconto',
        title: 'Desconto',
        description: 'Cupom aplicado',
        picture_url: undefined,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: -(intent.discount / 100),
      })
    }

    const [firstName, ...rest] = intent.payer.name.split(' ')

    const response = await preference.create({
      body: {
        items,
        external_reference: intent.orderId,
        statement_descriptor: 'STRONG SCHOOL',
        notification_url: `${base}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${base}/pedido/${intent.orderId}?pagamento=sucesso`,
          pending: `${base}/pedido/${intent.orderId}?pagamento=pendente`,
          failure: `${base}/pedido/${intent.orderId}?pagamento=falha`,
        },
        auto_return: 'approved',
        payer: {
          name: firstName,
          surname: rest.join(' ') || firstName,
          email: intent.payer.email,
          identification: intent.payer.document
            ? { type: 'CPF', number: intent.payer.document.replace(/\D/g, '') }
            : undefined,
          address: {
            zip_code: intent.shippingAddress.zip,
            street_name: intent.shippingAddress.street,
            street_number: intent.shippingAddress.number,
          },
        },
        shipments: {
          cost: intent.shipping / 100,
          mode: 'not_specified',
        },
        payment_methods: paymentMethodRules(intent.method),
      },
    })

    // `init_point` é produção; `sandbox_init_point` só existe em contas de teste.
    const checkoutUrl = response.init_point ?? response.sandbox_init_point ?? null

    return {
      provider: 'mercadopago',
      checkoutUrl,
      preferenceId: response.id ?? null,
      status: 'PENDING',
      payload: null,
    }
  },

  async fetchStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = new Payment(client())
    const result = await payment.get({ id: paymentId })
    return translateStatus(result.status)
  },
}
