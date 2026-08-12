import { prisma } from '../prisma'
import { formatBRL } from '../money'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, type OrderStatus, type PaymentMethod } from '../enums'
import type { ReportExport } from './types'

export async function getFinanceiroData(since: Date) {
  const [approved, byStatus, byMethod, byCoupon] = await Promise.all([
    prisma.order.findMany({
      where: { paymentStatus: 'APPROVED', createdAt: { gte: since } },
      select: { total: true, discount: true, shipping: true, subtotal: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { paymentStatus: 'APPROVED', createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
    }),
    prisma.order.groupBy({
      by: ['couponCode'],
      where: { paymentStatus: 'APPROVED', createdAt: { gte: since }, couponCode: { not: null } },
      _count: { _all: true },
      _sum: { discount: true },
      orderBy: { _sum: { discount: 'desc' } },
    }),
  ])

  const revenue = approved.reduce((sum, order) => sum + order.total, 0)
  const discountTotal = approved.reduce((sum, order) => sum + order.discount, 0)
  const shippingTotal = approved.reduce((sum, order) => sum + order.shipping, 0)
  const averageTicket = approved.length > 0 ? Math.round(revenue / approved.length) : 0

  return { approved, byStatus, byMethod, byCoupon, revenue, discountTotal, shippingTotal, averageTicket }
}

export type FinanceiroData = Awaited<ReturnType<typeof getFinanceiroData>>

export function financeiroToExport(data: FinanceiroData, periodLabel: string): ReportExport {
  return {
    title: 'Relatório financeiro',
    periodLabel,
    generatedAt: new Date(),
    stats: [
      {
        label: 'Faturamento aprovado',
        value: formatBRL(data.revenue),
        hint: `${data.approved.length} ${data.approved.length === 1 ? 'pedido pago' : 'pedidos pagos'}`,
      },
      { label: 'Ticket médio', value: formatBRL(data.averageTicket) },
      { label: 'Descontos concedidos', value: formatBRL(data.discountTotal) },
      { label: 'Frete cobrado', value: formatBRL(data.shippingTotal) },
    ],
    tables: [
      {
        title: 'Por meio de pagamento',
        headers: ['Meio', 'Pedidos', 'Valor'],
        rows: data.byMethod.map((row) => [
          PAYMENT_METHOD_LABEL[row.paymentMethod as PaymentMethod] ?? row.paymentMethod,
          row._count._all,
          formatBRL(row._sum.total ?? 0),
        ]),
      },
      {
        title: 'Por status do pedido',
        headers: ['Status', 'Pedidos'],
        rows: data.byStatus.map((row) => [
          ORDER_STATUS_LABEL[row.status as OrderStatus] ?? row.status,
          row._count._all,
        ]),
      },
      {
        title: 'Cupons usados',
        headers: ['Código', 'Pedidos', 'Desconto concedido'],
        rows: data.byCoupon.map((row) => [
          row.couponCode ?? '',
          row._count._all,
          formatBRL(row._sum.discount ?? 0),
        ]),
      },
    ],
  }
}
