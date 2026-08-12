'use server'

import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { markPaymentStatus } from '@/lib/orders'
import { isSandbox } from '@/lib/payments'

/**
 * Desfechos do provedor de simulação.
 *
 * Cada ação revalida o provider e a posse do pedido. Server Actions são
 * endpoints POST alcançáveis por fora da tela, então a checagem não pode viver
 * só no componente que desenha os botões — com o Mercado Pago ligado, estas
 * funções simplesmente não existem para o mundo externo.
 */
async function assertSandboxOrder(orderId: string) {
  const user = await requireUser()
  if (!isSandbox()) notFound()

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.userId !== user.id) notFound()
  return order
}

export async function approveSimulatedPayment(orderId: string) {
  await assertSandboxOrder(orderId)
  await markPaymentStatus(orderId, 'APPROVED', `SIMU-${Date.now()}`)
  redirect(`/pedido/${orderId}?pagamento=sucesso`)
}

export async function rejectSimulatedPayment(orderId: string) {
  await assertSandboxOrder(orderId)
  await markPaymentStatus(orderId, 'REJECTED')
  redirect(`/pedido/${orderId}?pagamento=falha`)
}
