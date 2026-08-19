'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { setConsentAction } from '@/app/actions/consent'
import type { Consent } from '@/lib/consent'

/**
 * Faixa de consentimento para os cookies não essenciais.
 *
 * Quem decide se ela aparece é o servidor, lendo o cookie de escolha — por
 * isso não há efeito nem leitura de `document.cookie` aqui. Isso evita o
 * flash de banner que aparece e some em quem já decidiu, e mantém o cookie
 * como httpOnly.
 *
 * Os dois botões têm o mesmo peso visual. Recusa escondida atrás de um link
 * miúdo, ao lado de um "aceitar" chamativo, é consentimento induzido — não
 * vale como consentimento livre.
 */
export function CookieBanner() {
  const [escondido, setEscondido] = useState(false)
  const [pending, startTransition] = useTransition()

  if (escondido) return null

  function decidir(consent: Consent) {
    // Some na hora: a gravação continua em segundo plano, e deixar a faixa
    // presa na tela durante o round-trip parece que o clique não funcionou.
    setEscondido(true)
    startTransition(() => setConsentAction(consent))
  }

  return (
    <div
      role="region"
      aria-label="Aviso sobre cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-100 bg-white/95 shadow-float backdrop-blur"
    >
      <div className="container-page flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:gap-8">
        <Cookie size={22} className="hidden shrink-0 text-amber-600 lg:block" aria-hidden />

        <p className="flex-1 text-sm leading-relaxed text-ink-muted">
          Usamos cookies necessários para a loja funcionar — login e carrinho. Queremos usar também
          um cookie para medir quais produtos são mais vistos e viram compra. Esse é opcional, e a
          loja funciona igual sem ele.{' '}
          <Link
            href="/privacidade"
            className="font-semibold text-brand-700 underline underline-offset-4"
          >
            Ver a Política de Privacidade
          </Link>
        </p>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => decidir('recusado')}
            disabled={pending}
            className="btn btn-outline"
          >
            Apenas os necessários
          </button>
          <button
            type="button"
            onClick={() => decidir('aceito')}
            disabled={pending}
            className="btn btn-primary"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  )
}
