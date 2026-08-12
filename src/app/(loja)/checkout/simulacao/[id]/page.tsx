import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { FlaskConical } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { formatBRL } from '@/lib/money'
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/enums'
import { isSandbox } from '@/lib/payments'
import { approveSimulatedPayment, rejectSimulatedPayment } from './actions'

export const metadata: Metadata = { title: 'Simulação de pagamento' }

/**
 * Ambiente de simulação do provider `sandbox`.
 *
 * Existe para a equipe percorrer a compra inteira sem credenciais de
 * adquirente. Com PAYMENT_PROVIDER=mercadopago a rota se recusa a operar — ela
 * nunca deve virar um atalho para aprovar pagamento em produção.
 */
export default async function SimulacaoPage({ params }: PageProps<'/checkout/simulacao/[id]'>) {
  const { id } = await params
  const user = await requireUser()

  if (!isSandbox()) notFound()

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
  if (!order || order.userId !== user.id) notFound()
  if (order.paymentStatus === 'APPROVED') redirect(`/pedido/${order.id}`)

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-lg">
        <div className="card p-8">
          <p className="tag mb-4 flex items-center gap-2 text-amber-600">
            <FlaskConical size={16} aria-hidden />
            Ambiente de simulação
          </p>

          <h1 className="font-display text-2xl font-extrabold text-brand-950">
            Simular o pagamento do pedido {order.number}
          </h1>
          <p className="mt-3 text-ink-muted">
            A loja está rodando com o provedor de simulação. Escolha um desfecho para seguir o
            fluxo até o fim — é o mesmo caminho que o webhook do Mercado Pago percorre em produção.
          </p>

          <dl className="my-7 flex flex-col gap-2.5 border-y border-brand-100 py-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Meio de pagamento</dt>
              <dd className="font-medium text-brand-900">
                {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod]}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Itens</dt>
              <dd className="font-medium text-brand-900">{order.items.length}</dd>
            </div>
            <div className="flex items-baseline justify-between">
              <dt className="font-display font-bold text-brand-950">Total</dt>
              <dd className="font-display text-xl font-extrabold text-brand-950">
                {formatBRL(order.total)}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form action={approveSimulatedPayment.bind(null, order.id)} className="flex-1">
              <button type="submit" className="btn btn-amber w-full">
                Aprovar pagamento
              </button>
            </form>
            <form action={rejectSimulatedPayment.bind(null, order.id)} className="flex-1">
              <button type="submit" className="btn btn-outline w-full">
                Recusar pagamento
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted">
            Para cobrar de verdade, preencha MP_ACCESS_TOKEN no .env e troque PAYMENT_PROVIDER para
            mercadopago.
          </p>
        </div>
      </div>
    </div>
  )
}
