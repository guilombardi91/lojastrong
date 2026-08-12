import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { AdminHeader } from '@/components/admin/ui'
import { CategoryManager } from '@/components/admin/category-forms'

export const metadata: Metadata = { title: 'Categorias' }

export default async function AdminCategoriasPage() {
  await requireAdmin()

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { products: true } } },
  })

  return (
    <>
      <AdminHeader
        title="Categorias"
        description="As linhas que organizam o catálogo e aparecem no menu da loja."
      />

      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          emblem: category.emblem,
          sortOrder: category.sortOrder,
          active: category.active,
          productCount: category._count.products,
        }))}
      />
    </>
  )
}
