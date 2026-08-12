'use client'

import { useState, useTransition } from 'react'

/**
 * Alternativa a `useActionState` para formulários que precisam reagir ao
 * sucesso — fechar um painel, limpar a seleção.
 *
 * Com `useActionState` esse "depois" só chegaria por um efeito observando o
 * estado, o que dispara renderizações em cascata. Aqui o callback roda no
 * mesmo lugar em que a resposta chega.
 */
export function useFormAction<S extends { ok?: boolean }>(
  action: (previous: S, formData: FormData) => Promise<S>,
  initial: S,
  onSuccess?: (state: S) => void,
) {
  const [state, setState] = useState<S>(initial)
  const [pending, startTransition] = useTransition()

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await action(state, formData)
      setState(result)
      if (result?.ok) onSuccess?.(result)
    })
  }

  return [state, submit, pending] as const
}
