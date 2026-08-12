import type { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { compareSizes } from './enums'

// Consulta do catálogo, compartilhada entre /produtos e /categorias/[slug].

export const PRODUCT_CARD_SELECT = {
  slug: true,
  name: true,
  tagline: true,
  basePrice: true,
  compareAt: true,
  featured: true,
  category: { select: { name: true, slug: true } },
  images: { orderBy: { sortOrder: 'asc' as const }, select: { url: true, alt: true } },
  variants: {
    where: { active: true },
    select: { sku: true, stock: true, colorHex: true, color: true },
  },
} satisfies Prisma.ProductSelect

export const PAGE_SIZE = 12

export type CatalogParams = {
  q?: string
  categorySlugs?: string[]
  sizes?: string[]
  maxPrice?: number
  inStockOnly?: boolean
  sort?: string
  page?: number
  /** Fixa a categoria da página, ignorando o filtro de linha. */
  lockedCategory?: string
}

function orderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'preco-asc':
      return [{ basePrice: 'asc' }]
    case 'preco-desc':
      return [{ basePrice: 'desc' }]
    case 'recentes':
      return [{ createdAt: 'desc' }]
    case 'nome':
      return [{ name: 'asc' }]
    default:
      return [{ featured: 'desc' }, { createdAt: 'desc' }]
  }
}

export async function searchCatalog(params: CatalogParams) {
  const page = Math.max(1, params.page ?? 1)

  const where: Prisma.ProductWhereInput = { active: true }

  if (params.lockedCategory) {
    where.category = { slug: params.lockedCategory }
  } else if (params.categorySlugs?.length) {
    where.category = { slug: { in: params.categorySlugs } }
  }

  if (params.q) {
    // O LIKE do SQLite já ignora caixa para ASCII; no PostgreSQL, acrescentar
    // `mode: 'insensitive'` a cada cláusula.
    where.OR = [
      { name: { contains: params.q } },
      { tagline: { contains: params.q } },
      { description: { contains: params.q } },
      { category: { name: { contains: params.q } } },
      { variants: { some: { sku: { contains: params.q.toUpperCase() } } } },
    ]
  }

  if (params.maxPrice) {
    where.basePrice = { lte: params.maxPrice }
  }

  // Tamanho e disponibilidade filtram pela variante, não pelo produto: o que
  // interessa é existir ao menos uma peça vendável naquele recorte.
  const variantFilters: Prisma.ProductVariantWhereInput = { active: true }
  if (params.sizes?.length) variantFilters.size = { in: params.sizes }
  if (params.inStockOnly) variantFilters.stock = { gt: 0 }

  if (params.sizes?.length || params.inStockOnly) {
    where.variants = { some: variantFilters }
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_CARD_SELECT,
      orderBy: orderBy(params.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ])

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  }
}

/**
 * Categorias com a contagem de produtos ativos, para a barra de filtros.
 * Linhas sem nenhum produto ficam de fora — filtrar por elas só devolveria
 * uma lista vazia.
 */
export async function categoriesWithCount() {
  const categories = await prisma.category.findMany({
    where: { active: true, products: { some: { active: true } } },
    orderBy: { sortOrder: 'asc' },
    select: {
      name: true,
      slug: true,
      _count: { select: { products: { where: { active: true } } } },
    },
  })

  return categories.map((category) => ({
    name: category.name,
    slug: category.slug,
    count: category._count.products,
  }))
}

/** Tamanhos existentes no catálogo, na ordem de vestuário e não alfabética. */
export async function availableSizes(categorySlug?: string) {
  const variants = await prisma.productVariant.findMany({
    where: {
      active: true,
      product: { active: true, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
    },
    select: { size: true },
    distinct: ['size'],
  })

  return variants.map((v) => v.size).sort(compareSizes)
}

/** Normaliza um parâmetro que pode vir ausente, único ou repetido na URL. */
export function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}
