import type { Metadata } from 'next'
import Link from 'next/link'
import { resolvePeriod } from '@/lib/reports'
import { getVisitasData, type VisitRanked } from '@/lib/report-data/visitas'
import { AdminHeader, Stat } from '@/components/admin/ui'
import { PeriodFilter } from '@/components/admin/period-filter'
import { ExportButtons } from '@/components/admin/export-buttons'

export const metadata: Metadata = { title: 'Visitas e conversão' }

function VisitList({ items, emptyText }: { items: VisitRanked[]; emptyText: string }) {
  if (items.length === 0) {
    return <div className="card px-6 py-12 text-center text-sm text-ink-muted">{emptyText}</div>
  }

  return (
    <ol className="card divide-y divide-brand-100">
      {items.map((item, index) => {
        const rate = item.uniqueVisitors > 0 ? Math.round((item.converted / item.uniqueVisitors) * 100) : null
        return (
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
                {item.totalViews} {item.totalViews === 1 ? 'visualização' : 'visualizações'} ·{' '}
                {item.uniqueVisitors} {item.uniqueVisitors === 1 ? 'visitante único' : 'visitantes únicos'}
                {rate !== null && ` · ${rate}% converteu`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default async function RelatorioVisitasPage({
  searchParams,
}: PageProps<'/admin/relatorios/visitas'>) {
  const params = await searchParams
  const { value: periodo, since } = resolvePeriod(params.periodo)
  const { products, totalViews, totalUniqueVisitors, mostVisited, leastVisited } = await getVisitasData(since)

  return (
    <>
      <AdminHeader
        title="Visitas e conversão"
        description="Visitante único conta uma vez por produto, mesmo com vários acessos. Conversão é o mesmo visitante voltando para comprar."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter basePath="/admin/relatorios/visitas" value={periodo} />
            <ExportButtons report="visitas" periodo={periodo} />
          </div>
        }
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <Stat label="Visualizações no período" value={String(totalViews)} hint={`${products.length} produtos ativos`} />
        <Stat label="Visitantes únicos" value={String(totalUniqueVisitors)} hint="Somando todos os produtos" />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Mais visitados</h2>
          <VisitList items={mostVisited} emptyText="Nenhuma visita registrada no período." />
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Menos visitados</h2>
          <VisitList items={leastVisited} emptyText="Nenhum produto ativo cadastrado." />
        </section>
      </div>
    </>
  )
}
