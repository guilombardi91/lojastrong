import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SignInForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Entrar' }

export default async function EntrarPage({ searchParams }: PageProps<'/entrar'>) {
  const user = await getCurrentUser()
  const { destino } = await searchParams
  const destination = typeof destino === 'string' && destino.startsWith('/') ? destino : undefined

  if (user) redirect(destination ?? (user.role === 'ADMIN' ? '/admin' : '/conta'))

  return (
    <>
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Bem-vindo de volta</p>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">Entrar na loja</h1>
        <p className="mt-2 text-ink-muted">
          Acompanhe pedidos, salve endereços e finalize a compra mais rápido.
        </p>
      </header>

      <SignInForm destination={destination} />
    </>
  )
}
