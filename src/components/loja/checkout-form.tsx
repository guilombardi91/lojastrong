'use client'

import { useActionState, useState } from 'react'
import { Barcode, CreditCard, LoaderCircle, QrCode } from 'lucide-react'
import { checkoutAction, type CheckoutState } from '@/app/actions/checkout'
import { FieldError, FormError } from '@/components/ui/feedback'
import { formatBRL, installments } from '@/lib/money'
import { formatZip, normalizeZip, type ShippingOption } from '@/lib/shipping'
import { UF, type PaymentMethod } from '@/lib/enums'
import { addBusinessDays, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export type SavedAddress = {
  id: string
  label: string
  recipient: string
  zip: string
  street: string
  number: string
  complement: string | null
  district: string
  city: string
  state: string
  isDefault: boolean
}

const METHODS: { id: PaymentMethod; label: string; hint: string; icon: typeof QrCode }[] = [
  { id: 'PIX', label: 'Pix', hint: 'Aprovação em segundos', icon: QrCode },
  { id: 'CREDIT_CARD', label: 'Cartão de crédito', hint: 'Em até 12x sem juros', icon: CreditCard },
  { id: 'BOLETO', label: 'Boleto', hint: 'Compensa em até 3 dias úteis', icon: Barcode },
]

export function CheckoutForm({
  addresses,
  subtotal,
  discount,
  freeShipping,
  weightGrams,
  defaultRecipient,
  initialOptions,
}: {
  addresses: SavedAddress[]
  subtotal: number
  discount: number
  freeShipping: boolean
  weightGrams: number
  defaultRecipient: string
  /** Cotação do endereço padrão, calculada no servidor para a tela já abrir com preço. */
  initialOptions: ShippingOption[]
}) {
  const [state, action, pending] = useActionState(checkoutAction, {} as CheckoutState)

  const preferred = addresses.find((a) => a.isDefault) ?? addresses[0]
  const [addressId, setAddressId] = useState<string>(preferred?.id ?? 'novo')
  const [form, setForm] = useState({
    recipient: preferred?.recipient ?? defaultRecipient,
    zip: preferred?.zip ?? '',
    street: preferred?.street ?? '',
    number: preferred?.number ?? '',
    complement: preferred?.complement ?? '',
    district: preferred?.district ?? '',
    city: preferred?.city ?? '',
    state: preferred?.state ?? '',
  })

  const [options, setOptions] = useState<ShippingOption[]>(initialOptions)
  const [shippingId, setShippingId] = useState<'PADRAO' | 'EXPRESSA'>('PADRAO')
  const [method, setMethod] = useState<PaymentMethod>('PIX')
  const [lookingUpZip, setLookingUpZip] = useState(false)

  const set = (field: keyof typeof form, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  /** Recota o frete para um destino. Silencioso: o valor final é do servidor. */
  async function quote(zip: string) {
    try {
      const params = new URLSearchParams({
        cep: zip,
        peso: String(weightGrams),
        subtotal: String(subtotal),
      })
      const response = await fetch(`/api/frete?${params}`)
      if (!response.ok) return
      const data = await response.json()
      setOptions(data.options as ShippingOption[])
    } catch {
      // Sem cotação a tela segue com a última que deu certo; o valor cobrado
      // é sempre recalculado no fechamento do pedido.
    }
  }

  function pickAddress(id: string) {
    setAddressId(id)
    const address = addresses.find((a) => a.id === id)
    if (!address) return

    setForm({
      recipient: address.recipient,
      zip: address.zip,
      street: address.street,
      number: address.number,
      complement: address.complement ?? '',
      district: address.district,
      city: address.city,
      state: address.state,
    })
    void quote(address.zip)
  }

  /**
   * Completar o CEP preenche o endereço e recota o frete.
   *
   * O ViaCEP é uma conveniência: se estiver fora do ar, o comprador digita à
   * mão e a compra continua.
   */
  async function onZipChange(value: string) {
    const zip = normalizeZip(value)
    set('zip', zip)
    if (zip.length !== 8) return

    void quote(zip)
    setLookingUpZip(true)

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`)
      const data = await response.json()
      if (data.erro) return

      setForm((previous) => ({
        ...previous,
        street: data.logradouro || previous.street,
        district: data.bairro || previous.district,
        city: data.localidade || previous.city,
        state: data.uf || previous.state,
      }))
    } catch {
      // Segue sem preenchimento automático.
    } finally {
      setLookingUpZip(false)
    }
  }

  const chosen = options.find((option) => option.id === shippingId)
  const shippingCost = freeShipping ? 0 : (chosen?.price ?? 0)
  const total = Math.max(0, subtotal - discount) + shippingCost
  const parcels = installments(total)

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-6">
        <FormError>{state.errors?.form}</FormError>

        {/* ---------------------------------------------------- endereço */}
        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Entrega</h2>

          {addresses.length > 0 && (
            <div className="mb-5 flex flex-col gap-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
                    addressId === address.id
                      ? 'border-brand-900 bg-brand-50'
                      : 'border-brand-100 hover:border-brand-600',
                  )}
                >
                  <input
                    type="radio"
                    name="enderecoSalvo"
                    checked={addressId === address.id}
                    onChange={() => pickAddress(address.id)}
                    className="mt-1 h-4 w-4 accent-brand-700"
                  />
                  <span className="text-sm">
                    <strong className="block font-semibold text-brand-900">{address.label}</strong>
                    <span className="text-ink-muted">
                      {address.street}, {address.number}
                      {address.complement ? ` · ${address.complement}` : ''} — {address.district},{' '}
                      {address.city}/{address.state} · {formatZip(address.zip)}
                    </span>
                  </span>
                </label>
              ))}

              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                  addressId === 'novo'
                    ? 'border-brand-900 bg-brand-50'
                    : 'border-brand-100 hover:border-brand-600',
                )}
              >
                <input
                  type="radio"
                  name="enderecoSalvo"
                  checked={addressId === 'novo'}
                  onChange={() => setAddressId('novo')}
                  className="h-4 w-4 accent-brand-700"
                />
                <span className="text-sm font-semibold text-brand-900">Entregar em outro lugar</span>
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="field-label" htmlFor="recipient">
                Quem vai receber
              </label>
              <input
                id="recipient"
                name="recipient"
                className="field"
                value={form.recipient}
                onChange={(event) => set('recipient', event.target.value)}
                required
              />
              <FieldError>{state.errors?.recipient}</FieldError>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="zip">
                CEP {lookingUpZip && <span className="font-normal text-ink-muted">buscando…</span>}
              </label>
              <input
                id="zip"
                name="zip"
                className="field font-mono"
                inputMode="numeric"
                placeholder="00000-000"
                value={formatZip(form.zip)}
                onChange={(event) => void onZipChange(event.target.value)}
                required
              />
              <FieldError>{state.errors?.zip}</FieldError>
            </div>

            <div className="sm:col-span-4">
              <label className="field-label" htmlFor="street">
                Rua, avenida ou logradouro
              </label>
              <input
                id="street"
                name="street"
                className="field"
                value={form.street}
                onChange={(event) => set('street', event.target.value)}
                required
              />
              <FieldError>{state.errors?.street}</FieldError>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="number">
                Número
              </label>
              <input
                id="number"
                name="number"
                className="field"
                value={form.number}
                onChange={(event) => set('number', event.target.value)}
                required
              />
              <FieldError>{state.errors?.number}</FieldError>
            </div>

            <div className="sm:col-span-3">
              <label className="field-label" htmlFor="complement">
                Complemento <span className="font-normal text-ink-muted">(opcional)</span>
              </label>
              <input
                id="complement"
                name="complement"
                className="field"
                placeholder="Apto, bloco, referência"
                value={form.complement}
                onChange={(event) => set('complement', event.target.value)}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="field-label" htmlFor="district">
                Bairro
              </label>
              <input
                id="district"
                name="district"
                className="field"
                value={form.district}
                onChange={(event) => set('district', event.target.value)}
                required
              />
              <FieldError>{state.errors?.district}</FieldError>
            </div>

            <div className="sm:col-span-4">
              <label className="field-label" htmlFor="city">
                Cidade
              </label>
              <input
                id="city"
                name="city"
                className="field"
                value={form.city}
                onChange={(event) => set('city', event.target.value)}
                required
              />
              <FieldError>{state.errors?.city}</FieldError>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label" htmlFor="state">
                Estado
              </label>
              <select
                id="state"
                name="state"
                className="field"
                value={form.state}
                onChange={(event) => {
                  set('state', event.target.value)
                  if (form.zip.length === 8) void quote(form.zip)
                }}
                required
              >
                <option value="">UF</option>
                {UF.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
              <FieldError>{state.errors?.state}</FieldError>
            </div>
          </div>

          {addressId === 'novo' && (
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                name="saveAddress"
                defaultChecked
                className="h-4 w-4 accent-brand-700"
              />
              <span className="text-brand-900">Salvar este endereço na minha conta</span>
            </label>
          )}
        </section>

        {/* ------------------------------------------------------- frete */}
        <section className="card p-5">
          <h2 className="mb-4 font-display text-lg font-bold text-brand-950">Modalidade de envio</h2>

          {options.length === 0 ? (
            <p className="text-sm text-ink-muted">
              Informe o CEP acima para ver as opções de entrega.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {options.map((option) => {
                const price = freeShipping ? 0 : option.price
                return (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors',
                      shippingId === option.id
                        ? 'border-brand-900 bg-brand-50'
                        : 'border-brand-100 hover:border-brand-600',
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingId"
                      value={option.id}
                      checked={shippingId === option.id}
                      onChange={() => setShippingId(option.id)}
                      className="h-4 w-4 accent-brand-700"
                    />
                    <span className="flex-1 text-sm">
                      <strong className="block font-semibold text-brand-900">{option.name}</strong>
                      <span className="text-ink-muted">
                        Chega até {formatDate(addBusinessDays(option.days))}
                      </span>
                    </span>
                    <span
                      className={
                        price === 0
                          ? 'tag font-bold text-amber-600'
                          : 'font-display text-sm font-bold text-brand-950'
                      }
                    >
                      {price === 0 ? 'Grátis' : formatBRL(price)}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
          <FieldError>{state.errors?.shippingId}</FieldError>
        </section>

        {/* --------------------------------------------------- pagamento */}
        <section className="card p-5">
          <h2 className="mb-1 font-display text-lg font-bold text-brand-950">Pagamento</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Você conclui o pagamento no ambiente seguro do provedor. Nenhum dado de cartão passa
            pela loja.
          </p>

          <div className="grid gap-2 sm:grid-cols-3">
            {METHODS.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-4 transition-colors',
                  method === option.id
                    ? 'border-brand-900 bg-brand-50'
                    : 'border-brand-100 hover:border-brand-600',
                )}
              >
                <input
                  type="radio"
                  name="method"
                  value={option.id}
                  checked={method === option.id}
                  onChange={() => setMethod(option.id)}
                  className="sr-only"
                />
                <option.icon size={20} className="text-brand-700" aria-hidden />
                <strong className="text-sm font-semibold text-brand-900">{option.label}</strong>
                <span className="text-xs text-ink-muted">{option.hint}</span>
              </label>
            ))}
          </div>
          <FieldError>{state.errors?.method}</FieldError>

          {method === 'CREDIT_CARD' && parcels.count > 1 && (
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
              Até <strong>{parcels.count}x</strong> de{' '}
              <strong>{formatBRL(parcels.value)}</strong> sem juros.
            </p>
          )}

          <div className="mt-5">
            <label className="field-label" htmlFor="notes">
              Observações para a equipe <span className="font-normal text-ink-muted">(opcional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="field resize-y"
              placeholder="Ex.: entregar na portaria, embrulhar para presente"
            />
          </div>
        </section>
      </div>

      {/* -------------------------------------------------------- resumo */}
      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="card flex flex-col gap-4 p-5">
          <h2 className="font-display text-lg font-bold text-brand-950">Resumo</h2>

          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="font-medium text-brand-900">{formatBRL(subtotal)}</dd>
            </div>

            {discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">Desconto</dt>
                <dd className="font-medium text-amber-600">−{formatBRL(discount)}</dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-ink-muted">Frete</dt>
              <dd className="font-medium text-brand-900">
                {options.length === 0
                  ? '—'
                  : shippingCost === 0
                    ? 'Grátis'
                    : formatBRL(shippingCost)}
              </dd>
            </div>

            <div className="flex items-baseline justify-between border-t border-brand-100 pt-3">
              <dt className="font-display font-bold text-brand-950">Total</dt>
              <dd className="font-display text-2xl font-extrabold text-brand-950">
                {formatBRL(total)}
              </dd>
            </div>
          </dl>

          <button type="submit" className="btn btn-amber w-full" disabled={pending}>
            {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden />}
            {pending ? 'Abrindo o pagamento…' : 'Pagar e finalizar'}
          </button>

          <p className="text-center text-xs leading-relaxed text-ink-muted">
            Ao finalizar você concorda com as políticas de troca e entrega da loja.
          </p>
        </div>
      </aside>
    </form>
  )
}
