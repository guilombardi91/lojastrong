import type { Metadata } from 'next'
import { availableSizes, categoriesWithCount, searchCatalog, toArray } from '@/lib/catalog'
import { CatalogFilters } from '@/components/loja/catalog-filters'
import { CatalogGrid } from '@/components/loja/catalog-grid'

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Todos os produtos da loja oficial da Strong Business School.',
}

export default async function ProdutosPage({ searchParams }: PageProps<'/produtos'>) {
  const params = await searchParams

  const q = typeof params.q === 'string' ? params.q.trim() : undefined
  const sort = typeof params.ordenar === 'string' ? params.ordenar : undefined
  const page = Number(params.pagina) || 1
  const maxPrice = Number(params.ate) || undefined

  const [result, categories, sizes] = await Promise.all([
    searchCatalog({
      q,
      categorySlugs: toArray(params.categoria),
      sizes: toArray(params.tamanho),
      maxPrice,
      inStockOnly: params.disponivel === '1',
      sort,
      page,
    }),
    categoriesWithCount(),
    availableSizes(),
  ])

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mb-8 max-w-2xl">
        <p className="tag mb-3 text-amber-600">Catálogo completo</p>
        <h1 className="font-display text-4xl font-extrabold text-brand-950">
          {q ? `Resultados para "${q}"` : 'Todos os produtos'}
        </h1>
        <p className="mt-3 text-ink-muted">
          {q
            ? 'Refine com os filtros ao lado para chegar mais perto do que procura.'
            : 'Canecas, camisas, agasalhos, canetas, cadernos e acessórios com a assinatura da escola.'}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside className="card h-fit p-5 lg:sticky lg:top-28">
          <CatalogFilters
            categories={categories}
            sizes={sizes}
            query={{
              q,
              categoria: toArray(params.categoria),
              tamanho: toArray(params.tamanho),
              ordenar: sort,
              disponivel: typeof params.disponivel === 'string' ? params.disponivel : undefined,
              ate: typeof params.ate === 'string' ? params.ate : undefined,
            }}
          />
        </aside>

        <CatalogGrid result={result} params={params} base="/produtos" />
      </div>
    </div>
  )
}
