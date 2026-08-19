import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { formatBRL } from '@/lib/money'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { AdminHeader, DataTable, Td, Th } from '@/components/admin/ui'
import { CustomerActions } from '@/components/admin/customer-actions'

export const metadata: Metadata = { title: 'Clientes' }

export default async function AdminClientesPage({ searchParams }: PageProps<'/admin/clientes'>) {
  const admin = await requireAdmin()
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q.trim() : ''

  const where: Prisma.UserWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      }
    : {}

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      orders: {
        where: { paymentStatus: 'APPROVED' },
        select: { total: true },
      },
      _count: { select: { orders: true } },
    },
  })

  return (
    <>
      <AdminHeader
        title="Clientes"
        description="Quem comprou, quanto comprou e quem tem acesso à área administrativa."
      />

      <form action="/admin/clientes" className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Nome ou e-mail"
          aria-label="Buscar clientes"
          className="field w-72"
        />
        <button type="submit" className="btn btn-outline btn-sm">
          Buscar
        </button>
      </form>

      <DataTable
        empty={q ? 'Nenhum cliente com esse termo.' : 'Nenhum cliente cadastrado.'}
        head={
          <>
            <Th>Cliente</Th>
            <Th>Cadastro</Th>
            <Th>Pedidos</Th>
            <Th className="text-right">Total comprado</Th>
            <Th className="text-right">Ações</Th>
          </>
        }
      >
        {users.map((user) => {
          const spent = user.orders.reduce((sum, order) => sum + order.total, 0)

          return (
            <tr key={user.id} className={user.active ? '' : 'opacity-55'}>
              <Td>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{user.name}</span>
                  {user.role === 'ADMIN' && <Badge tone="brand">Admin</Badge>}
                  {!user.active && <Badge tone="danger">Desativado</Badge>}
                </div>
                <span className="mt-0.5 block text-xs text-ink-muted">{user.email}</span>
              </Td>
              <Td className="text-sm text-ink-muted">{formatDate(user.createdAt)}</Td>
              <Td className="font-mono text-xs">{user._count.orders}</Td>
              <Td className="text-right font-display font-bold">{formatBRL(spent)}</Td>
              <Td>
                <CustomerActions
                  id={user.id}
                  active={user.active}
                  role={user.role}
                  isSelf={user.id === admin.id}
                />
              </Td>
            </tr>
          )
        })}
      </DataTable>
    </>
  )
}
