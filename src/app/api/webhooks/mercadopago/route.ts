import { NextResponse } from 'next/server'
import MercadoPagoConfig, { Payment, WebhookSignatureValidator } from 'mercadopago'
import { prisma } from '@/lib/prisma'
import { markPaymentStatus } from '@/lib/orders'
import { translateStatus } from '@/lib/payments/mercadopago'

/**
 * Confirmação de pagamento do Mercado Pago.
 *
 * O corpo da notificação diz apenas qual pagamento mudou — nunca o valor nem
 * o status final. A loja consulta a API para saber o que de fato aconteceu, e
 * só então move o pedido. Assim uma requisição forjada não consegue aprovar
 * nada.
 *
 * Configure a URL no painel do Mercado Pago em Suas integrações > Webhooks:
 *   https://SEU-DOMINIO/api/webhooks/mercadopago
 */
export async function POST(request: Request) {
  const url = new URL(request.url)
  const body = await request.json().catch(() => null)

  const dataId = body?.data?.id ?? url.searchParams.get('data.id')
  const type = body?.type ?? url.searchParams.get('type')

  if (!dataId) {
    return NextResponse.json({ error: 'Notificação sem data.id.' }, { status: 400 })
  }

  // Só pagamentos interessam; merchant_order e demais tipos são ignorados.
  if (type && type !== 'payment') {
    return NextResponse.json({ ignored: type })
  }

  const secret = process.env.MP_WEBHOOK_SECRET
  if (secret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get('x-signature'),
        xRequestId: request.headers.get('x-request-id'),
        dataId: String(dataId),
        secret,
        toleranceSeconds: 300,
      })
    } catch (error) {
      console.warn('[webhook] assinatura inválida', error)
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 })
    }
  } else {
    console.warn('[webhook] MP_WEBHOOK_SECRET ausente: notificação aceita sem verificação.')
  }

  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    return NextResponse.json({ error: 'MP_ACCESS_TOKEN não configurado.' }, { status: 500 })
  }

  try {
    const client = new MercadoPagoConfig({ accessToken })
    const payment = await new Payment(client).get({ id: String(dataId) })

    // external_reference é o id do pedido, gravado na criação da preferência.
    const orderId = payment.external_reference
    if (!orderId) {
      return NextResponse.json({ error: 'Pagamento sem external_reference.' }, { status: 422 })
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    }

    await markPaymentStatus(orderId, translateStatus(payment.status), String(payment.id))

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[webhook] falha ao processar notificação', error)
    // Devolver 500 faz o Mercado Pago reenviar a notificação depois.
    return NextResponse.json({ error: 'Falha ao processar a notificação.' }, { status: 500 })
  }
}

/** O painel do Mercado Pago faz um GET de teste ao salvar a URL. */
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
