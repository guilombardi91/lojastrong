import Link from 'next/link'
import { REPORT_PERIODS, type ReportPeriodValue } from '@/lib/reports'

/** Filtro de período usado em todo /admin/relatorios — mesmo padrão de pílulas
 * já usado no filtro de /admin/estoque. */
export function PeriodFilter({ basePath, value }: { basePath: string; value: ReportPeriodValue }) {
  return (
    <div className="flex gap-1.5">
      {REPORT_PERIODS.map((option) => {
        const active = value === option.value
        return (
          <Link
            key={option.value}
            href={`${basePath}?periodo=${option.value}`}
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
