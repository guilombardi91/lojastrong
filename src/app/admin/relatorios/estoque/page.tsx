import type { Metadata } from 'next'
import Link from 'next/link'
import { formatBRL } from '@/lib/money'
import { resolvePeriod } from '@/lib/reports'
import { getEstoqueData } from '@/lib/report-data/estoque'
import { AdminHeader, DataTable, Stat, Td, Th } from '@/components/admin/ui'
import { PeriodFilter } from '@/components/admin/period-filter'
import { ExportButtons } from '@/components/admin/export-buttons'

export const metadata: Metadata = { title: 'Relatório de estoque' }

/** Este relatório é sobre capital parado e giro — a tela operacional do dia a
 * dia (repor, ajustar) continua em /admin/estoque. */
export default async function RelatorioEstoquePage({
  searchParams,
}: PageProps<'/admin/relatorios/estoque'>) {
  const params = await searchParams
  const { value: periodo, since } = resolvePeriod(params.periodo)
  const { variants, totalUnits, totalValue, categoryRows, parados } = await getEstoqueData(since)

  return (
    <>
      <AdminHeader
        title="Relatório de estoque"
        description="Capital parado por categoria e itens sem nenhuma venda no período. Para repor ou ajustar, use a tela de Estoque."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter basePath="/admin/relatorios/estoque" value={periodo} />
            <ExportButtons report="estoque" periodo={periodo} />
          </div>
        }
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Unidades em estoque" value={String(totalUnits)} hint={`${variants.length} SKUs ativos`} />
        <Stat label="Valor em estoque" value={formatBRL(totalValue)} hint="Ao preço de venda atual" />
        <Stat
          label="Sem venda no período"
          value={String(parados.length)}
          hint="Com estoque, zero saídas"
          tone={parados.length > 0 ? 'amber' : 'default'}
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-[1fr_1.3fr] xl:items-start">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Por categoria</h2>
          <DataTable
            empty="Nenhuma categoria com estoque."
            head={
              <>
                <Th>Categoria</Th>
                <Th className="text-right">Unidades</Th>
                <Th className="text-right">Valor</Th>
              </>
            }
          >
            {categoryRows.map((row) => (
              <tr key={row.name}>
                <Td>{row.name}</Td>
                <Td className="text-right font-mono text-xs">{row.units}</Td>
                <Td className="text-right font-display font-bold">{formatBRL(row.value)}</Td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">
            Parados no período
          </h2>
          <DataTable
            minWidth="34rem"
            empty="Toda variante com estoque teve ao menos uma venda no período."
            head={
              <>
                <Th>SKU</Th>
                <Th>Produto</Th>
                <Th className="text-right">Estoque</Th>
                <Th className="text-right">Valor parado</Th>
              </>
            }
          >
            {parados.slice(0, 50).map((row) => (
              <tr key={row.id}>
                <Td className="font-mono text-xs font-semibold text-brand-700">{row.sku}</Td>
                <Td>
                  <Link href={`/admin/estoque?q=${row.sku}`} className="hover:underline">
                    {row.name}
                  </Link>
                </Td>
                <Td className="text-right font-mono text-xs">{row.stock}</Td>
                <Td className="text-right font-display font-bold">{formatBRL(row.value)}</Td>
              </tr>
            ))}
          </DataTable>
          {parados.length > 50 && (
            <p className="mt-2 text-xs text-ink-muted">
              Mostrando 50 de {parados.length}. Exporte para ver a lista completa.
            </p>
          )}
        </section>
      </div>
    </>
  )
}
