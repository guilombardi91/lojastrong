import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard, type ProductCardData } from './product-card'
import { EmptyState } from '@/components/ui/feedback'
import { SORT_OPTIONS } from './catalog-filters'

/** Reconstrói a query preservando os filtros e trocando um único parâmetro. */
function buildHref(
  base: string,
  params: Record<string, string | string[] | undefined>,
  override: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (key in override) continue
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v))
    else if (value) search.set(key, value)
  }

  for (const [key, value] of Object.entries(override)) {
    if (value) search.set(key, value)
  }

  const query = search.toString()
  return query ? `${base}?${query}` : base
}

export function CatalogGrid({
  result,
  params,
  base,
  emptyAction,
}: {
  result: { items: ProductCardData[]; total: number; page: number; pageCount: number }
  params: Record<string, string | string[] | undefined>
  base: string
  emptyAction?: { label: string; href: string }
}) {
  if (result.items.length === 0) {
    return (
      <EmptyState
        title="Nenhum produto com esses filtros"
        description="Tente remover um filtro ou buscar por outro termo. O catálogo inteiro continua a um clique."
        action={emptyAction ?? { label: 'Ver todos os produtos', href: '/produtos' }}
      />
    )
  }

  const currentSort = typeof params.ordenar === 'string' ? params.ordenar : 'destaques'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          <strong className="font-semibold text-brand-900">{result.total}</strong>{' '}
          {result.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="tag mr-1 text-ink-muted">Ordenar</span>
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={buildHref(base, params, { ordenar: option.value, pagina: undefined })}
              aria-current={currentSort === option.value ? 'true' : undefined}
              className={
                currentSort === option.value
                  ? 'tag rounded-full bg-brand-900 px-3 py-1.5 font-semibold text-white'
                  : 'tag rounded-full border border-brand-100 bg-white px-3 py-1.5 font-semibold text-brand-800 transition-colors hover:border-brand-600'
              }
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {result.items.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      {result.pageCount > 1 && (
        <nav className="flex items-center justify-center gap-2 pt-2" aria-label="Paginação">
          <Link
            href={buildHref(base, params, { pagina: String(result.page - 1) })}
            aria-disabled={result.page === 1}
            className={
              result.page === 1
                ? 'btn btn-outline btn-sm pointer-events-none opacity-45'
                : 'btn btn-outline btn-sm'
            }
          >
            <ChevronLeft size={16} aria-hidden />
            Anterior
          </Link>

          <span className="font-mono text-sm text-ink-muted">
            {result.page} / {result.pageCount}
          </span>

          <Link
            href={buildHref(base, params, { pagina: String(result.page + 1) })}
            aria-disabled={result.page === result.pageCount}
            className={
              result.page === result.pageCount
                ? 'btn btn-outline btn-sm pointer-events-none opacity-45'
                : 'btn btn-outline btn-sm'
            }
          >
            Próxima
            <ChevronRight size={16} aria-hidden />
          </Link>
        </nav>
      )}
    </div>
  )
}
