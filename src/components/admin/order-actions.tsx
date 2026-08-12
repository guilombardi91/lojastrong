'use client'

import { useActionState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { updateOrderStatusAction } from '@/app/actions/admin/operacao'
import type { AdminState } from '@/app/actions/admin/catalogo'
import { FieldError, FormError, SuccessNote } from '@/components/ui/feedback'
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '@/lib/enums'

export function OrderActions({
  orderId,
  status,
  trackingCode,
}: {
  orderId: string
  status: string
  trackingCode: string | null
}) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, {} as AdminState)

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      <input type="hidden" name="orderId" value={orderId} />

      <h2 className="font-display text-lg font-bold text-brand-950">Atualizar pedido</h2>

      <FormError>{state.errors?.form}</FormError>
      {state.ok && <SuccessNote>{state.message}</SuccessNote>}

      <div>
        <label className="field-label" htmlFor="status">
          Status
        </label>
        <select id="status" name="status" className="field" defaultValue={status}>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABEL[value]}
            </option>
          ))}
        </select>
        <FieldError>{state.errors?.status}</FieldError>
        <p className="mt-1.5 text-xs text-ink-muted">
          Marcar como cancelado devolve as peças ao estoque.
        </p>
      </div>

      <div>
        <label className="field-label" htmlFor="trackingCode">
          Código de rastreio
        </label>
        <input
          id="trackingCode"
          name="trackingCode"
          className="field font-mono"
          defaultValue={trackingCode ?? ''}
          placeholder="BR000000000BR"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="note">
          Mensagem para o cliente <span className="font-normal text-ink-muted">(opcional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          className="field resize-y"
          placeholder="Aparece na linha do tempo do pedido"
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
        Salvar atualização
      </button>
    </form>
  )
}
