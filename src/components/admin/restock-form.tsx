'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { restockAction, type AdminState } from '@/app/actions/admin/catalogo'

/** Entrada rápida de estoque na listagem. Aceita número negativo para baixa. */
export function RestockForm({ variantId }: { variantId: string }) {
  const [state, action, pending] = useActionState(restockAction, {} as AdminState)

  return (
    <form action={action} className="flex items-center justify-end gap-1.5">
      <input type="hidden" name="variantId" value={variantId} />
      <label className="sr-only" htmlFor={`amount-${variantId}`}>
        Unidades a somar ou subtrair
      </label>
      <input
        id={`amount-${variantId}`}
        name="amount"
        type="number"
        step={1}
        placeholder="+10"
        className="field w-20 px-2 py-1.5 text-center font-mono text-sm"
      />
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        {pending ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : 'Aplicar'}
      </button>
      {state.errors?.amount && <span className="sr-only">{state.errors.amount}</span>}
    </form>
  )
}
