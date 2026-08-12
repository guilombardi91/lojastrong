'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/**
 * Pix copia-e-cola ou linha digitável do boleto.
 * O código fica visível e selecionável — copiar não pode depender do botão.
 */
export function PaymentPayload({ label, payload }: { label: string; payload: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
      <p className="tag mb-2 text-ink-muted">{label}</p>
      <p className="scroll-x whitespace-nowrap rounded-lg border border-brand-100 bg-white px-3 py-2.5 font-mono text-xs text-brand-900">
        {payload}
      </p>
      <button type="button" onClick={copy} className="btn btn-outline btn-sm mt-3">
        {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
        {copied ? 'Código copiado' : 'Copiar código'}
      </button>
    </div>
  )
}
