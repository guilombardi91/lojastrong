import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Redefinir senha' }

export default async function RedefinirSenhaPage({ searchParams }: PageProps<'/redefinir-senha'>) {
  const { token } = await searchParams
  const raw = typeof token === 'string' ? token : ''

  // O token não é validado aqui: quem confere é a Server Action, no envio do
  // formulário. Checar agora obrigaria a consultar o banco a cada abertura do
  // link — inclusive as feitas por scanners de e-mail.
  if (!raw) {
    return (
      <>
        <header className="mb-8">
          <p className="tag mb-3 text-amber-600">Recuperar acesso</p>
          <h1 className="font-display text-3xl font-extrabold text-brand-950">Link incompleto</h1>
          <p className="mt-2 text-ink-muted">
            O endereço aberto não traz o código de redefinição. Copie o link inteiro do e-mail ou
            peça um novo.
          </p>
        </header>

        <Link href="/esqueci-senha" className="btn btn-primary w-full">
          Pedir um link novo
        </Link>
      </>
    )
  }

  return (
    <>
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Recuperar acesso</p>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">Criar senha nova</h1>
        <p className="mt-2 text-ink-muted">Escolha uma senha que você ainda não usa em outro site.</p>
      </header>

      <ResetPasswordForm token={raw} />
    </>
  )
}
