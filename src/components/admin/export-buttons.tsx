import { FileSpreadsheet, FileText } from 'lucide-react'
import type { ReportPeriodValue } from '@/lib/reports'

/** Baixa direto pelo navegador — sem JS, é só um link para a rota de export
 * com o mesmo período (e filtros extras) que a tela está mostrando. */
export function ExportButtons({
  report,
  periodo,
  extra,
}: {
  report: string
  periodo: ReportPeriodValue
  extra?: Record<string, string>
}) {
  const href = (formato: 'csv' | 'pdf') => {
    const params = new URLSearchParams({ periodo, formato, ...extra })
    return `/admin/relatorios/${report}/export?${params}`
  }

  return (
    <div className="flex gap-2">
      <a href={href('csv')} className="btn btn-outline btn-sm" download>
        <FileSpreadsheet size={14} aria-hidden />
        Excel
      </a>
      <a href={href('pdf')} className="btn btn-outline btn-sm" download>
        <FileText size={14} aria-hidden />
        PDF
      </a>
    </div>
  )
}
