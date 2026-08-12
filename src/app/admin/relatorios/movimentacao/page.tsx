import type { Metadata } from 'next'
import { formatDateTime } from '@/lib/utils'
import { resolvePeriod } from '@/lib/reports'
import { getMovimentacaoData, parseMotivo } from '@/lib/report-data/movimentacao'
import { STOCK_REASONS, STOCK_REASON_LABEL, type StockReason } from '@/lib/enums'
import { AdminHeader, DataTable, Stat, Td, Th } from '@/components/admin/ui'
import { PeriodFilter } from '@/components/admin/period-filter'
import { ReasonFilter } from '@/components/admin/reason-filter'
import { ExportButtons } from '@/components/admin/export-buttons'

export const metadata: Metadata = { title: 'Relatório de movimentação' }

export default async function RelatorioMovimentacaoPage({
  searchParams,
}: PageProps<'/admin/relatorios/movimentacao'>) {
  const params = await searchParams
  const { value: periodo, since } = resolvePeriod(params.periodo)
  const motivo = parseMotivo(params.motivo)
  const { totalByReason, movements } = await getMovimentacaoData(since, motivo)

  return (
    <>
      <AdminHeader
        title="Relatório de movimentação"
        description="Toda entrada e saída de estoque no período, por motivo."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter basePath="/admin/relatorios/movimentacao" value={periodo} />
            <ExportButtons
              report="movimentacao"
              periodo={periodo}
              extra={motivo ? { motivo } : undefined}
            />
          </div>
        }
      />

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STOCK_REASONS.map((reason) => {
          const row = totalByReason.get(reason)
          const delta = row?._sum.delta ?? 0
          return (
            <Stat
              key={reason}
              label={STOCK_REASON_LABEL[reason]}
              value={`${delta > 0 ? '+' : ''}${delta}`}
              hint={`${row?._count._all ?? 0} movimentações`}
              tone={delta > 0 ? 'success' : delta < 0 ? 'danger' : 'default'}
            />
          )
        })}
      </section>

      <div className="mb-6">
        <ReasonFilter periodo={periodo} motivo={motivo} />
      </div>

      <DataTable
        empty="Nenhuma movimentação com esse filtro."
        head={
          <>
            <Th>Data</Th>
            <Th>SKU</Th>
            <Th>Produto</Th>
            <Th>Motivo</Th>
            <Th className="text-right">Unidades</Th>
          </>
        }
      >
        {movements.map((movement) => (
          <tr key={movement.id}>
            <Td className="text-xs text-ink-muted">{formatDateTime(movement.createdAt)}</Td>
            <Td className="font-mono text-xs font-semibold text-brand-700">{movement.variant.sku}</Td>
            <Td>{movement.variant.product.name}</Td>
            <Td className="text-xs">{STOCK_REASON_LABEL[movement.reason as StockReason] ?? movement.reason}</Td>
            <Td
              className={
                movement.delta > 0
                  ? 'text-right font-mono text-sm font-bold text-amber-600'
                  : 'text-right font-mono text-sm font-bold text-danger'
              }
            >
              {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
            </Td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
