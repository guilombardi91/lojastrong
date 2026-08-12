import Link from 'next/link'
import { SlidersHorizontal } from 'lucide-react'
import { formatBRL } from '@/lib/money'

export type CatalogQuery = {
  q?: string
  categoria?: string[]
  tamanho?: string[]
  ordenar?: string
  disponivel?: string
  ate?: string
}

export const SORT_OPTIONS = [
  { value: 'destaques', label: 'Destaques' },
  { value: 'recentes', label: 'Novidades' },
  { value: 'preco-asc', label: 'Menor preço' },
  { value: 'preco-desc', label: 'Maior preço' },
  { value: 'nome', label: 'Nome (A–Z)' },
] as const

const PRICE_CEILINGS = [
  { value: '5000', label: `Até ${formatBRL(5000)}` },
  { value: '10000', label: `Até ${formatBRL(10000)}` },
  { value: '20000', label: `Até ${formatBRL(20000)}` },
]

/**
 * Filtros como formulário GET: a URL guarda o estado, a página continua
 * compartilhável e tudo funciona antes do JavaScript carregar.
 */
export function CatalogFilters({
  categories,
  sizes,
  query,
  action = '/produtos',
}: {
  categories: { name: string; slug: string; count: number }[]
  sizes: string[]
  query: CatalogQuery
  action?: string
}) {
  const selectedCategories = query.categoria ?? []
  const selectedSizes = query.tamanho ?? []
  const hasFilters =
    selectedCategories.length > 0 ||
    selectedSizes.length > 0 ||
    Boolean(query.disponivel) ||
    Boolean(query.ate) ||
    Boolean(query.q)

  return (
    <form action={action} className="flex flex-col gap-7">
      {query.q && <input type="hidden" name="q" value={query.q} />}
      {query.ordenar && <input type="hidden" name="ordenar" value={query.ordenar} />}

      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-brand-950">
          <SlidersHorizontal size={16} aria-hidden />
          Filtrar
        </h2>
        {hasFilters && (
          <Link href={action} className="text-xs font-semibold text-brand-600 underline underline-offset-2">
            Limpar
          </Link>
        )}
      </div>

      {categories.length > 1 && (
        <fieldset>
          <legend className="tag mb-3 text-ink-muted">Linha</legend>
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <label key={category.slug} className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  name="categoria"
                  value={category.slug}
                  defaultChecked={selectedCategories.includes(category.slug)}
                  className="h-4 w-4 shrink-0 accent-brand-700"
                />
                <span className="text-brand-900">{category.name}</span>
                <span className="tag ml-auto text-ink-muted">{category.count}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="tag mb-3 text-ink-muted">Tamanho</legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <label key={size} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="tamanho"
                  value={size}
                  defaultChecked={selectedSizes.includes(size)}
                  className="peer sr-only"
                />
                <span className="tag block rounded-lg border border-brand-100 bg-white px-3 py-1.5 font-semibold text-brand-800 transition-colors peer-checked:border-brand-900 peer-checked:bg-brand-900 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amber-500">
                  {size}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="tag mb-3 text-ink-muted">Preço</legend>
        <div className="flex flex-col gap-2">
          {PRICE_CEILINGS.map((ceiling) => (
            <label key={ceiling.value} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="radio"
                name="ate"
                value={ceiling.value}
                defaultChecked={query.ate === ceiling.value}
                className="h-4 w-4 shrink-0 accent-brand-700"
              />
              <span className="text-brand-900">{ceiling.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="disponivel"
          value="1"
          defaultChecked={query.disponivel === '1'}
          className="h-4 w-4 shrink-0 accent-brand-700"
        />
        <span className="text-brand-900">Somente em estoque</span>
      </label>

      <button type="submit" className="btn btn-primary btn-sm">
        Aplicar filtros
      </button>
    </form>
  )
}
