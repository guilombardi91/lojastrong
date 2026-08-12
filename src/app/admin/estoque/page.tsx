import type { Metadata } from 'next'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import { pendingAlertCounts } from '@/lib/stock-alerts'
import { STOCK_REASON_LABEL, type StockReason } from '@/lib/enums'
import { StockAlertBadge, StockBadge } from '@/components/ui/badge'
import { AdminHeader, DataTable, Stat, Td, Th } from '@/components/admin/ui'
import { RestockForm } from '@/components/admin/restock-form'

export const metadata: Metadata = { title: 'Estoque' }

export default async function AdminEstoquePage({ searchParams }: PageProps<'/admin/estoque'>) {
  await requireAdmin()
  const params = await searchParams
  const filtro = typeof params.filtro === 'string' ? params.filtro : ''
  const q = typeof params.q === 'string' ? params.q.trim() : ''

  const where: Prisma.ProductVariantWhereInput = {}
  if (filtro === 'esgotado') where.stock = { lte: 0 }
  if (q) {
    where.OR = [{ sku: { contains: q.toUpperCase() } }, { product: { name: { contains: q } } }]
  }

  const [variants, movements] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      orderBy: { stock: 'asc' },
      take: 200,
      include: { product: { select: { id: true, name: true, category: { select: { name: true } } } } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { variant: { select: { sku: true } } },
    }),
  ])

  // "Repor" compara cada variante com o próprio limite, então o filtro roda
  // aqui e não no banco.
  const needsRestock = variants.filter((v) => v.stock <= v.lowStock && v.stock > 0)
  const soldOut = variants.filter((v) => v.stock <= 0)
  const totalUnits = variants.reduce((sum, v) => sum + v.stock, 0)
  const alertCounts = await pendingAlertCounts(soldOut.map((v) => v.id))

  const rows = filtro === 'repor' ? needsRestock : variants

  return (
    <>
      <AdminHeader
        title="Estoque"
        description="Uma linha por SKU. Some ou subtraia unidades direto na lista — tudo vira movimentação registrada."
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Unidades em estoque" value={String(totalUnits)} hint={`${variants.length} SKUs`} />
        <Stat
          label="Precisam de reposição"
          value={String(needsRestock.length)}
          hint="No limite de alerta ou abaixo"
          tone={needsRestock.length > 0 ? 'amber' : 'default'}
          href="/admin/estoque?filtro=repor"
        />
        <Stat
          label="Esgotados"
          value={String(soldOut.length)}
          hint="Fora de venda até repor"
          tone={soldOut.length > 0 ? 'danger' : 'default'}
          href="/admin/estoque?filtro=esgotado"
        />
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {[
            { value: '', label: 'Todos' },
            { value: 'repor', label: 'Repor' },
            { value: 'esgotado', label: 'Esgotados' },
          ].map((option) => {
            const active = filtro === option.value
            return (
              <Link
                key={option.value || 'todos'}
                href={option.value ? `/admin/estoque?filtro=${option.value}` : '/admin/estoque'}
                aria-current={active ? 'true' : undefined}
                className={
                  active
                    ? 'tag rounded-full bg-brand-900 px-3 py-1.5 font-semibold text-white'
                    : 'tag rounded-full border border-brand-100 bg-white px-3 py-1.5 font-semibold text-brand-800 transition-colors hover:border-brand-600'
                }
              >
                {option.label}
              </Link>
            )
          })}
        </div>

        <form action="/admin/estoque" className="ml-auto flex gap-2">
          {filtro && <input type="hidden" name="filtro" value={filtro} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="SKU ou produto"
            aria-label="Buscar no estoque"
            className="field w-56"
          />
          <button type="submit" className="btn btn-outline btn-sm">
            Buscar
          </button>
        </form>
      </div>

      {/* A coluna de movimentações só entra ao lado quando sobra largura para
          a tabela mostrar o botão de aplicar sem rolagem. */}
      <div className="grid gap-6 2xl:grid-cols-[1.75fr_1fr] 2xl:items-start">
        <DataTable
          minWidth="42rem"
          empty="Nenhuma variante com esse filtro."
          head={
            <>
              <Th>SKU</Th>
              <Th>Produto</Th>
              <Th>Variação</Th>
              <Th>Situação</Th>
              <Th className="text-right">Movimentar</Th>
            </>
          }
        >
          {rows.map((variant) => (
            <tr key={variant.id} className="transition-colors hover:bg-brand-50/50">
              <Td className="font-mono text-xs font-semibold text-brand-700">{variant.sku}</Td>
              <Td>
                <Link
                  href={`/admin/produtos/${variant.product.id}`}
                  className="font-medium hover:underline"
                >
                  {variant.product.name}
                </Link>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {variant.product.category.name}
                </span>
              </Td>
              <Td className="text-sm">
                {variant.size}
                {variant.color ? ` · ${variant.color}` : ''}
              </Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <StockBadge stock={variant.stock} lowStock={variant.lowStock} />
                  <StockAlertBadge count={alertCounts[variant.id] ?? 0} />
                </div>
              </Td>
              <Td>
                <RestockForm variantId={variant.id} />
              </Td>
            </tr>
          ))}
        </DataTable>

        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">
            Últimas movimentações
          </h2>

          {movements.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma movimentação registrada.</p>
          ) : (
            <ol className="divide-y divide-brand-100">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-start gap-3 py-2.5">
                  <span
                    className={
                      movement.delta > 0
                        ? 'font-mono text-sm font-bold text-amber-600'
                        : 'font-mono text-sm font-bold text-danger'
                    }
                  >
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-brand-700">
                      {movement.variant.sku}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {STOCK_REASON_LABEL[movement.reason as StockReason] ?? movement.reason} ·{' '}
                      {formatDateTime(movement.createdAt)}
                    </p>
                    {movement.note && (
                      <p className="mt-0.5 text-xs text-ink-muted">{movement.note}</p>
                    )}
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
