import { prisma } from '../prisma'
import { formatBRL } from '../money'
import type { ReportExport } from './types'

export type Ranked = { id: string; name: string; quantity: number; revenue: number }

export async function getVendasData(since: Date) {
  // Parte de todo o catálogo ativo — não só do que já vendeu — para que
  // "menos vendidos" traga também quem nunca saiu, não só o pior colocado
  // entre quem já vendeu ao menos uma unidade.
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, variants: { select: { id: true } } },
  })

  const sold = await prisma.orderItem.groupBy({
    by: ['variantId'],
    where: {
      variantId: { in: products.flatMap((p) => p.variants.map((v) => v.id)) },
      order: { paymentStatus: 'APPROVED', createdAt: { gte: since } },
    },
    _sum: { quantity: true, total: true },
  })

  const byVariant = new Map(sold.map((row) => [row.variantId, row]))

  const ranked: Ranked[] = products.map((product) => {
    let quantity = 0
    let revenue = 0
    for (const variant of product.variants) {
      const row = byVariant.get(variant.id)
      quantity += row?._sum.quantity ?? 0
      revenue += row?._sum.total ?? 0
    }
    return { id: product.id, name: product.name, quantity, revenue }
  })

  const bestSellers = [...ranked].sort((a, b) => b.quantity - a.quantity).slice(0, 10)
  const worstSellers = [...ranked].sort((a, b) => a.quantity - b.quantity).slice(0, 10)

  return { bestSellers, worstSellers }
}

export type VendasData = Awaited<ReturnType<typeof getVendasData>>

function rankedRows(items: Ranked[]) {
  return items.map((item) => [item.name, item.quantity, formatBRL(item.revenue)])
}

export function vendasToExport(data: VendasData, periodLabel: string): ReportExport {
  return {
    title: 'Mais e menos vendidos',
    periodLabel,
    generatedAt: new Date(),
    stats: [],
    tables: [
      { title: 'Mais vendidos', headers: ['Produto', 'Unidades', 'Receita'], rows: rankedRows(data.bestSellers) },
      { title: 'Menos vendidos', headers: ['Produto', 'Unidades', 'Receita'], rows: rankedRows(data.worstSellers) },
    ],
  }
}
