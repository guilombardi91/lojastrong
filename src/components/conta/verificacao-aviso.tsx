'use client'

import { useState, useTransition } from 'react'
import { LoaderCircle, MailWarning } from 'lucide-react'
import { resendVerificationAction, type FormState } from '@/app/actions/auth'

/**
 * Faixa fixa na área da conta enquanto o e-mail não é confirmado.
 *
 * Fica como aviso, não como bloqueio: o cliente navega e monta o carrinho
 * normalmente, e só esbarra na exigência ao finalizar a compra.
 */
export function VerificacaoAviso({ email }: { email: string }) {
  const [state, setState] = useState<FormState>({})
  const [pending, startTransition] = useTransition()

  function resend() {
    startTransition(async () => setState(await resendVerificationAction()))
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-amber-100 bg-amber-100 px-4 py-3.5">
      <MailWarning size={20} className="shrink-0 text-amber-600" aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-amber-600">Confirme seu e-mail</p>
        <p className="mt-0.5 text-sm text-ink-muted">
          {state.message ?? state.errors?.form ?? (
            <>
              Enviamos um link para <strong className="font-semibold">{email}</strong>. Sem a
              confirmação não é possível finalizar pedidos.
            </>
          )}
        </p>
      </div>

      {!state.ok && (
        <button type="button" onClick={resend} className="btn btn-outline btn-sm" disabled={pending}>
          {pending && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
          Reenviar e-mail
        </button>
      )}
    </div>
  )
}
