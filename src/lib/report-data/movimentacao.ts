import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { formatDateTime } from '../utils'
import { STOCK_REASONS, STOCK_REASON_LABEL, type StockReason } from '../enums'
import type { ReportExport } from './types'

export function parseMotivo(raw: string | string[] | undefined): StockReason | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw
  return STOCK_REASONS.includes(value as StockReason) ? (value as StockReason) : undefined
}

export async function getMovimentacaoData(since: Date, motivo?: StockReason) {
  const where: Prisma.StockMovementWhereInput = { createdAt: { gte: since } }
  if (motivo) where.reason = motivo

  const [totals, movements] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ['reason'],
      where: { createdAt: { gte: since } },
      _sum: { delta: true },
      _count: { _all: true },
    }),
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: { variant: { select: { sku: true, product: { select: { name: true } } } } },
    }),
  ])

  const totalByReason = new Map(totals.map((row) => [row.reason, row]))

  return { totalByReason, movements }
}

export type MovimentacaoData = Awaited<ReturnType<typeof getMovimentacaoData>>

export function movimentacaoToExport(data: MovimentacaoData, periodLabel: string): ReportExport {
  return {
    title: 'Relatório de movimentação',
    periodLabel,
    generatedAt: new Date(),
    stats: STOCK_REASONS.map((reason) => {
      const row = data.totalByReason.get(reason)
      const delta = row?._sum.delta ?? 0
      return {
        label: STOCK_REASON_LABEL[reason],
        value: `${delta > 0 ? '+' : ''}${delta}`,
        hint: `${row?._count._all ?? 0} movimentações`,
      }
    }),
    tables: [
      {
        title: 'Movimentações',
        headers: ['Data', 'SKU', 'Produto', 'Motivo', 'Unidades'],
        rows: data.movements.map((movement) => [
          formatDateTime(movement.createdAt),
          movement.variant.sku,
          movement.variant.product.name,
          STOCK_REASON_LABEL[movement.reason as StockReason] ?? movement.reason,
          movement.delta > 0 ? `+${movement.delta}` : movement.delta,
        ]),
      },
    ],
  }
}
