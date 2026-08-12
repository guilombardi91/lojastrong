'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Em produção o digest é o que liga esta tela ao registro no servidor.
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="tag text-danger">Algo quebrou aqui</p>
      <h1 className="max-w-lg font-display text-3xl font-extrabold text-brand-950">
        Não foi possível carregar esta página
      </h1>
      <p className="max-w-md text-ink-muted">
        A falha foi registrada. Tente de novo — se continuar, escreva para loja@strong.com.br
        {error.digest && (
          <>
            {' '}
            informando o código <span className="font-mono text-sm">{error.digest}</span>
          </>
        )}
        .
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          <RotateCcw size={16} aria-hidden />
          Tentar de novo
        </button>
        <Link href="/" className="btn btn-outline">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
