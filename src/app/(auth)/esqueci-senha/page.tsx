import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Esqueci minha senha' }

export default function EsqueciSenhaPage() {
  return (
    <>
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Recuperar acesso</p>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">Esqueceu a senha?</h1>
        <p className="mt-2 text-ink-muted">
          Informe o e-mail cadastrado e enviamos um link para você criar uma senha nova.
        </p>
      </header>

      <ForgotPasswordForm />
    </>
  )
}
