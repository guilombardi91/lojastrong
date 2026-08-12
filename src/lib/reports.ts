// Período compartilhado por todas as telas de /admin/relatorios. Fica aqui
// para o filtro e a consulta usarem exatamente a mesma tabela de opções.

export const REPORT_PERIODS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: '365', label: '12 meses' },
] as const

export type ReportPeriodValue = (typeof REPORT_PERIODS)[number]['value']

const DEFAULT_PERIOD: ReportPeriodValue = '30'

/** Resolve `?periodo=` num período válido e na data de início correspondente. */
export function resolvePeriod(periodo: string | string[] | undefined): {
  value: ReportPeriodValue
  since: Date
} {
  const raw = Array.isArray(periodo) ? periodo[0] : periodo
  const value = REPORT_PERIODS.some((p) => p.value === raw) ? (raw as ReportPeriodValue) : DEFAULT_PERIOD

  const since = new Date()
  since.setDate(since.getDate() - Number(value))
  since.setHours(0, 0, 0, 0)

  return { value, since }
}
