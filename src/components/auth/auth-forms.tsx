'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { LoaderCircle } from 'lucide-react'
import { signInAction, signUpAction, type FormState } from '@/app/actions/auth'
import { FieldError, FormError } from '@/components/ui/feedback'

const initial: FormState = {}

function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" className="btn btn-primary w-full" disabled={pending}>
      {pending && <LoaderCircle size={17} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

export function SignInForm({ destination }: { destination?: string }) {
  const [state, action, pending] = useActionState(signInAction, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      {destination && <input type="hidden" name="destino" value={destination} />}
      <FormError>{state.errors?.form}</FormError>

      <div>
        <label className="field-label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          placeholder="voce@email.com"
        />
        <FieldError>{state.errors?.email}</FieldError>
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
          placeholder="⬢⬢⬢⬢⬢⬢⬢⬢"
        />
        <FieldError>{state.errors?.password}</FieldError>
      </div>

      <SubmitButton pending={pending}>Entrar</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Ainda não tem conta?{' '}
        <Link
          href={destination ? `/criar-conta?destino=${encodeURIComponent(destination)}` : '/criar-conta'}
          className="font-semibold text-brand-700 underline underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
    </form>
  )
}

export function SignUpForm({ destination }: { destination?: string }) {
  const [state, action, pending] = useActionState(signUpAction, initial)

  return (
    <form action={action} className="flex flex-col gap-4">
      {destination && <input type="hidden" name="destino" value={destination} />}
      <FormError>{state.errors?.form}</FormError>

      <div>
        <label className="field-label" htmlFor="name">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          required
          className="field"
          placeholder="Como aparece no seu documento"
        />
        <FieldError>{state.errors?.name}</FieldError>
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          placeholder="voce@email.com"
        />
        <FieldError>{state.errors?.email}</FieldError>
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="field"
          placeholder="Pelo menos 8 caracteres"
        />
        <FieldError>{state.errors?.password}</FieldError>
      </div>

      <div>
        <label className="field-label" htmlFor="confirm">
          Confirmar senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="field"
          placeholder="Repita a senha"
        />
        <FieldError>{state.errors?.confirm}</FieldError>
      </div>

      <SubmitButton pending={pending}>Criar conta</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Já tem conta?{' '}
        <Link
          href={destination ? `/entrar?destino=${encodeURIComponent(destination)}` : '/entrar'}
          className="font-semibold text-brand-700 underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </form>
  )
}
