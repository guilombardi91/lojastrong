import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { REPORT_PERIODS, resolvePeriod } from '@/lib/reports'
import { reportToCSV } from '@/lib/csv'
import { buildReportPdf } from '@/lib/report-data/pdf'
import type { ReportExport } from '@/lib/report-data/types'
import { getFinanceiroData, financeiroToExport } from '@/lib/report-data/financeiro'
import { getVendasData, vendasToExport } from '@/lib/report-data/vendas'
import { getEstoqueData, estoqueToExport } from '@/lib/report-data/estoque'
import { getMovimentacaoData, movimentacaoToExport, parseMotivo } from '@/lib/report-data/movimentacao'
import { getVisitasData, visitasToExport } from '@/lib/report-data/visitas'
import { getUsuariosData, usuariosToExport } from '@/lib/report-data/usuarios'

// Rota separada da tela: layouts do App Router não envolvem route handlers,
// então o guard de admin precisa ser chamado aqui também.

const REPORTS = ['financeiro', 'vendas', 'estoque', 'movimentacao', 'visitas', 'usuarios'] as const
type ReportName = (typeof REPORTS)[number]

async function buildExport(
  report: ReportName,
  since: Date,
  periodLabel: string,
  searchParams: URLSearchParams,
): Promise<ReportExport> {
  switch (report) {
    case 'financeiro':
      return financeiroToExport(await getFinanceiroData(since), periodLabel)
    case 'vendas':
      return vendasToExport(await getVendasData(since), periodLabel)
    case 'estoque':
      return estoqueToExport(await getEstoqueData(since), periodLabel)
    case 'movimentacao': {
      const motivo = parseMotivo(searchParams.get('motivo') ?? undefined)
      return movimentacaoToExport(await getMovimentacaoData(since, motivo), periodLabel)
    }
    case 'visitas':
      return visitasToExport(await getVisitasData(since), periodLabel)
    case 'usuarios':
      return usuariosToExport(await getUsuariosData(since), periodLabel)
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ report: string }> }) {
  await requireAdmin()

  const { report } = await params
  if (!REPORTS.includes(report as ReportName)) {
    return NextResponse.json({ error: 'Relatório desconhecido.' }, { status: 404 })
  }

  const url = new URL(request.url)
  const { value: periodoValue, since } = resolvePeriod(url.searchParams.get('periodo') ?? undefined)
  const periodLabel = REPORT_PERIODS.find((option) => option.value === periodoValue)?.label ?? periodoValue
  const formato = url.searchParams.get('formato') === 'pdf' ? 'pdf' : 'csv'

  const data = await buildExport(report as ReportName, since, periodLabel, url.searchParams)
  const filename = `${report}-${periodoValue}dias.${formato}`

  if (formato === 'pdf') {
    const buffer = await buildReportPdf(data)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const csv = reportToCSV(data)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
