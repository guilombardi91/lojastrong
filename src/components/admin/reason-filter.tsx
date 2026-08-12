import Link from 'next/link'
import { STOCK_REASONS, STOCK_REASON_LABEL, type StockReason } from '@/lib/enums'
import type { ReportPeriodValue } from '@/lib/reports'

/** Filtro de motivo do relatório de movimentação, preservando o período escolhido. */
export function ReasonFilter({
  periodo,
  motivo,
}: {
  periodo: ReportPeriodValue
  motivo?: StockReason
}) {
  const options = [{ value: undefined, label: 'Todos' }, ...STOCK_REASONS.map((value) => ({
    value,
    label: STOCK_REASON_LABEL[value],
  }))]

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = motivo === option.value
        const href = option.value
          ? `/admin/relatorios/movimentacao?periodo=${periodo}&motivo=${option.value}`
          : `/admin/relatorios/movimentacao?periodo=${periodo}`
        return (
          <Link
            key={option.label}
            href={href}
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
  )
}
