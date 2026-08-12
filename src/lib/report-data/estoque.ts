import { prisma } from '../prisma'
import { formatBRL } from '../money'
import type { ReportExport } from './types'

export async function getEstoqueData(since: Date) {
  const [variants, soldVariantIds] = await Promise.all([
    prisma.productVariant.findMany({
      where: { active: true, product: { active: true } },
      select: {
        id: true,
        stock: true,
        price: true,
        sku: true,
        product: {
          select: { name: true, basePrice: true, category: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.stockMovement.findMany({
      where: { reason: 'SALE', createdAt: { gte: since } },
      select: { variantId: true },
      distinct: ['variantId'],
    }),
  ])

  const soldSet = new Set(soldVariantIds.map((row) => row.variantId))

  let totalUnits = 0
  let totalValue = 0
  const byCategory = new Map<string, { name: string; units: number; value: number }>()
  const parados: { id: string; name: string; sku: string; stock: number; value: number }[] = []

  for (const variant of variants) {
    const unitValue = variant.price ?? variant.product.basePrice
    const value = variant.stock * unitValue
    totalUnits += variant.stock
    totalValue += value

    const category = variant.product.category
    const entry = byCategory.get(category.id) ?? { name: category.name, units: 0, value: 0 }
    entry.units += variant.stock
    entry.value += value
    byCategory.set(category.id, entry)

    if (variant.stock > 0 && !soldSet.has(variant.id)) {
      parados.push({ id: variant.id, name: variant.product.name, sku: variant.sku, stock: variant.stock, value })
    }
  }

  const categoryRows = [...byCategory.values()].sort((a, b) => b.value - a.value)
  parados.sort((a, b) => b.value - a.value)

  return { variants, totalUnits, totalValue, categoryRows, parados }
}

export type EstoqueData = Awaited<ReturnType<typeof getEstoqueData>>

export function estoqueToExport(data: EstoqueData, periodLabel: string): ReportExport {
  return {
    title: 'Relatório de estoque',
    periodLabel,
    generatedAt: new Date(),
    stats: [
      { label: 'Unidades em estoque', value: String(data.totalUnits), hint: `${data.variants.length} SKUs ativos` },
      { label: 'Valor em estoque', value: formatBRL(data.totalValue), hint: 'Ao preço de venda atual' },
      { label: 'Sem venda no período', value: String(data.parados.length), hint: 'Com estoque, zero saídas' },
    ],
    tables: [
      {
        title: 'Por categoria',
        headers: ['Categoria', 'Unidades', 'Valor'],
        rows: data.categoryRows.map((row) => [row.name, row.units, formatBRL(row.value)]),
      },
      {
        title: 'Parados no período',
        headers: ['SKU', 'Produto', 'Estoque', 'Valor parado'],
        rows: data.parados.map((row) => [row.sku, row.name, row.stock, formatBRL(row.value)]),
      },
    ],
  }
}
