import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { availableProductImages } from '@/lib/media'
import { formatDateTime } from '@/lib/utils'
import { STOCK_REASON_LABEL, type StockReason } from '@/lib/enums'
import { AdminHeader } from '@/components/admin/ui'
import { DeleteProduct, ProductForm, VariantManager } from '@/components/admin/product-forms'

export const metadata: Metadata = { title: 'Editar produto' }

export default async function EditarProdutoPage({ params }: PageProps<'/admin/produtos/[id]'>) {
  await requireAdmin()
  const { id } = await params

  const [product, categories, availableImages] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        // Por SKU, não por id: cuid não é cronológico e a grade sairia
        // embaralhada a cada abertura da tela.
        variants: { orderBy: { sku: 'asc' } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    availableProductImages(),
  ])

  if (!product) notFound()

  const movements = await prisma.stockMovement.findMany({
    where: { variant: { productId: id } },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { variant: { select: { sku: true } } },
  })

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
        title={product.name}
        description="Altere os dados da peça, a galeria e a grade de estoque."
        action={
          <Link
            href={`/produtos/${product.slug}`}
            className="btn btn-outline"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} aria-hidden />
            Ver na loja
          </Link>
        }
      />

      <div className="grid max-w-6xl gap-6 xl:grid-cols-[1.6fr_1fr] xl:items-start">
        <div className="flex flex-col gap-6">
          <ProductForm
            categories={categories}
            availableImages={availableImages}
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              tagline: product.tagline ?? '',
              description: product.description,
              categoryId: product.categoryId,
              basePrice: product.basePrice,
              compareAt: product.compareAt,
              weightGrams: product.weightGrams,
              active: product.active,
              featured: product.featured,
              images: product.images.map((image) => image.url),
            }}
          />

          <VariantManager
            productId={product.id}
            basePrice={product.basePrice}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              price: variant.price,
              stock: variant.stock,
              lowStock: variant.lowStock,
              active: variant.active,
            }))}
          />

          <DeleteProduct id={product.id} />
        </div>

        <section className="card p-5 xl:sticky xl:top-8">
          <h2 className="mb-1 font-display text-lg font-bold text-brand-950">
            Movimentações de estoque
          </h2>
          <p className="mb-4 text-sm text-ink-muted">
            Toda entrada e saída fica registrada, com a origem.
          </p>

          {movements.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma movimentação registrada.</p>
          ) : (
            <ol className="divide-y divide-brand-100">
              {movements.map((movement) => (
                <li key={movement.id} className="flex items-start gap-3 py-2.5">
                  <span
                    className={
                      movement.delta > 0
                        ? 'font-mono text-sm font-bold text-amber-600'
                        : 'font-mono text-sm font-bold text-danger'
                    }
                  >
                    {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs font-semibold text-brand-700">
                      {movement.variant.sku}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {STOCK_REASON_LABEL[movement.reason as StockReason] ?? movement.reason} ·{' '}
                      {formatDateTime(movement.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  )
}
