import { Check } from 'lucide-react'
import { ORDER_PIPELINE, ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/enums'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

/**
 * Esteira do pedido. Mostra as etapas que faltam, não só as cumpridas: quem
 * comprou quer saber quanto falta, não apenas onde está.
 */
export function OrderTimeline({
  status,
  events,
}: {
  status: string
  events: { status: string; message: string; createdAt: Date }[]
}) {
  if (status === 'CANCELED') {
    const canceled = events.find((event) => event.status === 'CANCELED')
    return (
      <div className="rounded-xl border border-danger-bg bg-danger-bg p-4">
        <p className="font-display text-sm font-bold text-danger">Pedido cancelado</p>
        {canceled && (
          <p className="mt-1 text-sm text-danger">
            {canceled.message} · {formatDateTime(canceled.createdAt)}
          </p>
        )}
      </div>
    )
  }

  const currentIndex = ORDER_PIPELINE.indexOf(status as OrderStatus)

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_PIPELINE.map((step, index) => {
        const done = index <= currentIndex
        const isCurrent = index === currentIndex
        const event = [...events].reverse().find((e) => e.status === step)

        return (
          <li key={step} className="flex gap-3.5">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  done
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-brand-100 bg-white text-brand-100',
                )}
              >
                {done ? (
                  <Check size={14} aria-hidden />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                )}
              </span>
              {index < ORDER_PIPELINE.length - 1 && (
                <span
                  className={cn('w-0.5 flex-1', done ? 'bg-amber-500' : 'bg-brand-100')}
                  aria-hidden
                />
              )}
            </div>

            <div className={cn('pb-6', index === ORDER_PIPELINE.length - 1 && 'pb-0')}>
              <p
                className={cn(
                  'font-display text-sm font-bold',
                  done ? 'text-brand-950' : 'text-ink-muted',
                )}
              >
                {ORDER_STATUS_LABEL[step]}
                {isCurrent && (
                  <span className="tag ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-600">
                    agora
                  </span>
                )}
              </p>
              {event && (
                <p className="mt-0.5 text-sm text-ink-muted">
                  {event.message}
                  <span className="tag ml-2">{formatDateTime(event.createdAt)}</span>
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
