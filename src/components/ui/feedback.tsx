import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Tela vazia como convite à ação, não como aviso de erro.
 * Toda ocorrência precisa de um caminho de saída.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: { label: string; href: string }
  icon?: React.ReactNode
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-brand-600">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-brand-950">{title}</h3>
      <p className="max-w-sm text-sm text-ink-muted">{description}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary mt-2">
          {action.label}
        </Link>
      )}
    </div>
  )
}

/** Erro de formulário: diz o que aconteceu, sem pedir desculpas. */
export function FormError({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className={cn(
        'rounded-lg border border-danger-bg bg-danger-bg px-3 py-2 text-sm text-danger',
        className,
      )}
    >
      {children}
    </p>
  )
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs font-medium text-danger">{children}</p>
}

export function SuccessNote({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="status"
      className="rounded-lg border border-amber-100 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-600"
    >
      {children}
    </p>
  )
}
