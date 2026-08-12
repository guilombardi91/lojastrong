'use client'

import { useEffect, useRef } from 'react'
import { trackProductViewAction } from '@/app/actions/track'

/** Registra uma visualização de produto uma vez por carregamento da página.
 * Sem retorno visual — é só o gatilho da visita para o relatório de admin. */
export function TrackProductView({ productId }: { productId: string }) {
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    trackProductViewAction(productId)
  }, [productId])

  return null
}
