import { BellRing } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  type OrderStatus,
  type PaymentStatus,
} from '@/lib/enums'

// Âmbar é a cor de marca e sinaliza atenção; verde e vermelho são cores de
// sistema, usadas só para o desfecho de um estado.
const tones = {
  neutral: 'bg-brand-50 text-brand-800 border-brand-100',
  brand: 'bg-brand-900 text-white border-brand-900',
  amber: 'bg-amber-100 text-amber-700 border-amber-100',
  success: 'bg-success-100 text-success-600 border-success-100',
  danger: 'bg-danger-bg text-danger border-danger-bg',
}

export type BadgeTone = keyof typeof tones

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'tag inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: 'amber',
  PAID: 'success',
  PACKING: 'neutral',
  SHIPPED: 'brand',
  DELIVERED: 'success',
  CANCELED: 'danger',
}

export function OrderStatusBadge({ status }: { status: string }) {
  const key = status as OrderStatus
  return <Badge tone={ORDER_TONE[key] ?? 'neutral'}>{ORDER_STATUS_LABEL[key] ?? status}</Badge>
}

const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  PENDING: 'amber',
  APPROVED: 'success',
  REJECTED: 'danger',
  REFUNDED: 'neutral',
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const key = status as PaymentStatus
  return <Badge tone={PAYMENT_TONE[key] ?? 'neutral'}>{PAYMENT_STATUS_LABEL[key] ?? status}</Badge>
}

/** Sinaliza a saúde do estoque de uma variante na área administrativa. */
export function StockBadge({ stock, lowStock }: { stock: number; lowStock: number }) {
  if (stock <= 0) return <Badge tone="danger">Esgotado</Badge>
  if (stock <= lowStock) return <Badge tone="amber">Repor · {stock}</Badge>
  return <Badge tone="success">{stock} em estoque</Badge>
}

/** Quantas pessoas pediram para ser avisadas quando esta variante voltar. */
export function StockAlertBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <Badge tone="brand">
      <BellRing size={11} aria-hidden />
      {count} na espera
    </Badge>
  )
}
