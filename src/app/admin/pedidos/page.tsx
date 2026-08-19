import type { Metadata } from 'next'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { formatBRL } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { ORDER_STATUSES, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/enums'
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/badge'
import { AdminHeader, DataTable, Td, Th } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Pedidos' }

export default async function AdminPedidosPage({ searchParams }: PageProps<'/admin/pedidos'>) {
  const params = await searchParams
  const status = typeof params.status === 'string' ? params.status : ''
  const q = typeof params.q === 'string' ? params.q.trim() : ''

  const where: Prisma.OrderWhereInput = {}
  if (ORDER_STATUSES.includes(status as OrderStatus)) where.status = status
  if (q) {
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { trackingCode: { contains: q, mode: 'insensitive' } },
    ]
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: { select: { name: true, email: true } }, items: { select: { quantity: true } } },
  })

  const filters = [
    { value: '', label: 'Todos' },
    ...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABEL[value] })),
  ]

  return (
    <>
      <AdminHeader
        title="Pedidos"
        description="Acompanhe o que foi pago, o que está em separação e o que já saiu para entrega."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((filter) => {
            const href = filter.value ? `/admin/pedidos?status=${filter.value}` : '/admin/pedidos'
            const active = status === filter.value
            return (
              <Link
                key={filter.value || 'todos'}
                href={href}
                aria-current={active ? 'true' : undefined}
                className={
                  active
                    ? 'tag rounded-full bg-brand-900 px-3 py-1.5 font-semibold text-white'
                    : 'tag rounded-full border border-brand-100 bg-white px-3 py-1.5 font-semibold text-brand-800 transition-colors hover:border-brand-600'
                }
              >
                {filter.label}
              </Link>
            )
          })}
        </div>

        <form action="/admin/pedidos" className="ml-auto flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Número, cliente ou rastreio"
            aria-label="Buscar pedidos"
            className="field w-64"
          />
          <button type="submit" className="btn btn-outline btn-sm">
            Buscar
          </button>
        </form>
      </div>

      <DataTable
        empty={q || status ? 'Nenhum pedido com esse filtro.' : 'Nenhum pedido registrado ainda.'}
        head={
          <>
            <Th>Pedido</Th>
            <Th>Cliente</Th>
            <Th>Itens</Th>
            <Th>Status</Th>
            <Th>Pagamento</Th>
            <Th className="text-right">Total</Th>
          </>
        }
      >
        {orders.map((order) => (
          <tr key={order.id} className="transition-colors hover:bg-brand-50/50">
            <Td>
              <Link
                href={`/admin/pedidos/${order.id}`}
                className="font-mono text-xs font-semibold text-brand-700 hover:underline"
              >
                {order.number}
              </Link>
              <span className="mt-0.5 block text-xs text-ink-muted">
                {formatDate(order.createdAt)}
              </span>
            </Td>
            <Td>
              <span className="block font-medium">{order.user.name}</span>
              <span className="text-xs text-ink-muted">{order.user.email}</span>
            </Td>
            <Td className="font-mono text-xs">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)}
            </Td>
            <Td>
              <OrderStatusBadge status={order.status} />
            </Td>
            <Td>
              <PaymentStatusBadge status={order.paymentStatus} />
            </Td>
            <Td className="text-right font-display font-bold">{formatBRL(order.total)}</Td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
