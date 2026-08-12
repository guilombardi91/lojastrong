import { prisma } from '../prisma'
import { formatBRL } from '../money'
import { formatDate } from '../utils'
import type { ReportExport } from './types'

export async function getUsuariosData(since: Date) {
  const [totalCustomers, activeCustomers, newCustomers, neverOrdered, spendByCustomer] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'CUSTOMER', active: true } }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER', orders: { none: {} } } }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { paymentStatus: 'APPROVED', createdAt: { gte: since } },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
    }),
  ])

  const topCustomerUsers = await prisma.user.findMany({
    where: { id: { in: spendByCustomer.map((row) => row.userId) } },
    select: { id: true, name: true, email: true },
  })
  const userById = new Map(topCustomerUsers.map((user) => [user.id, user]))

  return { totalCustomers, activeCustomers, newCustomers, neverOrdered, spendByCustomer, userById }
}

export type UsuariosData = Awaited<ReturnType<typeof getUsuariosData>>

export function usuariosToExport(data: UsuariosData, periodLabel: string): ReportExport {
  return {
    title: 'Relatório de usuários',
    periodLabel,
    generatedAt: new Date(),
    stats: [
      { label: 'Clientes cadastrados', value: String(data.totalCustomers), hint: `${data.activeCustomers} ativos` },
      { label: 'Novos cadastros', value: String(data.newCustomers.length), hint: 'No período selecionado' },
      { label: 'Nunca compraram', value: String(data.neverOrdered), hint: 'Cadastrados sem nenhum pedido' },
      {
        label: 'Clientes que compraram',
        value: String(data.spendByCustomer.length),
        hint: 'Com pedido aprovado no período',
      },
    ],
    tables: [
      {
        title: 'Quem mais comprou no período',
        headers: ['Cliente', 'E-mail', 'Pedidos', 'Total gasto'],
        rows: data.spendByCustomer.map((row) => {
          const user = data.userById.get(row.userId)
          return [
            user?.name ?? 'Cliente removido',
            user?.email ?? '',
            row._count._all,
            formatBRL(row._sum.total ?? 0),
          ]
        }),
      },
      {
        title: 'Novos cadastros',
        headers: ['Cliente', 'E-mail', 'Desde'],
        rows: data.newCustomers.map((user) => [user.name, user.email, formatDate(user.createdAt)]),
      },
    ],
  }
}
