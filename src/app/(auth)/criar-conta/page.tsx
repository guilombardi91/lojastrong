import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { SignUpForm } from '@/components/auth/auth-forms'

export const metadata: Metadata = { title: 'Criar conta' }

export default async function CriarContaPage({ searchParams }: PageProps<'/criar-conta'>) {
  const user = await getCurrentUser()
  const { destino } = await searchParams
  const destination = typeof destino === 'string' && destino.startsWith('/') ? destino : undefined

  if (user) redirect(destination ?? '/conta')

  return (
    <>
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Primeira compra</p>
        <h1 className="font-display text-3xl font-extrabold text-brand-950">Criar sua conta</h1>
        <p className="mt-2 text-ink-muted">
          Leva menos de um minuto. Você precisa dela para acompanhar a entrega.
        </p>
      </header>

      <SignUpForm destination={destination} />
    </>
  )
}
