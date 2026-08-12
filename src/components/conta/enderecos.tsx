'use client'

import { useState } from 'react'
import { LoaderCircle, MapPin, Pencil, Star, Trash2, X } from 'lucide-react'
import {
  deleteAddressAction,
  saveAddressAction,
  setDefaultAddressAction,
  type AddressState,
} from '@/app/actions/address'
import { FieldError, FormError, SuccessNote } from '@/components/ui/feedback'
import { useFormAction } from '@/components/ui/use-form-action'
import { formatZip, normalizeZip } from '@/lib/shipping'
import { UF } from '@/lib/enums'
import { Badge } from '@/components/ui/badge'

export type AddressItem = {
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

const EMPTY: Omit<AddressItem, 'id' | 'isDefault'> = {
  label: 'Principal',
  recipient: '',
  zip: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '',
}

export function Enderecos({ addresses }: { addresses: AddressItem[] }) {
  const [editing, setEditing] = useState<AddressItem | 'novo' | null>(
    addresses.length === 0 ? 'novo' : null,
  )

  return (
    <div className="flex flex-col gap-4">
      {addresses.length > 0 && (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li key={address.id} className="card flex flex-wrap items-start gap-4 p-5">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-600" aria-hidden />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-bold text-brand-950">
                    {address.label}
                  </h3>
                  {address.isDefault && <Badge tone="success">Padrão</Badge>}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {address.recipient}
                  <br />
                  {address.street}, {address.number}
                  {address.complement ? ` · ${address.complement}` : ''} — {address.district}
                  <br />
                  {address.city}/{address.state} · CEP {formatZip(address.zip)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {!address.isDefault && (
                  <form action={setDefaultAddressAction.bind(null, address.id)}>
                    <button type="submit" className="btn btn-ghost btn-sm gap-1.5">
                      <Star size={14} aria-hidden />
                      Tornar padrão
                    </button>
                  </form>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(address)}
                  className="btn btn-ghost btn-sm gap-1.5"
                >
                  <Pencil size={14} aria-hidden />
                  Editar
                </button>
                <form action={deleteAddressAction.bind(null, address.id)}>
                  <button
                    type="submit"
                    className="btn btn-ghost btn-sm gap-1.5 text-ink-muted hover:text-danger"
                  >
                    <Trash2 size={14} aria-hidden />
                    Excluir
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <AddressForm
          address={editing === 'novo' ? null : editing}
          onDone={() => setEditing(null)}
          canCancel={addresses.length > 0}
        />
      ) : (
        <button type="button" onClick={() => setEditing('novo')} className="btn btn-primary self-start">
          Adicionar endereço
        </button>
      )}
    </div>
  )
}

function AddressForm({
  address,
  onDone,
  canCancel,
}: {
  address: AddressItem | null
  onDone: () => void
  canCancel: boolean
}) {
  // Salvou: fecha o formulário e devolve o cliente para a lista.
  const [state, action, pending] = useFormAction(saveAddressAction, {} as AddressState, onDone)
  const [form, setForm] = useState(address ?? EMPTY)
  const [lookingUp, setLookingUp] = useState(false)

  const set = (field: keyof typeof EMPTY, value: string) =>
    setForm((previous) => ({ ...previous, [field]: value }))

  /** Completar o CEP preenche o resto do endereço. */
  async function onZipChange(value: string) {
    const zip = normalizeZip(value)
    set('zip', zip)
    if (zip.length !== 8) return

    setLookingUp(true)
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
      // Consulta opcional: sem ela o cliente preenche à mão.
    } finally {
      setLookingUp(false)
    }
  }

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      {address && <input type="hidden" name="id" value={address.id} />}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-brand-950">
          {address ? 'Editar endereço' : 'Novo endereço'}
        </h2>
        {canCancel && (
          <button
            type="button"
            onClick={onDone}
            className="btn btn-ghost btn-sm px-2"
            aria-label="Cancelar"
          >
            <X size={17} />
          </button>
        )}
      </div>

      <FormError>{state.errors?.form}</FormError>
      {state.ok && <SuccessNote>{state.message}</SuccessNote>}

      <div className="grid gap-4 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="label">
            Apelido
          </label>
          <input
            id="label"
            name="label"
            className="field"
            placeholder="Casa, trabalho…"
            value={form.label}
            onChange={(event) => set('label', event.target.value)}
          />
        </div>

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
            CEP {lookingUp && <span className="font-normal text-ink-muted">buscando…</span>}
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
            Logradouro
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

        <div className="sm:col-span-4">
          <label className="field-label" htmlFor="complement">
            Complemento <span className="font-normal text-ink-muted">(opcional)</span>
          </label>
          <input
            id="complement"
            name="complement"
            className="field"
            value={form.complement ?? ''}
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

        <div className="sm:col-span-2">
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

        <div className="sm:col-span-1">
          <label className="field-label" htmlFor="state">
            UF
          </label>
          <select
            id="state"
            name="state"
            className="field"
            value={form.state}
            onChange={(event) => set('state', event.target.value)}
            required
          >
            <option value="">—</option>
            {UF.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          <FieldError>{state.errors?.state}</FieldError>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={address?.isDefault ?? true}
          className="h-4 w-4 accent-brand-700"
        />
        <span className="text-brand-900">Usar como endereço padrão</span>
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          {address ? 'Salvar alterações' : 'Salvar endereço'}
        </button>
        {canCancel && (
          <button type="button" onClick={onDone} className="btn btn-ghost">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
