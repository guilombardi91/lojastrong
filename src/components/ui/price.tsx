import { discountPercent, formatBRL, installments } from '@/lib/money'
import { cn } from '@/lib/utils'

export function Price({
  cents,
  compareAt,
  size = 'md',
  className,
}: {
  cents: number
  compareAt?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const off = compareAt ? discountPercent(compareAt, cents) : 0

  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <span className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      {off > 0 && (
        <span className="text-sm text-ink-muted line-through">{formatBRL(compareAt!)}</span>
      )}
      <span className={cn('font-display font-bold text-brand-950', sizes[size])}>
        {formatBRL(cents)}
      </span>
      {off > 0 && (
        <span className="tag rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-600">
          −{off}%
        </span>
      )}
    </span>
  )
}

/** Parcelamento exibido sob o preço, como o comprador brasileiro espera ver. */
export function Installments({ cents, className }: { cents: number; className?: string }) {
  const { count, value } = installments(cents)
  if (count < 2) return null

  return (
    <span className={cn('text-sm text-ink-muted', className)}>
      ou {count}x de <strong className="font-semibold text-brand-800">{formatBRL(value)}</strong> sem
      juros
    </span>
  )
}
