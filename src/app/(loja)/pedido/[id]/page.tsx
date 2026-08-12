import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CircleCheckBig, Package } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { retryPaymentAction } from '@/app/actions/checkout'
import { formatBRL } from '@/lib/money'
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/enums'
import { formatZip } from '@/lib/shipping'
import { formatDateTime } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/badge'
import { OrderTimeline } from '@/components/loja/order-timeline'
import { PaymentPayload } from '@/components/loja/payment-payload'

export const metadata: Metadata = { title: 'Seu pedido' }

export default async function PedidoPage({ params, searchParams }: PageProps<'/pedido/[id]'>) {
  const { id } = await params
  const { pagamento } = await searchParams
  const user = await requireUser()

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) notFound()
  if (order.userId !== user.id && user.role !== 'ADMIN') notFound()

  const awaitingPayment = order.paymentStatus === 'PENDING' && order.status !== 'CANCELED'
  const method = order.paymentMethod as PaymentMethod

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          {order.paymentStatus === 'APPROVED' ? (
            <p className="tag mb-3 flex items-center gap-2 text-amber-600">
              <CircleCheckBig size={16} aria-hidden />
              Pagamento confirmado
            </p>
          ) : (
            <p className="tag mb-3 flex items-center gap-2 text-amber-600">
              <Package size={16} aria-hidden />
              Pedido registrado
            </p>
          )}

          <h1 className="font-display text-4xl font-extrabold text-brand-950">
            Pedido {order.number}
          </h1>
          <p className="mt-2 text-ink-muted">
            Feito em {formatDateTime(order.createdAt)} · {PAYMENT_METHOD_LABEL[method]}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </header>

        {pagamento === 'falha' && (
          <p className="mb-6 rounded-xl border border-danger-bg bg-danger-bg px-4 py-3 text-sm text-danger">
            O pagamento não foi concluído. Você pode tentar de novo abaixo — o pedido segue
            reservado.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-6">
            {awaitingPayment && (
              <section className="card p-5">
                <h2 className="mb-1 font-display text-lg font-bold text-brand-950">
                  Falta o pagamento
                </h2>
                <p className="mb-4 text-sm text-ink-muted">
                  Separamos as peças para você. Elas ficam reservadas até a confirmação.
                </p>

                {order.paymentPayload && (
                  <PaymentPayload
                    label={method === 'PIX' ? 'Pix copia e cola' : 'Linha digitável do boleto'}
                    payload={order.paymentPayload}
                  />
                )}

                <form action={retryPaymentAction.bind(null, order.id)} className="mt-4">
                  <button type="submit" className="btn btn-amber w-full">
                    {order.checkoutUrl ? 'Pagar agora' : 'Abrir pagamento'}
                  </button>
                </form>
              </section>
            )}

            <section className="card p-5">
              <h2 className="mb-5 font-display text-lg font-bold text-brand-950">
                Acompanhe o pedido
              </h2>
              <OrderTimeline status={order.status} events={order.events} />

              {order.trackingCode && (
                <p className="mt-5 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
                  Código de rastreio:{' '}
                  <strong className="font-mono">{order.trackingCode}</strong>
                </p>
              )}
            </section>

            <section className="card p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Itens</h2>
              <ul className="divide-y divide-brand-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-paper">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="4rem"
                          className="object-contain p-1.5"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-brand-900">{item.productName}</p>
                      <p className="text-sm text-ink-muted">{item.variantLabel}</p>
                      <p className="tag mt-1 text-ink-muted">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-brand-950">
                        {formatBRL(item.total)}
                      </p>
                      <p className="text-sm text-ink-muted">
                        {item.quantity} × {formatBRL(item.unitPrice)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="flex flex-col gap-6">
            <section className="card p-5">
              <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Valores</h2>
              <dl className="flex flex-col gap-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Subtotal</dt>
                  <dd className="font-medium text-brand-900">{formatBRL(order.subtotal)}</dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">
                      Desconto {order.couponCode && <span className="tag">{order.couponCode}</span>}
                    </dt>
                    <dd className="font-medium text-amber-600">−{formatBRL(order.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-muted">{order.shippingMethod}</dt>
                  <dd className="font-medium text-brand-900">
                    {order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-brand-100 pt-3">
                  <dt className="font-display font-bold text-brand-950">Total</dt>
                  <dd className="font-display text-2xl font-extrabold text-brand-950">
                    {formatBRL(order.total)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-bold text-brand-950">Entrega</h2>
              <address className="text-sm not-italic leading-relaxed text-ink-muted">
                <strong className="block font-semibold text-brand-900">{order.recipient}</strong>
                {order.street}, {order.number_}
                {order.complement ? ` · ${order.complement}` : ''}
                <br />
                {order.district} — {order.city}/{order.state}
                <br />
                CEP {formatZip(order.zip)}
              </address>

              {order.notes && (
                <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
                  <span className="tag block text-ink-muted">Observações</span>
                  {order.notes}
                </p>
              )}
            </section>

            <Link href="/conta/pedidos" className="btn btn-outline w-full">
              Ver todos os meus pedidos
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
