import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatBRL } from '@/lib/money'
import { Badge, StockBadge } from '@/components/ui/badge'
import { AdminHeader, DataTable, Td, Th } from '@/components/admin/ui'
import { ToggleProduct } from '@/components/admin/product-forms'

export const metadata: Metadata = { title: 'Produtos' }

export default async function AdminProdutosPage({ searchParams }: PageProps<'/admin/produtos'>) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q.trim() : ''
  const categoria = typeof params.categoria === 'string' ? params.categoria : ''

  const where: Prisma.ProductWhereInput = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } },
    ]
  }
  if (categoria) where.categoryId = categoria

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { select: { stock: true, lowStock: true, active: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <>
      <AdminHeader
        title="Produtos"
        description="Cadastre peças, defina a grade de tamanhos e cores e controle o que aparece na vitrine."
        action={
          <Link href="/admin/produtos/novo" className="btn btn-primary">
            <Plus size={17} aria-hidden />
            Novo produto
          </Link>
        }
      />

      <form action="/admin/produtos" className="mb-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nome ou SKU"
          aria-label="Buscar produtos"
          className="field w-64"
        />
        <select name="categoria" defaultValue={categoria} className="field w-52" aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-outline btn-sm">
          Filtrar
        </button>
      </form>

      <DataTable
        empty={q || categoria ? 'Nenhum produto com esse filtro.' : 'Nenhum produto cadastrado.'}
        head={
          <>
            <Th>Produto</Th>
            <Th>Categoria</Th>
            <Th>Grade</Th>
            <Th>Estoque</Th>
            <Th className="text-right">Preço</Th>
            <Th className="text-right">Ações</Th>
          </>
        }
      >
        {products.map((product) => {
          const stock = product.variants
            .filter((variant) => variant.active)
            .reduce((sum, variant) => sum + variant.stock, 0)
          const lowest = Math.min(...product.variants.map((variant) => variant.lowStock), 5)

          return (
            <tr key={product.id} className="transition-colors hover:bg-brand-50/50">
              <Td>
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-paper">
                    {product.images[0] && (
                      <Image
                        src={product.images[0].url}
                        alt=""
                        fill
                        sizes="2.75rem"
                        className="object-contain p-1"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/admin/produtos/${product.id}`}
                      className="font-semibold text-brand-900 hover:underline"
                    >
                      {product.name}
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {!product.active && <Badge tone="danger">Inativo</Badge>}
                      {product.featured && <Badge tone="brand">Destaque</Badge>}
                    </div>
                  </div>
                </div>
              </Td>
              <Td className="text-sm text-ink-muted">{product.category.name}</Td>
              <Td className="font-mono text-xs">{product.variants.length}</Td>
              <Td>
                <StockBadge stock={stock} lowStock={lowest} />
              </Td>
              <Td className="text-right">
                <span className="font-display font-bold">{formatBRL(product.basePrice)}</span>
                {product.compareAt && (
                  <span className="ml-2 text-xs text-ink-muted line-through">
                    {formatBRL(product.compareAt)}
                  </span>
                )}
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1.5">
                  <ToggleProduct id={product.id} active={product.active} />
                  <Link href={`/admin/produtos/${product.id}`} className="btn btn-outline btn-sm">
                    Editar
                  </Link>
                </div>
              </Td>
            </tr>
          )
        })}
      </DataTable>
    </>
  )
}
