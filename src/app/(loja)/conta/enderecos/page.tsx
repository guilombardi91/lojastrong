import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { Enderecos } from '@/components/conta/enderecos'

export const metadata: Metadata = { title: 'Endereços' }

export default async function EnderecosPage() {
  const user = await requireUser()

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-display text-2xl font-extrabold text-brand-950">Endereços salvos</h2>
        <p className="mt-1 text-ink-muted">
          O endereço padrão vem preenchido no checkout — você pode trocar na hora da compra.
        </p>
      </header>

      <Enderecos addresses={addresses} />
    </div>
  )
}
