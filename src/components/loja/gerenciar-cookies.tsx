'use client'

import { useState, useTransition } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { setConsentAction } from '@/app/actions/consent'
import type { Consent } from '@/lib/consent'

/**
 * Controle para rever a escolha de cookies, dentro da Política de Privacidade.
 *
 * A LGPD exige que revogar o consentimento seja tão simples quanto concedê-lo.
 * Sem um lugar como este, a única forma de voltar atrás seria limpar os
 * cookies do navegador na mão — o que não conta como facilitado.
 */
export function GerenciarCookies({ atual }: { atual: Consent | null }) {
  const [escolha, setEscolha] = useState<Consent | null>(atual)
  const [salvo, setSalvo] = useState(false)
  const [pending, startTransition] = useTransition()

  function decidir(consent: Consent) {
    setEscolha(consent)
    setSalvo(false)
    startTransition(async () => {
      await setConsentAction(consent)
      setSalvo(true)
    })
  }

  const rotulo =
    escolha === 'aceito'
      ? 'Você aceitou o cookie de medição de navegação.'
      : escolha === 'recusado'
        ? 'Você usa apenas os cookies necessários. Nenhuma visita sua é registrada.'
        : 'Você ainda não fez uma escolha.'

  return (
    <div className="card mt-2 flex flex-col gap-4 p-5">
      <div>
        <p className="text-sm font-semibold text-brand-950">Sua escolha atual</p>
        <p className="mt-1 text-sm text-ink-muted">{rotulo}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => decidir('recusado')}
          disabled={pending}
          className={escolha === 'recusado' ? 'btn btn-primary' : 'btn btn-outline'}
        >
          {escolha === 'recusado' && <Check size={16} aria-hidden />}
          Apenas os necessários
        </button>
        <button
          type="button"
          onClick={() => decidir('aceito')}
          disabled={pending}
          className={escolha === 'aceito' ? 'btn btn-primary' : 'btn btn-outline'}
        >
          {escolha === 'aceito' && <Check size={16} aria-hidden />}
          Aceitar todos
        </button>
      </div>

      {pending && (
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <LoaderCircle size={14} className="animate-spin" aria-hidden />
          Salvando…
        </p>
      )}

      {salvo && !pending && (
        <p role="status" className="text-xs font-medium text-success-600">
          Preferência salva.
          {escolha === 'recusado' && ' O identificador de visitante foi apagado do seu navegador.'}
        </p>
      )}
    </div>
  )
}
