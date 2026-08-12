'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoaderCircle, Minus, Plus, Trash2 } from 'lucide-react'
import { removeFromCartAction, setQuantityAction } from '@/app/actions/cart'
import { formatBRL } from '@/lib/money'

export type CartLineData = {
  id: string
  quantity: number
  stock: number
  unitPrice: number
  sku: string
  variantLabel: string
  productName: string
  productSlug: string
  categoryName: string
  imageUrl: string | null
  imageAlt: string
}

export function CartLine({ line }: { line: CartLineData }) {
  const [pending, startTransition] = useTransition()
  const [notice, setNotice] = useState<string | null>(null)
  const router = useRouter()

  function change(quantity: number) {
    startTransition(async () => {
      const result = await setQuantityAction(line.id, quantity)
      setNotice(result.message ?? null)
      router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      await removeFromCartAction(line.id)
      router.refresh()
    })
  }

  return (
    <li className="flex gap-4 py-5 first:pt-0">
      <Link
        href={`/produtos/${line.productSlug}`}
        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-brand-100 bg-paper"
      >
        {line.imageUrl && (
          <Image
            src={line.imageUrl}
            alt={line.imageAlt}
            fill
            sizes="6rem"
            className="object-contain p-2"
          />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <Link
              href={`/produtos/${line.productSlug}`}
              className="font-display text-base font-bold text-brand-950 hover:underline"
            >
              {line.productName}
            </Link>
            <p className="text-sm text-ink-muted">{line.variantLabel}</p>
          </div>
          <p className="font-display text-base font-bold text-brand-950">
            {formatBRL(line.unitPrice * line.quantity)}
          </p>
        </div>

        <p className="tag text-ink-muted">
          {line.categoryName} · {line.sku}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-full border border-brand-100 bg-white">
            <button
              type="button"
              onClick={() => change(line.quantity - 1)}
              disabled={pending}
              className="grid h-8 w-8 place-items-center rounded-l-full text-brand-800 disabled:opacity-35"
              aria-label={`Diminuir quantidade de ${line.productName}`}
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center font-mono text-sm font-semibold">
              {pending ? <LoaderCircle size={13} className="mx-auto animate-spin" /> : line.quantity}
            </span>
            <button
              type="button"
              onClick={() => change(line.quantity + 1)}
              disabled={pending || line.quantity >= line.stock}
              className="grid h-8 w-8 place-items-center rounded-r-full text-brand-800 disabled:opacity-35"
              aria-label={`Aumentar quantidade de ${line.productName}`}
            >
              <Plus size={14} />
            </button>
          </div>

          <span className="text-sm text-ink-muted">{formatBRL(line.unitPrice)} cada</span>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="ml-auto flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-danger"
          >
            <Trash2 size={15} aria-hidden />
            Remover
          </button>
        </div>

        {notice && (
          <p role="status" className="mt-1 text-xs font-medium text-amber-600">
            {notice}
          </p>
        )}
      </div>
    </li>
  )
}
