import type { Metadata } from 'next'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatBRL } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { OrderStatusBadge } from '@/components/ui/badge'
import { PerfilForm, SenhaForm } from '@/components/conta/perfil-forms'

export const metadata: Metadata = { title: 'Meus dados' }

export default async function ContaPage() {
  const user = await requireUser()

  const [orderCount, lastOrder] = await Promise.all([
    prisma.order.count({ where: { userId: user.id } }),
    prisma.order.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, number: true, status: true, total: true, createdAt: true },
    }),
  ])

  return (
    <div className="flex flex-col gap-6">
      {lastOrder ? (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="tag mb-1.5 text-ink-muted">Pedido mais recente</p>
            <p className="font-display text-lg font-bold text-brand-950">
              {lastOrder.number} · {formatBRL(lastOrder.total)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Feito em {formatDate(lastOrder.createdAt)} · {orderCount}{' '}
              {orderCount === 1 ? 'pedido no total' : 'pedidos no total'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={lastOrder.status} />
            <Link href={`/pedido/${lastOrder.id}`} className="btn btn-outline btn-sm">
              Acompanhar
            </Link>
          </div>
        </section>
      ) : (
        <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-display text-lg font-bold text-brand-950">
              Você ainda não fez nenhum pedido
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Quando fizer, ele aparece aqui com o rastreio da entrega.
            </p>
          </div>
          <Link href="/produtos" className="btn btn-primary btn-sm">
            Ver o catálogo
          </Link>
        </section>
      )}

      <PerfilForm
        name={user.name}
        email={user.email}
        phone={user.phone ?? ''}
        document={user.document ?? ''}
      />

      <SenhaForm />
    </div>
  )
}
