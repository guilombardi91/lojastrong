'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn, slugify } from '@/lib/utils'
import { ProductPurchase, type PurchaseVariant } from './product-purchase'

type ProductImage = { url: string; alt: string }

/**
 * Apelidos entre o nome comercial da cor e o sufixo do arquivo de imagem.
 *
 * Existe porque os mockups atuais são nomeados pelo tom, não pela variante.
 * Quando entrarem fotos de estúdio, o certo é vincular a imagem à variante no
 * banco e apagar este mapa.
 */
const COLOR_FILE_ALIASES: Record<string, string> = {
  'azul-strong': 'azul',
  'aco-escovado': 'aco',
}

function imageIndexForColor(images: ProductImage[], color: string | null): number {
  if (!color) return -1
  const alias = COLOR_FILE_ALIASES[slugify(color)] ?? slugify(color)
  return images.findIndex((image) => image.url.includes(`-${alias}.`))
}

export function ProductDetail({
  images,
  basePrice,
  compareAt,
  variants,
  userEmail,
}: {
  images: ProductImage[]
  basePrice: number
  compareAt: number | null
  variants: PurchaseVariant[]
  userEmail?: string | null
}) {
  // A capa precisa nascer na cor que o painel de compra já vem selecionando,
  // senão a primeira impressão é de uma peça que não é a escolhida.
  const [active, setActive] = useState(() => {
    const initialColor = (variants.find((v) => v.stock > 0) ?? variants[0])?.color ?? null
    return Math.max(0, imageIndexForColor(images, initialColor))
  })
  const current = images[active] ?? images[0]

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
      <div className="flex flex-col gap-3">
        <div className="card relative aspect-square overflow-hidden bg-paper">
          {current ? (
            <Image
              src={current.url}
              alt={current.alt}
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 34rem"
              className="object-contain p-8"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-ink-muted">Sem imagem</div>
          )}
        </div>

        {images.length > 1 && (
          <ul className="flex flex-wrap gap-2.5">
            {images.map((image, index) => (
              <li key={image.url + index}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Ver imagem ${index + 1}`}
                  aria-current={index === active}
                  className={cn(
                    'relative h-20 w-20 overflow-hidden rounded-xl border bg-paper transition-colors',
                    index === active ? 'border-brand-900' : 'border-brand-100 hover:border-brand-600',
                  )}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="5rem"
                    className="object-contain p-1.5"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProductPurchase
        basePrice={basePrice}
        compareAt={compareAt}
        variants={variants}
        userEmail={userEmail}
        onColorChange={(color) => {
          const index = imageIndexForColor(images, color)
          if (index >= 0) setActive(index)
        }}
      />
    </div>
  )
}
