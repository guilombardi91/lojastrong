import type { PaymentIntent, PaymentProvider, PaymentSession } from './types'
import type { PaymentStatus } from '../enums'

// Provider de simulação: permite exercitar o fluxo completo de compra sem
// credenciais de adquirente. Ativo quando PAYMENT_PROVIDER=sandbox.
//
// Ele leva o comprador para /checkout/simulacao/[pedido], uma tela interna que
// aprova ou recusa o pagamento manualmente — o mesmo caminho de código que o
// webhook do Mercado Pago percorre em produção.

function fakePixPayload(orderNumber: string, total: number): string {
  const amount = (total / 100).toFixed(2)
  return [
    '00020126580014BR.GOV.BCB.PIX',
    `0136${orderNumber.toLowerCase()}-simulacao-loja-strong`,
    '52040000530398654',
    `04${amount}`,
    '5802BR5920STRONG BUSINESS SCH6009SAO PAULO',
    `62070503***6304SIMU`,
  ].join('')
}

function fakeBoletoLine(orderNumber: string): string {
  const seed = orderNumber.replace(/\D/g, '').padEnd(20, '7').slice(0, 20)
  return `34191.${seed.slice(0, 5)} ${seed.slice(5, 10)}.${seed.slice(10, 16)} ${seed.slice(
    16,
    20,
  )}0.000000 1 99999999999999`
}

export const sandboxProvider: PaymentProvider = {
  id: 'sandbox',

  async createCheckout(intent: PaymentIntent): Promise<PaymentSession> {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    let payload: string | null = null
    if (intent.method === 'PIX') payload = fakePixPayload(intent.orderNumber, intent.total)
    if (intent.method === 'BOLETO') payload = fakeBoletoLine(intent.orderNumber)

    return {
      provider: 'sandbox',
      checkoutUrl: `${base}/checkout/simulacao/${intent.orderId}`,
      preferenceId: `SIMU-${intent.orderNumber}`,
      status: 'PENDING',
      payload,
    }
  },

  async fetchStatus(): Promise<PaymentStatus> {
    // Na simulação quem decide o status é a tela, não uma consulta externa.
    return 'PENDING'
  },
}
