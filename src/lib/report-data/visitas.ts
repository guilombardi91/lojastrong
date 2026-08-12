import { prisma } from '../prisma'
import type { ReportExport } from './types'

export type VisitRanked = {
  id: string
  name: string
  totalViews: number
  uniqueVisitors: number
  converted: number
}

export async function getVisitasData(since: Date) {
  const [products, views, totalViewsRows, paidOrders] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, name: true } }),
    // distinct por produto+visitante: cada linha é "este visitante viu este
    // produto pelo menos uma vez no período" — a base do visitante único.
    prisma.productView.findMany({
      where: { createdAt: { gte: since } },
      distinct: ['productId', 'visitorId'],
      select: { productId: true, visitorId: true },
    }),
    prisma.productView.groupBy({
      by: ['productId'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: 'APPROVED', createdAt: { gte: since }, visitorId: { not: null } },
      select: { visitorId: true, items: { select: { variant: { select: { productId: true } } } } },
    }),
  ])

  const viewersByProduct = new Map<string, Set<string>>()
  for (const view of views) {
    const set = viewersByProduct.get(view.productId) ?? new Set<string>()
    set.add(view.visitorId)
    viewersByProduct.set(view.productId, set)
  }

  const totalViewsByProduct = new Map(totalViewsRows.map((row) => [row.productId, row._count._all]))

  // Um visitante "converteu" para um produto quando o mesmo visitorId que viu
  // a página também fechou um pedido aprovado contendo aquele produto — é
  // isso que faz da métrica uma conversão de verdade, não só uma razão entre
  // duas contagens desligadas uma da outra.
  const purchasersByProduct = new Map<string, Set<string>>()
  for (const order of paidOrders) {
    if (!order.visitorId) continue
    const productIds = new Set(
      order.items.map((item) => item.variant?.productId).filter((id): id is string => Boolean(id)),
    )
    for (const productId of productIds) {
      const set = purchasersByProduct.get(productId) ?? new Set<string>()
      set.add(order.visitorId)
      purchasersByProduct.set(productId, set)
    }
  }

  const ranked: VisitRanked[] = products.map((product) => {
    const viewers = viewersByProduct.get(product.id) ?? new Set<string>()
    const purchasers = purchasersByProduct.get(product.id)
    const converted = purchasers ? [...viewers].filter((visitorId) => purchasers.has(visitorId)).length : 0

    return {
      id: product.id,
      name: product.name,
      totalViews: totalViewsByProduct.get(product.id) ?? 0,
      uniqueVisitors: viewers.size,
      converted,
    }
  })

  const totalViews = ranked.reduce((sum, item) => sum + item.totalViews, 0)
  const totalUniqueVisitors = new Set(views.map((v) => v.visitorId)).size
  const mostVisited = [...ranked].sort((a, b) => b.totalViews - a.totalViews).slice(0, 10)
  const leastVisited = [...ranked].sort((a, b) => a.totalViews - b.totalViews).slice(0, 10)

  return { products, totalViews, totalUniqueVisitors, mostVisited, leastVisited }
}

export type VisitasData = Awaited<ReturnType<typeof getVisitasData>>

function visitRows(items: VisitRanked[]) {
  return items.map((item) => {
    const rate = item.uniqueVisitors > 0 ? `${Math.round((item.converted / item.uniqueVisitors) * 100)}%` : '—'
    return [item.name, item.totalViews, item.uniqueVisitors, rate]
  })
}

export function visitasToExport(data: VisitasData, periodLabel: string): ReportExport {
  return {
    title: 'Visitas e conversão',
    periodLabel,
    generatedAt: new Date(),
    stats: [
      { label: 'Visualizações no período', value: String(data.totalViews), hint: `${data.products.length} produtos ativos` },
      { label: 'Visitantes únicos', value: String(data.totalUniqueVisitors), hint: 'Somando todos os produtos' },
    ],
    tables: [
      {
        title: 'Mais visitados',
        headers: ['Produto', 'Visualizações', 'Visitantes únicos', 'Conversão'],
        rows: visitRows(data.mostVisited),
      },
      {
        title: 'Menos visitados',
        headers: ['Produto', 'Visualizações', 'Visitantes únicos', 'Conversão'],
        rows: visitRows(data.leastVisited),
      },
    ],
  }
}
