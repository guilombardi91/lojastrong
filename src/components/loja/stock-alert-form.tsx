'use client'

import { useState, useTransition } from 'react'
import { BellRing, Check, LoaderCircle } from 'lucide-react'
import { subscribeStockAlertAction } from '@/app/actions/stock-alert'

/** Formulário "avise-me quando chegar", mostrado no lugar do botão de compra
 * quando a combinação escolhida está esgotada. */
export function StockAlertForm({
  variantId,
  defaultEmail,
}: {
  variantId: string
  defaultEmail?: string | null
}) {
  const [email, setEmail] = useState(defaultEmail ?? '')
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  if (feedback?.ok) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-100/60 px-3.5 py-3 text-sm font-medium text-amber-700">
        <Check size={16} className="shrink-0" aria-hidden />
        {feedback.message}
      </p>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await subscribeStockAlertAction(variantId, email)
          setFeedback(result)
        })
      }}
      className="flex flex-col gap-2 rounded-xl border border-brand-100 bg-paper p-3.5"
    >
      <label
        htmlFor={`alert-email-${variantId}`}
        className="flex items-center gap-1.5 text-sm font-semibold text-brand-900"
      >
        <BellRing size={15} aria-hidden />
        Avise-me quando chegar
      </label>
      <div className="flex gap-2">
        <input
          id={`alert-email-${variantId}`}
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          className="field flex-1"
        />
        <button type="submit" disabled={pending} className="btn btn-outline btn-sm shrink-0">
          {pending ? <LoaderCircle size={14} className="animate-spin" aria-hidden /> : 'Avisar'}
        </button>
      </div>
      {feedback && !feedback.ok && <p className="text-sm text-danger">{feedback.message}</p>}
    </form>
  )
}
