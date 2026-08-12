'use client'

import { useActionState } from 'react'
import { LoaderCircle, TicketPercent, X } from 'lucide-react'
import { applyCouponAction, removeCouponAction, type CouponState } from '@/app/actions/coupon'

export function CouponForm({ applied }: { applied?: { code: string; description: string } | null }) {
  const [state, action, pending] = useActionState(applyCouponAction, {} as CouponState)

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-100 px-3 py-2.5">
        <div className="min-w-0">
          <p className="tag font-bold text-amber-600">{applied.code}</p>
          <p className="text-xs text-amber-600">{applied.description}</p>
        </div>
        <form action={removeCouponAction}>
          <button
            type="submit"
            className="grid h-7 w-7 place-items-center rounded-full text-amber-600 hover:bg-white/60"
            aria-label="Remover cupom"
          >
            <X size={15} />
          </button>
        </form>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="cupom" className="tag flex items-center gap-1.5 text-ink-muted">
        <TicketPercent size={14} aria-hidden />
        Cupom de desconto
      </label>
      <div className="flex gap-2">
        <input
          id="cupom"
          name="cupom"
          className="field font-mono uppercase"
          placeholder="BEMVINDO10"
          autoComplete="off"
        />
        <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
          {pending && <LoaderCircle size={14} className="animate-spin" aria-hidden />}
          Aplicar
        </button>
      </div>
      {state.message && (
        <p
          role="status"
          className={state.ok ? 'text-xs font-medium text-amber-600' : 'text-xs font-medium text-danger'}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}
