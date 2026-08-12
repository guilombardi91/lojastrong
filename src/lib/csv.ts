import { formatDateTime } from './utils'
import type { ReportExport } from './report-data/types'

// Ponto e vírgula, não vírgula: o Excel em pt-BR usa vírgula como separador
// decimal, então trata ponto e vírgula como delimitador de coluna por padrão
// — com vírgula, cada linha cairia inteira numa única célula.

const BOM = '﻿' // sem ele, o Excel abre acento (ã, ç) corrompido em UTF-8.

function escapeCell(value: string | number): string {
  const text = String(value)
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function block(title: string, headers: string[], rows: (string | number)[][]): string {
  const lines = [[title], headers, ...rows]
  return lines.map((row) => row.map(escapeCell).join(';')).join('\r\n')
}

/** Um relatório inteiro (resumo + tabelas) num único arquivo CSV. */
export function reportToCSV(data: ReportExport): string {
  const blocks: string[] = []

  blocks.push(
    block(data.title, [], [
      [`Período: ${data.periodLabel}`],
      [`Gerado em: ${formatDateTime(data.generatedAt)}`],
    ]),
  )

  if (data.stats.length > 0) {
    blocks.push(
      block(
        'Resumo',
        ['Indicador', 'Valor', 'Observação'],
        data.stats.map((stat) => [stat.label, stat.value, stat.hint ?? '']),
      ),
    )
  }

  for (const table of data.tables) {
    blocks.push(block(table.title, table.headers, table.rows))
  }

  return BOM + blocks.join('\r\n\r\n')
}
