import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { availableProductImages } from '@/lib/media'
import { AdminHeader } from '@/components/admin/ui'
import { ProductForm } from '@/components/admin/product-forms'

export const metadata: Metadata = { title: 'Novo produto' }

export default async function NovoProdutoPage() {
  await requireAdmin()

  const [categories, availableImages] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    availableProductImages(),
  ])

  return (
    <>
      <Link
        href="/admin/produtos"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
      >
        <ArrowLeft size={15} aria-hidden />
        Voltar para produtos
      </Link>

      <AdminHeader
        title="Novo produto"
        description="Cadastre o produto e, ao salvar, monte a grade de tamanhos e cores."
      />

      <div className="max-w-4xl">
        <ProductForm categories={categories} availableImages={availableImages} />
      </div>
    </>
  )
}
