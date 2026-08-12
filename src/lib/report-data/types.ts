// Forma comum que todo relatório produz para exportação — CSV e PDF são só
// duas maneiras diferentes de desenhar a mesma estrutura, então cada
// relatório monta isso uma vez e os dois formatos partem daqui.

export type ReportExport = {
  title: string
  periodLabel: string
  generatedAt: Date
  stats: { label: string; value: string; hint?: string }[]
  tables: { title: string; headers: string[]; rows: (string | number)[][] }[]
}
