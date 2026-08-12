import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { availableSizes, searchCatalog, toArray } from '@/lib/catalog'
import { CatalogFilters } from '@/components/loja/catalog-filters'
import { CatalogGrid } from '@/components/loja/catalog-grid'

export async function generateMetadata({
  params,
}: PageProps<'/categorias/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) return { title: 'Categoria não encontrada' }

  return {
    title: category.name,
    description: category.description ?? undefined,
  }
}

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { slug: true },
  })
  return categories.map((category) => ({ slug: category.slug }))
}

export default async function CategoriaPage({ params, searchParams }: PageProps<'/categorias/[slug]'>) {
  const { slug } = await params
  const query = await searchParams

  const category = await prisma.category.findFirst({ where: { slug, active: true } })
  if (!category) notFound()

  const [result, sizes] = await Promise.all([
    searchCatalog({
      lockedCategory: slug,
      q: typeof query.q === 'string' ? query.q.trim() : undefined,
      sizes: toArray(query.tamanho),
      maxPrice: Number(query.ate) || undefined,
      inStockOnly: query.disponivel === '1',
      sort: typeof query.ordenar === 'string' ? query.ordenar : undefined,
      page: Number(query.pagina) || 1,
    }),
    availableSizes(slug),
  ])

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Trilha" className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href="/produtos" className="hover:text-brand-700">
          Catálogo
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-brand-900">{category.name}</span>
      </nav>

      <header className="mb-8 max-w-2xl">
        <p className="tag mb-3 flex items-center gap-2 text-amber-600">
          <span aria-hidden className="text-lg">
            {category.emblem}
          </span>
          Linha
        </p>
        <h1 className="font-display text-4xl font-extrabold text-brand-950">{category.name}</h1>
        {category.description && <p className="mt-3 text-ink-muted">{category.description}</p>}
      </header>

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside className="card h-fit p-5 lg:sticky lg:top-28">
          <CatalogFilters
            categories={[]}
            sizes={sizes}
            action={`/categorias/${slug}`}
            query={{
              q: typeof query.q === 'string' ? query.q : undefined,
              tamanho: toArray(query.tamanho),
              ordenar: typeof query.ordenar === 'string' ? query.ordenar : undefined,
              disponivel: typeof query.disponivel === 'string' ? query.disponivel : undefined,
              ate: typeof query.ate === 'string' ? query.ate : undefined,
            }}
          />
        </aside>

        <CatalogGrid
          result={result}
          params={query}
          base={`/categorias/${slug}`}
          emptyAction={{ label: 'Ver todos os produtos', href: '/produtos' }}
        />
      </div>
    </div>
  )
}
