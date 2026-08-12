import { prisma } from './prisma'
import { linePrice, summarizeCart, variantLabel, type CartWithItems } from './cart'
import { quoteShipping } from './shipping'
import { applyCoupon, consumeCoupon } from './coupon'
import type { OrderStatus, PaymentMethod, PaymentStatus } from './enums'

export type CheckoutAddress = {
  recipient: string
  zip: string
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  state: string
}

export type CreateOrderInput = {
  userId: string
  cart: CartWithItems
  address: CheckoutAddress
  shippingId: 'PADRAO' | 'EXPRESSA'
  method: PaymentMethod
  couponCode?: string | null
  notes?: string | null
  /// Id anônimo do visitante (cookie sbs_visitor), para o relatório de
  /// conversão ligar visita e compra sem usar dado pessoal.
  visitorId?: string | null
}

/**
 * Número legível do pedido. A unicidade é garantida pelo índice do banco; em
 * caso de corrida, `createOrder` tenta de novo com o próximo sequencial.
 */
async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const countThisYear = await prisma.order.count({
    where: { createdAt: { gte: new Date(`${year}-01-01T00:00:00.000Z`) } },
  })
  return `SBS-${year}-${String(countThisYear + 1).padStart(6, '0')}`
}

export class CheckoutError extends Error {}

/**
 * Fecha o carrinho num pedido.
 *
 * Preços, frete e desconto são recalculados aqui a partir do banco: o que o
 * navegador enviou serve para escolher endereço e modalidade, nunca para
 * definir quanto o cliente paga. O estoque é reservado na criação — quem
 * chegou ao checkout primeiro leva a peça — e devolvido se o pedido for
 * cancelado.
 */
export async function createOrder(input: CreateOrderInput) {
  const { cart, address, userId, method } = input
  const summary = summarizeCart(cart)

  if (summary.isEmpty) {
    throw new CheckoutError('Seu carrinho está vazio.')
  }

  // Confere estoque antes de abrir a transação, para devolver um erro claro.
  for (const line of cart.items) {
    if (line.quantity > line.variant.stock) {
      throw new CheckoutError(
        `Restam apenas ${line.variant.stock} unidades de ${line.variant.product.name} (${variantLabel(line.variant)}).`,
      )
    }
    if (!line.variant.active || !line.variant.product.active) {
      throw new CheckoutError(`${line.variant.product.name} não está mais disponível.`)
    }
  }

  const options = quoteShipping(address.state, summary.weightGrams, summary.subtotal)
  const chosen = options.find((option) => option.id === input.shippingId) ?? options[0]

  let discount = 0
  let couponCode: string | null = null
  let shippingCost = chosen.price

  if (input.couponCode) {
    const result = await applyCoupon(input.couponCode, summary.subtotal)
    if (!result.ok) throw new CheckoutError(result.reason)
    discount = result.discount
    couponCode = result.code
    if (result.freeShipping) shippingCost = 0
  }

  const total = Math.max(0, summary.subtotal - discount) + shippingCost

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        number: await nextOrderNumber(),
        userId,
        visitorId: input.visitorId ?? null,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: method,
        subtotal: summary.subtotal,
        shipping: shippingCost,
        discount,
        total,
        couponCode,
        recipient: address.recipient,
        zip: address.zip,
        street: address.street,
        number_: address.number,
        complement: address.complement ?? null,
        district: address.district,
        city: address.city,
        state: address.state,
        shippingMethod: chosen.name,
        notes: input.notes ?? null,
        provider: process.env.PAYMENT_PROVIDER ?? 'sandbox',
        items: {
          create: cart.items.map((line) => ({
            variantId: line.variantId,
            productName: line.variant.product.name,
            variantLabel: variantLabel(line.variant),
            sku: line.variant.sku,
            unitPrice: linePrice(line),
            quantity: line.quantity,
            total: linePrice(line) * line.quantity,
            imageUrl: line.variant.product.images[0]?.url ?? null,
          })),
        },
        events: {
          create: {
            status: 'PENDING',
            message: 'Pedido registrado. Aguardando confirmação do pagamento.',
          },
        },
      },
      include: { items: true },
    })

    for (const line of cart.items) {
      // `decrement` condicionado ao estoque disponível: se outra compra
      // esvaziou a variante entre a checagem e agora, nenhuma linha é afetada
      // e a transação inteira é desfeita.
      const updated = await tx.productVariant.updateMany({
        where: { id: line.variantId, stock: { gte: line.quantity } },
        data: { stock: { decrement: line.quantity } },
      })

      if (updated.count === 0) {
        throw new CheckoutError(
          `${line.variant.product.name} esgotou enquanto você finalizava a compra.`,
        )
      }

      await tx.stockMovement.create({
        data: {
          variantId: line.variantId,
          delta: -line.quantity,
          reason: 'SALE',
          orderId: created.id,
          note: `Venda no pedido ${created.number}`,
        },
      })
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

    return created
  })

  if (couponCode) await consumeCoupon(couponCode)

  return order
}

/** Registra a aprovação do pagamento. Idempotente: o webhook pode repetir. */
export async function markOrderPaid(orderId: string, paymentId?: string | null) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) return null
  if (order.paymentStatus === 'APPROVED') return order

  return prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'APPROVED',
      status: 'PAID',
      paidAt: new Date(),
      paymentId: paymentId ?? order.paymentId,
      events: {
        create: {
          status: 'PAID',
          message: 'Pagamento aprovado. Seu pedido entrou na fila de separação.',
        },
      },
    },
  })
}

export async function markPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  paymentId?: string | null,
) {
  if (paymentStatus === 'APPROVED') return markOrderPaid(orderId, paymentId)

  const messages: Record<Exclude<PaymentStatus, 'APPROVED'>, string> = {
    PENDING: 'Pagamento em processamento.',
    REJECTED: 'Pagamento recusado pela operadora.',
    REFUNDED: 'Pagamento estornado.',
  }

  if (paymentStatus === 'REJECTED' || paymentStatus === 'REFUNDED') {
    return cancelOrder(orderId, messages[paymentStatus])
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus, paymentId: paymentId ?? undefined },
  })
}

/** Cancela o pedido e devolve ao estoque o que havia sido reservado. */
export async function cancelOrder(orderId: string, reason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, movements: true },
  })
  if (!order || order.status === 'CANCELED') return order

  return prisma.$transaction(async (tx) => {
    const alreadyReturned = order.movements.some((m) => m.reason === 'CANCELLATION')

    if (!alreadyReturned) {
      for (const item of order.items) {
        if (!item.variantId) continue
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            variantId: item.variantId,
            delta: item.quantity,
            reason: 'CANCELLATION',
            orderId: order.id,
            note: `Cancelamento do pedido ${order.number}`,
          },
        })
      }
    }

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELED',
        paymentStatus: order.paymentStatus === 'APPROVED' ? 'REFUNDED' : 'REJECTED',
        events: { create: { status: 'CANCELED', message: reason } },
      },
    })
  })
}

export async function advanceOrderStatus(
  orderId: string,
  status: OrderStatus,
  message: string,
  trackingCode?: string | null,
) {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      trackingCode: trackingCode ?? undefined,
      events: { create: { status, message } },
    },
  })
}
