import type { Metadata } from 'next'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'
import { resolvePeriod } from '@/lib/reports'
import { getVendasData, type Ranked } from '@/lib/report-data/vendas'
import { AdminHeader } from '@/components/admin/ui'
import { PeriodFilter } from '@/components/admin/period-filter'
import { ExportButtons } from '@/components/admin/export-buttons'

export const metadata: Metadata = { title: 'Mais e menos vendidos' }

function RankedList({ items, emptyText }: { items: Ranked[]; emptyText: string }) {
  if (items.length === 0) {
    return <div className="card px-6 py-12 text-center text-sm text-ink-muted">{emptyText}</div>
  }

  return (
    <ol className="card divide-y divide-brand-100">
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3 p-4">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 font-mono text-xs font-bold text-brand-700">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/produtos/${item.id}`}
              className="truncate text-sm font-semibold text-brand-900 hover:underline"
            >
              {item.name}
            </Link>
            <p className="text-xs text-ink-muted">
              {item.quantity} {item.quantity === 1 ? 'unidade vendida' : 'unidades vendidas'} ·{' '}
              {formatBRL(item.revenue)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default async function RelatorioVendasPage({
  searchParams,
}: PageProps<'/admin/relatorios/vendas'>) {
  const params = await searchParams
  const { value: periodo, since } = resolvePeriod(params.periodo)
  const { bestSellers, worstSellers } = await getVendasData(since)

  return (
    <>
      <AdminHeader
        title="Mais e menos vendidos"
        description="Unidades vendidas em pedidos aprovados no período, por produto ativo."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter basePath="/admin/relatorios/vendas" value={periodo} />
            <ExportButtons report="vendas" periodo={periodo} />
          </div>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Mais vendidos</h2>
          <RankedList items={bestSellers} emptyText="Nenhuma venda aprovada no período." />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Menos vendidos</h2>
          <RankedList items={worstSellers} emptyText="Nenhum produto ativo cadastrado." />
        </section>
      </div>
    </>
  )
}
