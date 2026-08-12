'use client'

import { useActionState, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { changePasswordAction, updateProfileAction, type FormState } from '@/app/actions/auth'
import { FieldError, FormError, SuccessNote } from '@/components/ui/feedback'
import { formatDocument, formatPhone } from '@/lib/utils'

export function PerfilForm({
  name,
  phone,
  document,
  email,
}: {
  name: string
  phone: string
  document: string
  email: string
}) {
  const [state, action, pending] = useActionState(updateProfileAction, {} as FormState)
  const [phoneValue, setPhoneValue] = useState(formatPhone(phone))
  const [documentValue, setDocumentValue] = useState(formatDocument(document))

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      <h2 className="font-display text-lg font-bold text-brand-950">Dados pessoais</h2>

      <FormError>{state.errors?.form}</FormError>
      {state.ok && <SuccessNote>{state.message}</SuccessNote>}

      <div>
        <label className="field-label" htmlFor="name">
          Nome completo
        </label>
        <input id="name" name="name" className="field" defaultValue={name} required />
        <FieldError>{state.errors?.name}</FieldError>
      </div>

      <div>
        <label className="field-label" htmlFor="email-readonly">
          E-mail
        </label>
        <input
          id="email-readonly"
          className="field bg-brand-50 text-ink-muted"
          value={email}
          readOnly
          aria-describedby="email-nota"
        />
        <p id="email-nota" className="mt-1.5 text-xs text-ink-muted">
          O e-mail identifica sua conta e seus pedidos. Para trocá-lo, fale com a loja.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="phone">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            className="field font-mono"
            inputMode="tel"
            placeholder="(11) 90000-0000"
            value={phoneValue}
            onChange={(event) => setPhoneValue(formatPhone(event.target.value))}
          />
          <FieldError>{state.errors?.phone}</FieldError>
        </div>

        <div>
          <label className="field-label" htmlFor="document">
            CPF
          </label>
          <input
            id="document"
            name="document"
            className="field font-mono"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={documentValue}
            onChange={(event) => setDocumentValue(formatDocument(event.target.value))}
            aria-describedby="documento-nota"
          />
          <FieldError>{state.errors?.document}</FieldError>
          <p id="documento-nota" className="mt-1.5 text-xs text-ink-muted">
            Usado na emissão da nota fiscal e do pagamento.
          </p>
        </div>
      </div>

      <button type="submit" className="btn btn-primary self-start" disabled={pending}>
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
        Salvar alterações
      </button>
    </form>
  )
}

export function SenhaForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {} as FormState)

  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      <h2 className="font-display text-lg font-bold text-brand-950">Senha</h2>

      <FormError>{state.errors?.form}</FormError>
      {state.ok && <SuccessNote>{state.message}</SuccessNote>}

      <div>
        <label className="field-label" htmlFor="current">
          Senha atual
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          className="field"
          required
        />
        <FieldError>{state.errors?.current}</FieldError>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="new-password">
            Nova senha
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="field"
            placeholder="Pelo menos 8 caracteres"
            required
          />
          <FieldError>{state.errors?.password}</FieldError>
        </div>

        <div>
          <label className="field-label" htmlFor="confirm">
            Confirmar nova senha
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            className="field"
            required
          />
          <FieldError>{state.errors?.confirm}</FieldError>
        </div>
      </div>

      <button type="submit" className="btn btn-outline self-start" disabled={pending}>
        {pending && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
        Alterar senha
      </button>
    </form>
  )
}
