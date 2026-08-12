import type { Metadata } from 'next'
import { formatBRL } from '@/lib/money'
import { resolvePeriod } from '@/lib/reports'
import { getFinanceiroData } from '@/lib/report-data/financeiro'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, type OrderStatus, type PaymentMethod } from '@/lib/enums'
import { AdminHeader, DataTable, Stat, Td, Th } from '@/components/admin/ui'
import { PeriodFilter } from '@/components/admin/period-filter'
import { ExportButtons } from '@/components/admin/export-buttons'

export const metadata: Metadata = { title: 'Relatório financeiro' }

export default async function RelatorioFinanceiroPage({
  searchParams,
}: PageProps<'/admin/relatorios/financeiro'>) {
  const params = await searchParams
  const { value: periodo, since } = resolvePeriod(params.periodo)
  const { approved, byStatus, byMethod, byCoupon, revenue, discountTotal, shippingTotal, averageTicket } =
    await getFinanceiroData(since)

  return (
    <>
      <AdminHeader
        title="Relatório financeiro"
        description="Só pedidos com pagamento aprovado entram no faturamento — o resto é potencial, não receita."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter basePath="/admin/relatorios/financeiro" value={periodo} />
            <ExportButtons report="financeiro" periodo={periodo} />
          </div>
        }
      />

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Faturamento aprovado"
          value={formatBRL(revenue)}
          hint={`${approved.length} ${approved.length === 1 ? 'pedido pago' : 'pedidos pagos'}`}
          tone="success"
        />
        <Stat label="Ticket médio" value={formatBRL(averageTicket)} />
        <Stat label="Descontos concedidos" value={formatBRL(discountTotal)} />
        <Stat label="Frete cobrado" value={formatBRL(shippingTotal)} />
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Por meio de pagamento</h2>
          <DataTable
            empty="Nenhum pedido aprovado no período."
            head={
              <>
                <Th>Meio</Th>
                <Th className="text-right">Pedidos</Th>
                <Th className="text-right">Valor</Th>
              </>
            }
          >
            {byMethod.map((row) => (
              <tr key={row.paymentMethod}>
                <Td>{PAYMENT_METHOD_LABEL[row.paymentMethod as PaymentMethod] ?? row.paymentMethod}</Td>
                <Td className="text-right font-mono text-xs">{row._count._all}</Td>
                <Td className="text-right font-display font-bold">{formatBRL(row._sum.total ?? 0)}</Td>
              </tr>
            ))}
          </DataTable>
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Por status do pedido</h2>
          <DataTable
            empty="Nenhum pedido no período."
            head={
              <>
                <Th>Status</Th>
                <Th className="text-right">Pedidos</Th>
              </>
            }
          >
            {byStatus.map((row) => (
              <tr key={row.status}>
                <Td>{ORDER_STATUS_LABEL[row.status as OrderStatus] ?? row.status}</Td>
                <Td className="text-right font-mono text-xs">{row._count._all}</Td>
              </tr>
            ))}
          </DataTable>
        </section>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Cupons usados</h2>
        <DataTable
          empty="Nenhum cupom usado em pedido aprovado no período."
          head={
            <>
              <Th>Código</Th>
              <Th className="text-right">Pedidos</Th>
              <Th className="text-right">Desconto concedido</Th>
            </>
          }
        >
          {byCoupon.map((row) => (
            <tr key={row.couponCode}>
              <Td className="font-mono text-xs font-semibold text-brand-700">{row.couponCode}</Td>
              <Td className="text-right font-mono text-xs">{row._count._all}</Td>
              <Td className="text-right font-display font-bold">{formatBRL(row._sum.discount ?? 0)}</Td>
            </tr>
          ))}
        </DataTable>
      </section>
    </>
  )
}
