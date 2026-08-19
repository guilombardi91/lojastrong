'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { LoaderCircle } from 'lucide-react'
import {
  confirmEmailAction,
  requestPasswordResetAction,
  resetPasswordAction,
  signInAction,
  signUpAction,
  type FormState,
} from '@/app/actions/auth'
import { FieldError, FormError, SuccessNote } from '@/components/ui/feedback'

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
        <div className="flex items-baseline justify-between gap-3">
          <label className="field-label" htmlFor="password">
            Senha
          </label>
          <Link
            href="/esqueci-senha"
            className="text-xs font-semibold text-brand-700 underline underline-offset-4"
          >
            Esqueci minha senha
          </Link>
        </div>
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

      {/* Aviso de aceite junto ao botão: é o que torna os termos oponíveis a
          quem se cadastra. Sem link visível no momento da ação, o documento
          existe mas não foi apresentado. */}
      <p className="text-center text-xs leading-relaxed text-ink-muted">
        Ao criar a conta você concorda com os{' '}
        <Link href="/termos" className="font-semibold text-brand-700 underline underline-offset-4">
          Termos de Uso
        </Link>{' '}
        e com a{' '}
        <Link
          href="/privacidade"
          className="font-semibold text-brand-700 underline underline-offset-4"
        >
          Política de Privacidade
        </Link>
        .
      </p>

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

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial)

  // Some com o formulário depois do envio: reapresentá-lo convida a reenviar
  // várias vezes, e cada emissão invalida o link anterior.
  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <SuccessNote>{state.message}</SuccessNote>
        <p className="text-sm text-ink-muted">
          O link vale por 1 hora. Não chegou? Confira a caixa de spam antes de pedir outro.
        </p>
        <Link href="/entrar" className="btn btn-outline w-full">
          Voltar para entrar
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormError>{state.errors?.form}</FormError>

      <div>
        <label className="field-label" htmlFor="email">
          E-mail da conta
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

      <SubmitButton pending={pending}>Enviar link de redefinição</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Lembrou a senha?{' '}
        <Link href="/entrar" className="font-semibold text-brand-700 underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </form>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial)

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <SuccessNote>{state.message}</SuccessNote>
        <Link href="/entrar" className="btn btn-primary w-full">
          Entrar com a senha nova
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormError>{state.errors?.form}</FormError>

      <div>
        <label className="field-label" htmlFor="password">
          Nova senha
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
          Confirmar nova senha
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

      <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        Ao salvar, as sessões abertas em outros aparelhos são encerradas.
      </p>
    </form>
  )
}

export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(confirmEmailAction, initial)

  if (state.ok) {
    return (
      <div className="flex flex-col gap-4">
        <SuccessNote>{state.message}</SuccessNote>
        <Link href="/conta" className="btn btn-primary w-full">
          Ir para minha conta
        </Link>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <FormError>{state.errors?.form}</FormError>

      <SubmitButton pending={pending}>Confirmar meu e-mail</SubmitButton>

      <p className="text-center text-sm text-ink-muted">
        <Link href="/entrar" className="font-semibold text-brand-700 underline underline-offset-4">
          Voltar para entrar
        </Link>
      </p>
    </form>
  )
}
