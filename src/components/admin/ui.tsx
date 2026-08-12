import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Cabeçalho padrão das telas administrativas. */
export function AdminHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="tag mb-2 text-amber-600">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-extrabold text-brand-950">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-ink-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}

/** Indicador do painel. `hint` explica o número em vez de repetir o rótulo. */
export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  href,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'success' | 'amber' | 'danger'
  href?: string
}) {
  const tones = {
    default: 'text-brand-950',
    success: 'text-success-600',
    amber: 'text-amber-700',
    danger: 'text-danger',
  }

  const content = (
    <>
      <p className="tag text-ink-muted">{label}</p>
      <p className={cn('mt-2 font-display text-3xl font-extrabold', tones[tone])}>{value}</p>
      {hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
    </>
  )

  if (href) {
    return (
      <Link href={href} className="card block p-5 transition-colors hover:border-brand-600">
        {content}
      </Link>
    )
  }

  return <div className="card p-5">{content}</div>
}

/** Tabela que rola sozinha na horizontal, sem arrastar a página junto. */
export function DataTable({
  head,
  children,
  empty,
  minWidth = '46rem',
}: {
  head: React.ReactNode
  children: React.ReactNode
  empty?: string
  /** Largura mínima antes da tabela começar a rolar na horizontal. */
  minWidth?: string
}) {
  const rows = Array.isArray(children) ? children : [children]
  const isEmpty = rows.flat().filter(Boolean).length === 0

  if (isEmpty && empty) {
    return (
      <div className="card px-6 py-12 text-center text-sm text-ink-muted">{empty}</div>
    )
  }

  return (
    <div className="card scroll-x">
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-brand-100 bg-brand-50/60 text-left">{head}</tr>
        </thead>
        <tbody className="divide-y divide-brand-100">{children}</tbody>
      </table>
    </div>
  )
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('tag px-4 py-3 font-semibold text-ink-muted', className)}>{children}</th>
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle text-brand-900', className)}>{children}</td>
}
