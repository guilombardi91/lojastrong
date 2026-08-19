import type { Metadata } from 'next'
import Link from 'next/link'
import { ConfirmEmailForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Confirmar e-mail' }

export default async function ConfirmarEmailPage({ searchParams }: PageProps<'/confirmar-email'>) {
  const { token } = await searchParams
  const raw = typeof token === 'string' ? token : ''

  if (!raw) {
    return (
      <>
        <header className="mb-8">
          <p className="tag mb-3 text-amber-600">Confirmação de cadastro</p>
          <h1 className="font-display text-3xl font-extrabold text-brand-950">Link incompleto</h1>
          <p className="mt-2 text-ink-muted">
            O endereço aberto não traz o código de confirmação. Entre na sua conta para pedir um
            link novo.
          </p>
        </header>

        <Link href="/entrar" className="btn btn-primary w-full">
          Entrar na loja
        </Link>
      </>
    )
  }

  return (
    <>
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Confirmação de cadastro</p>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">
          Confirme seu e-mail
        </h1>
        <p className="mt-2 text-ink-muted">
          Falta um clique para liberar a finalização de pedidos na sua conta.
        </p>
      </header>

      <ConfirmEmailForm token={raw} />
    </>
  )
}
