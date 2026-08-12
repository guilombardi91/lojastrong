import type { PaymentMethod, PaymentStatus } from '../enums'

// O checkout conversa apenas com esta interface. Trocar de adquirente
// (Mercado Pago, Pagar.me, Asaas, Stripe) significa escrever um novo provider
// e apontar PAYMENT_PROVIDER no .env — nenhuma tela muda.

export type PaymentIntentItem = {
  id: string
  title: string
  description?: string
  quantity: number
  /** Preço unitário em centavos. */
  unitPrice: number
  imageUrl?: string | null
}

export type PaymentIntent = {
  orderId: string
  orderNumber: string
  method: PaymentMethod
  items: PaymentIntentItem[]
  /** Frete em centavos, cobrado como linha separada. */
  shipping: number
  /** Desconto em centavos, já validado. */
  discount: number
  total: number
  payer: {
    name: string
    email: string
    document?: string | null
    phone?: string | null
  }
  shippingAddress: {
    zip: string
    street: string
    number: string
    city: string
    state: string
  }
}

export type PaymentSession = {
  provider: string
  /** Para onde mandar o comprador. Nulo quando o provider é assíncrono. */
  checkoutUrl: string | null
  preferenceId: string | null
  status: PaymentStatus
  /** Pix copia-e-cola ou linha digitável do boleto, quando o método gera um. */
  payload?: string | null
}

export interface PaymentProvider {
  readonly id: string
  createCheckout(intent: PaymentIntent): Promise<PaymentSession>
  /** Consulta o status corrente de um pagamento no provedor. */
  fetchStatus(paymentId: string): Promise<PaymentStatus>
}
