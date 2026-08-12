import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatBRL } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { OrderStatusBadge, PaymentStatusBadge, StockBadge } from '@/components/ui/badge'
import { AdminHeader, DataTable, Stat, Td, Th } from '@/components/admin/ui'

export const metadata: Metadata = { title: 'Painel' }

export default async function AdminPage() {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [paidOrders, pendingCount, orderCount, activeProducts, lowStock, recentOrders, topSellers] =
    await Promise.all([
      prisma.order.findMany({
        where: { paymentStatus: 'APPROVED', createdAt: { gte: since } },
        select: { total: true },
      }),
      prisma.order.count({ where: { paymentStatus: 'PENDING', status: { not: 'CANCELED' } } }),
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.product.count({ where: { active: true } }),
      prisma.productVariant.findMany({
        where: { active: true, product: { active: true } },
        include: { product: { select: { name: true, slug: true, id: true } } },
        orderBy: { stock: 'asc' },
        take: 40,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { name: true } }, items: { select: { id: true } } },
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ])

  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0)
  const averageTicket = paidOrders.length > 0 ? Math.round(revenue / paidOrders.length) : 0

  // "Repor" é a variante ativa que já cruzou o próprio limite de alerta.
  const needsRestock = lowStock.filter((variant) => variant.stock <= variant.lowStock)

  return (
    <>
      <AdminHeader
        eyebrow="Últimos 30 dias"
        title="Painel da loja"
        description="Faturamento, pedidos em aberto e o que precisa de reposição."
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Faturamento aprovado"
          value={formatBRL(revenue)}
          hint={`${paidOrders.length} ${paidOrders.length === 1 ? 'pedido pago' : 'pedidos pagos'}`}
          tone="success"
        />
        <Stat label="Pedidos no período" value={String(orderCount)} hint="Inclui não pagos" />
        <Stat
          label="Aguardando pagamento"
          value={String(pendingCount)}
          hint="Estoque já reservado"
          tone={pendingCount > 0 ? 'amber' : 'default'}
          href="/admin/pedidos?status=PENDING"
        />
        <Stat
          label="Ticket médio"
          value={formatBRL(averageTicket)}
          hint={`${activeProducts} produtos ativos`}
        />
      </section>

      {needsRestock.length > 0 && (
        <section className="mb-8">
          <div className="card border-amber-100 bg-amber-100/40 p-5">
            <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-amber-600">
              <AlertTriangle size={17} aria-hidden />
              {needsRestock.length}{' '}
              {needsRestock.length === 1 ? 'variante precisa' : 'variantes precisam'} de reposição
            </h2>
            <p className="mb-4 text-sm text-brand-800">
              Estoque igual ou abaixo do limite de alerta configurado.
            </p>

            <ul className="flex flex-wrap gap-2">
              {needsRestock.slice(0, 8).map((variant) => (
                <li key={variant.id}>
                  <Link
                    href={`/admin/produtos/${variant.product.id}`}
                    className="flex items-center gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2 text-sm transition-colors hover:border-amber-500"
                  >
                    <span className="font-medium text-brand-900">{variant.product.name}</span>
                    <span className="tag text-ink-muted">
                      {variant.size}
                      {variant.color ? ` · ${variant.color}` : ''}
                    </span>
                    <StockBadge stock={variant.stock} lowStock={variant.lowStock} />
                  </Link>
                </li>
              ))}
            </ul>

            {needsRestock.length > 8 && (
              <Link
                href="/admin/estoque"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 underline underline-offset-4"
              >
                Ver todas na tela de estoque
                <ArrowRight size={15} aria-hidden />
              </Link>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold text-brand-950">Pedidos recentes</h2>
            <Link
              href="/admin/pedidos"
              className="text-sm font-semibold text-brand-700 underline underline-offset-4"
            >
              Ver todos
            </Link>
          </div>

          <DataTable
            empty="Nenhum pedido ainda. Assim que a primeira compra entrar, ela aparece aqui."
            head={
              <>
                <Th>Pedido</Th>
                <Th>Cliente</Th>
                <Th>Status</Th>
                <Th>Pagamento</Th>
                <Th className="text-right">Total</Th>
              </>
            }
          >
            {recentOrders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-brand-50/50">
                <Td>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="font-mono text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {order.number}
                  </Link>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {formatDate(order.createdAt)} · {order.items.length} itens
                  </span>
                </Td>
                <Td>{order.user.name}</Td>
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
        </section>

        <section>
          <h2 className="mb-4 font-display text-xl font-bold text-brand-950">Mais vendidos</h2>

          {topSellers.length === 0 ? (
            <div className="card px-6 py-12 text-center text-sm text-ink-muted">
              Ainda não há vendas para ranquear.
            </div>
          ) : (
            <ol className="card divide-y divide-brand-100">
              {topSellers.map((item, index) => (
                <li key={item.productName} className="flex items-center gap-3 p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 font-mono text-xs font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-900">
                      {item.productName}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {item._sum.quantity} vendidos · {formatBRL(item._sum.total ?? 0)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}
