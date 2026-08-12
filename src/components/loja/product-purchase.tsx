'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LoaderCircle, Minus, Plus, ShoppingBag, TriangleAlert } from 'lucide-react'
import { addToCartAction } from '@/app/actions/cart'
import { Installments, Price } from '@/components/ui/price'
import { compareSizes } from '@/lib/enums'
import { cn } from '@/lib/utils'

export type PurchaseVariant = {
  id: string
  sku: string
  size: string
  color: string | null
  colorHex: string | null
  price: number | null
  stock: number
  lowStock: number
}

/**
 * Painel de compra: escolha da variante, quantidade e envio ao carrinho.
 *
 * A cor é escolhida primeiro porque é o que muda a foto; o tamanho vem em
 * seguida e desabilita o que não existe naquela cor, em vez de esconder — o
 * comprador precisa ver que o GG existe mesmo quando esgotou.
 */
export function ProductPurchase({
  basePrice,
  compareAt,
  variants,
  onColorChange,
}: {
  basePrice: number
  compareAt: number | null
  variants: PurchaseVariant[]
  onColorChange?: (color: string | null) => void
}) {
  const colors = useMemo(
    () => [
      ...new Map(
        variants.filter((v) => v.color).map((v) => [v.color!, { name: v.color!, hex: v.colorHex }]),
      ).values(),
    ],
    [variants],
  )

  const sizes = useMemo(
    () =>
      [...new Set(variants.map((v) => v.size))]
        .filter((size) => size !== 'Único')
        .sort(compareSizes),
    [variants],
  )

  // Abre na primeira cor com peça disponível e, dentro dela, no menor tamanho
  // da grade — não no que a consulta devolveu primeiro.
  const firstAvailable = useMemo(() => {
    const disponiveis = variants.filter((v) => v.stock > 0)
    if (disponiveis.length === 0) return variants[0]

    const cor = disponiveis[0].color
    return (
      [...disponiveis]
        .filter((v) => v.color === cor)
        .sort((a, b) => compareSizes(a.size, b.size))[0] ?? disponiveis[0]
    )
  }, [variants])

  const [color, setColor] = useState<string | null>(firstAvailable?.color ?? null)
  const [size, setSize] = useState<string>(firstAvailable?.size ?? 'Único')
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const selected = variants.find(
    (v) => v.size === size && (colors.length === 0 || v.color === color),
  )

  const price = selected?.price ?? basePrice
  const stock = selected?.stock ?? 0
  const soldOut = stock <= 0
  const lastUnits = !soldOut && stock <= (selected?.lowStock ?? 5)

  function pickColor(next: string) {
    setColor(next)
    setFeedback(null)
    onColorChange?.(next)

    // Trocar de cor pode invalidar o tamanho: cai no primeiro tamanho com peça.
    const stillValid = variants.find((v) => v.color === next && v.size === size && v.stock > 0)
    if (!stillValid) {
      const fallback = variants
        .filter((v) => v.color === next && v.stock > 0)
        .sort((a, b) => compareSizes(a.size, b.size))[0]
      if (fallback) setSize(fallback.size)
    }
    setQuantity(1)
  }

  function add() {
    if (!selected || soldOut) return
    startTransition(async () => {
      const result = await addToCartAction(selected.id, quantity)
      setFeedback({ ok: result.ok, message: result.message ?? '' })
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Price cents={price} compareAt={compareAt} size="lg" />
        <Installments cents={price} className="mt-1.5 block" />
      </div>

      {colors.length > 0 && (
        <fieldset>
          <legend className="field-label">
            Cor: <span className="font-normal text-ink-muted">{color}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((option) => {
              const available = variants.some((v) => v.color === option.name && v.stock > 0)
              return (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => pickColor(option.name)}
                  aria-pressed={color === option.name}
                  title={available ? option.name : `${option.name} — esgotado`}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    color === option.name
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-brand-100 bg-white text-brand-800 hover:border-brand-600',
                    !available && 'opacity-45',
                  )}
                >
                  <span
                    aria-hidden
                    className="h-3.5 w-3.5 rounded-full border border-black/15"
                    style={{ backgroundColor: option.hex ?? '#ccc' }}
                  />
                  {option.name}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="field-label">
            Tamanho: <span className="font-normal text-ink-muted">{size}</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((option) => {
              const variant = variants.find(
                (v) => v.size === option && (colors.length === 0 || v.color === color),
              )
              const available = (variant?.stock ?? 0) > 0
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSize(option)
                    setQuantity(1)
                    setFeedback(null)
                  }}
                  disabled={!variant}
                  aria-pressed={size === option}
                  title={available ? option : `${option} — esgotado`}
                  className={cn(
                    'min-w-12 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors',
                    size === option
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-brand-100 bg-white text-brand-800 hover:border-brand-600',
                    !available && 'text-ink-muted line-through opacity-55',
                  )}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-brand-100 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="grid h-10 w-10 place-items-center rounded-l-full text-brand-800 disabled:opacity-35"
            aria-label="Diminuir quantidade"
          >
            <Minus size={16} />
          </button>
          <span className="w-10 text-center font-mono text-sm font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock}
            className="grid h-10 w-10 place-items-center rounded-r-full text-brand-800 disabled:opacity-35"
            aria-label="Aumentar quantidade"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={add}
          disabled={soldOut || pending || !selected}
          className="btn btn-amber flex-1 min-w-52"
        >
          {pending ? (
            <LoaderCircle size={18} className="animate-spin" aria-hidden />
          ) : (
            <ShoppingBag size={18} aria-hidden />
          )}
          {soldOut ? 'Produto esgotado' : 'Adicionar ao carrinho'}
        </button>
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {feedback && (
          <p
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
              feedback.ok ? 'bg-amber-100 text-amber-600' : 'bg-danger-bg text-danger',
            )}
          >
            {feedback.ok ? <Check size={16} aria-hidden /> : <TriangleAlert size={16} aria-hidden />}
            {feedback.message}
          </p>
        )}

        {lastUnits && (
          <p className="text-sm font-medium text-amber-600">
            Últimas {stock} unidades nesta combinação.
          </p>
        )}
        {soldOut && (
          <p className="text-sm text-ink-muted">
            Esta combinação acabou. Escolha outra cor ou tamanho — ou volte em alguns dias.
          </p>
        )}
      </div>

      {selected && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-brand-100 pt-5 text-sm">
          <dt className="tag text-ink-muted">SKU</dt>
          <dd className="text-right font-mono text-xs font-semibold text-brand-900">
            {selected.sku}
          </dd>
          <dt className="tag text-ink-muted">Disponibilidade</dt>
          <dd className="text-right font-mono text-xs font-semibold text-brand-900">
            {stock > 0 ? `${stock} em estoque` : 'Esgotado'}
          </dd>
        </dl>
      )}
    </div>
  )
}
