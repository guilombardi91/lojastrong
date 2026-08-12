'use client'

import { useState } from 'react'
import { LoaderCircle, Truck } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { formatZip, normalizeZip, type ShippingOption } from '@/lib/shipping'
import { addBusinessDays, formatDate } from '@/lib/utils'

/**
 * Simulador de frete. Mostra prazo em data, não em "X dias úteis": o comprador
 * quer saber se a peça chega antes da formatura, não fazer a conta.
 */
export function ShippingCalculator({
  weightGrams,
  subtotal,
}: {
  weightGrams: number
  subtotal: number
}) {
  const [zip, setZip] = useState('')
  const [options, setOptions] = useState<ShippingOption[] | null>(null)
  const [uf, setUf] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function quote(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setOptions(null)

    try {
      const params = new URLSearchParams({
        cep: normalizeZip(zip),
        peso: String(weightGrams),
        subtotal: String(subtotal),
      })
      const response = await fetch(`/api/frete?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error ?? 'Não foi possível calcular o frete agora.')
        return
      }

      setOptions(data.options)
      setUf(data.uf)
    } catch {
      setError('Não foi possível calcular o frete agora. Tente de novo em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card p-5">
      <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-brand-950">
        <Truck size={17} aria-hidden />
        Calcular frete e prazo
      </h2>
      <p className="mb-4 text-sm text-ink-muted">Informe seu CEP para ver o prazo de entrega.</p>

      <form onSubmit={quote} className="flex gap-2">
        <label htmlFor="cep-frete" className="sr-only">
          CEP
        </label>
        <input
          id="cep-frete"
          value={formatZip(zip)}
          onChange={(event) => setZip(normalizeZip(event.target.value))}
          inputMode="numeric"
          placeholder="00000-000"
          className="field max-w-40 font-mono"
        />
        <button type="submit" className="btn btn-outline btn-sm" disabled={loading}>
          {loading && <LoaderCircle size={15} className="animate-spin" aria-hidden />}
          Calcular
        </button>
      </form>

      <div aria-live="polite">
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        {options && (
          <ul className="mt-4 divide-y divide-brand-100 border-t border-brand-100">
            {options.map((option) => (
              <li key={option.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">{option.name}</p>
                  <p className="text-xs text-ink-muted">
                    Chega até {formatDate(addBusinessDays(option.days))} · {uf}
                  </p>
                </div>
                <span
                  className={
                    option.free
                      ? 'tag font-bold text-amber-600'
                      : 'font-display text-sm font-bold text-brand-950'
                  }
                >
                  {option.free ? 'Grátis' : formatBRL(option.price)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
