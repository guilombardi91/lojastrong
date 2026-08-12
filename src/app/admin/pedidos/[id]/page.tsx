import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { confirmPaymentAction } from '@/app/actions/admin/operacao'
import { formatBRL } from '@/lib/money'
import { formatZip } from '@/lib/shipping'
import { formatDateTime } from '@/lib/utils'
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/lib/enums'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/badge'
import { OrderActions } from '@/components/admin/order-actions'

export const metadata: Metadata = { title: 'Detalhe do pedido' }

export default async function AdminPedidoPage({ params }: PageProps<'/admin/pedidos/[id]'>) {
  await requireAdmin()
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: 'desc' } },
      user: { select: { id: true, name: true, email: true, phone: true, document: true } },
    },
  })

  if (!order) notFound()

  return (
    <>
      <Link
        href="/admin/pedidos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft size={15} aria-hidden />
        Voltar para pedidos
      </Link>

      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand-950">{order.number}</h1>
          <p className="mt-2 text-ink-muted">
            {formatDateTime(order.createdAt)} ·{' '}
            {PAYMENT_METHOD_LABEL[order.paymentMethod as PaymentMethod]} · {order.shippingMethod}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>

        {order.paymentStatus === 'PENDING' && order.status !== 'CANCELED' && (
          <form action={confirmPaymentAction.bind(null, order.id)}>
            <button type="submit" className="btn btn-amber">
              <CheckCircle2 size={17} aria-hidden />
              Confirmar pagamento manualmente
            </button>
          </form>
        )}
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Itens</h2>
            <ul className="divide-y divide-brand-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-paper">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="3.5rem"
                        className="object-contain p-1.5"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-900">{item.productName}</p>
                    <p className="text-sm text-ink-muted">{item.variantLabel}</p>
                    <p className="tag mt-0.5 text-brand-600">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-brand-950">{formatBRL(item.total)}</p>
                    <p className="text-sm text-ink-muted">
                      {item.quantity} × {formatBRL(item.unitPrice)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 flex flex-col gap-2 border-t border-brand-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd>{formatBRL(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">
                    Desconto {order.couponCode && <span className="tag">{order.couponCode}</span>}
                  </dt>
                  <dd className="text-amber-600">−{formatBRL(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Frete</dt>
                <dd>{order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-brand-100 pt-3">
                <dt className="font-display font-bold text-brand-950">Total</dt>
                <dd className="font-display text-xl font-extrabold text-brand-950">
                  {formatBRL(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Histórico</h2>
            <ol className="flex flex-col gap-3">
              {order.events.map((event) => (
                <li key={event.id} className="flex gap-3 text-sm">
                  <span className="tag shrink-0 text-ink-muted">
                    {formatDateTime(event.createdAt)}
                  </span>
                  <span className="text-brand-900">{event.message}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <OrderActions
            orderId={order.id}
            status={order.status}
            trackingCode={order.trackingCode}
          />

          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-950">Cliente</h2>
            <p className="font-semibold text-brand-900">{order.user.name}</p>
            <p className="text-sm text-ink-muted">{order.user.email}</p>
            {order.user.phone && (
              <p className="font-mono text-sm text-ink-muted">{order.user.phone}</p>
            )}
            {order.user.document && (
              <p className="font-mono text-sm text-ink-muted">CPF {order.user.document}</p>
            )}

            <h3 className="mb-2 mt-5 font-display text-sm font-bold text-brand-950">
              Endereço de entrega
            </h3>
            <address className="text-sm not-italic leading-relaxed text-ink-muted">
              {order.recipient}
              <br />
              {order.street}, {order.number_}
              {order.complement ? ` · ${order.complement}` : ''}
              <br />
              {order.district} — {order.city}/{order.state}
              <br />
              CEP {formatZip(order.zip)}
            </address>

            {order.notes && (
              <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
                <span className="tag block text-ink-muted">Observações do cliente</span>
                {order.notes}
              </p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-brand-950">Pagamento</h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Provedor</dt>
                <dd className="font-mono text-xs">{order.provider}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Preferência</dt>
                <dd className="truncate font-mono text-xs">{order.preferenceId ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Pagamento</dt>
                <dd className="truncate font-mono text-xs">{order.paymentId ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Pago em</dt>
                <dd className="font-mono text-xs">
                  {order.paidAt ? formatDateTime(order.paidAt) : '—'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  )
}
