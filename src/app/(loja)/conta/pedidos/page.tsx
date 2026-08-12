import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { formatBRL } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/feedback'

export const metadata: Metadata = { title: 'Meus pedidos' }

export default async function MeusPedidosPage() {
  const user = await requireUser()

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: { take: 4 } },
  })

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package size={32} aria-hidden />}
        title="Nenhum pedido por aqui ainda"
        description="Assim que você comprar, o pedido aparece nesta lista com o status da entrega."
        action={{ label: 'Ver o catálogo', href: '/produtos' }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <article key={order.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href={`/pedido/${order.id}`}
                className="font-display text-lg font-bold text-brand-950 hover:underline"
              >
                {order.number}
              </Link>
              <p className="mt-0.5 text-sm text-ink-muted">
                {formatDate(order.createdAt)} · {order.items.length}{' '}
                {order.items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <ul className="flex flex-wrap gap-2">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="relative h-12 w-12 overflow-hidden rounded-lg border border-brand-100 bg-paper"
                  title={`${item.productName} — ${item.variantLabel}`}
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      sizes="3rem"
                      className="object-contain p-1"
                    />
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-4">
              <p className="font-display text-lg font-bold text-brand-950">
                {formatBRL(order.total)}
              </p>
              <Link href={`/pedido/${order.id}`} className="btn btn-outline btn-sm">
                Ver detalhes
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
