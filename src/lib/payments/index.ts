import { mercadoPagoProvider } from './mercadopago'
import { sandboxProvider } from './sandbox'
import type { PaymentProvider } from './types'

export type { PaymentIntent, PaymentSession, PaymentProvider } from './types'

/**
 * Provider ativo, escolhido por PAYMENT_PROVIDER.
 *
 * Sem MP_ACCESS_TOKEN a loja cai na simulação em vez de quebrar o checkout:
 * é melhor a equipe conseguir testar o fluxo do que ver um erro 500.
 */
export function paymentProvider(): PaymentProvider {
  const configured = process.env.PAYMENT_PROVIDER ?? 'sandbox'

  if (configured === 'mercadopago') {
    if (!process.env.MP_ACCESS_TOKEN) {
      console.warn(
        '[pagamentos] PAYMENT_PROVIDER=mercadopago sem MP_ACCESS_TOKEN. Usando simulação.',
      )
      return sandboxProvider
    }
    return mercadoPagoProvider
  }

  return sandboxProvider
}

export function isSandbox(): boolean {
  return paymentProvider().id === 'sandbox'
}
