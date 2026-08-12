import Image from 'next/image'
import Link from 'next/link'
import { Price } from '@/components/ui/price'
import { cn } from '@/lib/utils'

export type ProductCardData = {
  slug: string
  name: string
  tagline: string | null
  basePrice: number
  compareAt: number | null
  featured: boolean
  category: { name: string; slug: string }
  images: { url: string; alt: string }[]
  variants: { sku: string; stock: number; colorHex: string | null; color: string | null }[]
}

/**
 * Card do catálogo.
 *
 * A faixa inferior é a "ficha" da peça: SKU e categoria em monoespaçada, no
 * mesmo espírito da etiqueta de patrimônio que a escola cola nos seus itens.
 */
export function ProductCard({ product, className }: { product: ProductCardData; className?: string }) {
  const image = product.images[0]
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0)
  const soldOut = totalStock <= 0
  const lastUnits = !soldOut && totalStock <= 5

  // Cores distintas viram amostras; peças de cor única não ganham a fileira.
  const swatches = [
    ...new Map(
      product.variants
        .filter((v) => v.colorHex)
        .map((v) => [v.colorHex, { hex: v.colorHex!, name: v.color ?? '' }]),
    ).values(),
  ]

  return (
    <article
      className={cn(
        'tilt card group relative flex flex-col overflow-hidden shadow-[var(--shadow-lift)]',
        className,
      )}
    >
      <Link href={`/produtos/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-paper to-paper-dim">
          {/* Halo âmbar que acende sob a peça quando o card ganha atenção. */}
          <div
            className="absolute inset-8 rounded-full bg-amber-500/0 blur-2xl transition-colors duration-500 group-hover:bg-amber-500/25"
            aria-hidden
          />
          {image ? (
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
              className={cn(
                'relative object-contain p-3 transition-transform duration-500 group-hover:scale-[1.06]',
                soldOut && 'opacity-45 saturate-0',
              )}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-muted">Sem imagem</div>
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.featured && (
              <span className="tag rounded-full bg-gradient-to-r from-brand-800 to-brand-600 px-2.5 py-1 font-semibold text-white shadow-[var(--shadow-lift)]">
                Destaque
              </span>
            )}
            {soldOut && (
              <span className="tag rounded-full bg-white px-2.5 py-1 font-semibold text-ink-muted">
                Esgotado
              </span>
            )}
            {lastUnits && (
              <span className="tag rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-2.5 py-1 font-semibold text-brand-950 shadow-[var(--shadow-amber)]">
                Últimas {totalStock}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-4 pb-3 pt-4">
          <h3 className="font-display text-[1.0625rem] font-bold leading-snug text-brand-950">
            {product.name}
          </h3>
          {product.tagline && (
            <p className="line-clamp-2 text-sm leading-snug text-ink-muted">{product.tagline}</p>
          )}

          {swatches.length > 1 && (
            <ul className="mt-auto flex items-center gap-1.5 pt-1" aria-label="Cores disponíveis">
              {swatches.map((swatch) => (
                <li
                  key={swatch.hex}
                  title={swatch.name}
                  className="h-3.5 w-3.5 rounded-full border border-brand-100"
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </ul>
          )}

          <Price
            cents={product.basePrice}
            compareAt={product.compareAt}
            className="mt-auto pt-1.5"
          />
        </div>
      </Link>

      <div className="flex items-center justify-between gap-2 border-t border-brand-100 bg-brand-50/60 px-4 py-2.5">
        <span className="tag text-ink-muted">{product.category.name}</span>
        <span className="tag text-brand-600">{product.variants[0]?.sku ?? '—'}</span>
      </div>
    </article>
  )
}
