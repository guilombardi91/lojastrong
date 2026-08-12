'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { advanceOrderStatus, cancelOrder } from '@/lib/orders'
import { inputToCents } from '@/lib/money'
import { couponSchema, fieldErrors } from '@/lib/validation'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/enums'
import type { AdminState } from './catalogo'

// --------------------------------------------------------------- pedidos

export async function updateOrderStatusAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireAdmin()

  const orderId = String(formData.get('orderId') ?? '')
  const status = String(formData.get('status') ?? '') as OrderStatus
  const trackingCode = String(formData.get('trackingCode') ?? '').trim() || null
  const note = String(formData.get('note') ?? '').trim()

  if (!ORDER_STATUSES.includes(status)) {
    return { errors: { status: 'Selecione um status válido.' } }
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return { errors: { form: 'Pedido não encontrado.' } }

  if (status === 'CANCELED') {
    await cancelOrder(orderId, note || 'Cancelado pela equipe da loja.')
    revalidatePath(`/admin/pedidos/${orderId}`)
    revalidatePath('/admin/pedidos')
    return { ok: true, message: 'Pedido cancelado e estoque devolvido.' }
  }

  const messages: Record<Exclude<OrderStatus, 'CANCELED'>, string> = {
    PENDING: 'Pedido aguardando confirmação do pagamento.',
    PAID: 'Pagamento confirmado pela equipe.',
    PACKING: 'Pedido em separação no estoque.',
    SHIPPED: trackingCode
      ? `Pedido despachado. Rastreio ${trackingCode}.`
      : 'Pedido despachado.',
    DELIVERED: 'Entrega concluída.',
  }

  await advanceOrderStatus(orderId, status, note || messages[status], trackingCode)

  revalidatePath(`/admin/pedidos/${orderId}`)
  revalidatePath('/admin/pedidos')
  revalidatePath(`/pedido/${orderId}`)
  return { ok: true, message: 'Status atualizado.' }
}

/**
 * Baixa manual de pagamento, para quando a confirmação chega por fora
 * (transferência, acerto interno da escola).
 */
export async function confirmPaymentAction(orderId: string) {
  await requireAdmin()

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order || order.paymentStatus === 'APPROVED') return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'APPROVED',
      status: 'PAID',
      paidAt: new Date(),
      events: {
        create: {
          status: 'PAID',
          message: 'Pagamento confirmado manualmente pela equipe da loja.',
        },
      },
    },
  })

  revalidatePath(`/admin/pedidos/${orderId}`)
  revalidatePath('/admin/pedidos')
  revalidatePath(`/pedido/${orderId}`)
}

// ---------------------------------------------------------------- cupons

export async function saveCouponAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const type = String(formData.get('type') ?? 'PERCENT')
  const rawValue = String(formData.get('value') ?? '0')

  const parsed = couponSchema.safeParse({
    code: formData.get('code'),
    description: formData.get('description') || null,
    type,
    // Percentual é um número inteiro; valor fixo é dinheiro e vira centavos.
    value: type === 'PERCENT' ? Number(rawValue) || 0 : inputToCents(rawValue),
    minSubtotal: inputToCents(String(formData.get('minSubtotal') ?? '0')),
    maxUses: formData.get('maxUses') || null,
    expiresAt: formData.get('expiresAt') || null,
    active: formData.get('active') === 'on',
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const data = parsed.data
  const duplicate = await prisma.coupon.findUnique({
    where: { code: data.code },
    select: { id: true },
  })
  if (duplicate && duplicate.id !== id) {
    return { errors: { code: 'Já existe um cupom com este código.' } }
  }

  const payload = {
    code: data.code,
    description: data.description,
    type: data.type,
    value: data.value,
    minSubtotal: data.minSubtotal,
    maxUses: data.maxUses ?? null,
    expiresAt: data.expiresAt ? new Date(`${data.expiresAt}T23:59:59`) : null,
    active: data.active,
  }

  if (id) {
    await prisma.coupon.update({ where: { id }, data: payload })
  } else {
    await prisma.coupon.create({ data: payload })
  }

  revalidatePath('/admin/cupons')
  return { ok: true, message: 'Cupom salvo.' }
}

export async function toggleCouponAction(id: string) {
  await requireAdmin()
  const coupon = await prisma.coupon.findUnique({ where: { id }, select: { active: true } })
  if (!coupon) return

  await prisma.coupon.update({ where: { id }, data: { active: !coupon.active } })
  revalidatePath('/admin/cupons')
}

export async function deleteCouponAction(id: string) {
  await requireAdmin()
  await prisma.coupon.delete({ where: { id } })
  revalidatePath('/admin/cupons')
}

// -------------------------------------------------------------- clientes

export async function toggleCustomerAction(id: string) {
  const admin = await requireAdmin()

  // Um admin desativar a própria conta derrubaria o acesso à área
  // administrativa na hora seguinte.
  if (id === admin.id) return

  const user = await prisma.user.findUnique({ where: { id }, select: { active: true } })
  if (!user) return

  await prisma.user.update({ where: { id }, data: { active: !user.active } })
  revalidatePath('/admin/clientes')
}

export async function setRoleAction(id: string, role: 'ADMIN' | 'CUSTOMER') {
  const admin = await requireAdmin()
  if (id === admin.id) return

  await prisma.user.update({ where: { id }, data: { role } })
  revalidatePath('/admin/clientes')
}
