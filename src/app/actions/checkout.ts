'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { linePrice, readCart, summarizeCart, variantLabel } from '@/lib/cart'
import { CheckoutError, createOrder } from '@/lib/orders'
import { paymentProvider } from '@/lib/payments'
import { checkoutSchema, fieldErrors } from '@/lib/validation'
import { normalizeZip } from '@/lib/shipping'
import { COUPON_COOKIE } from '@/lib/coupon'

export type CheckoutState = { errors?: Record<string, string> }

/**
 * Fecha a compra: grava o pedido, abre a sessão de pagamento e leva o cliente
 * para onde ele paga.
 *
 * Nada do que vem do formulário define preço. O que o navegador envia é o
 * endereço, a modalidade de frete e o meio de pagamento; subtotal, frete e
 * desconto são recalculados em `createOrder` a partir do banco.
 */
export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar?destino=/checkout')

  const cart = await readCart()
  if (!cart || summarizeCart(cart).isEmpty) redirect('/carrinho')

  const store = await cookies()

  const parsed = checkoutSchema.safeParse({
    label: formData.get('label') || 'Principal',
    recipient: formData.get('recipient'),
    zip: normalizeZip(String(formData.get('zip') ?? '')),
    street: formData.get('street'),
    number: formData.get('number'),
    complement: formData.get('complement') || null,
    district: formData.get('district'),
    city: formData.get('city'),
    state: formData.get('state'),
    shippingId: formData.get('shippingId'),
    method: formData.get('method'),
    couponCode: store.get(COUPON_COOKIE)?.value ?? null,
    notes: formData.get('notes') || null,
    saveAddress: formData.get('saveAddress') === 'on',
  })

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const data = parsed.data
  let order

  try {
    order = await createOrder({
      userId: user.id,
      cart,
      address: {
        recipient: data.recipient,
        zip: data.zip,
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
      },
      shippingId: data.shippingId,
      method: data.method,
      couponCode: data.couponCode,
      notes: data.notes,
    })
  } catch (error) {
    if (error instanceof CheckoutError) {
      return { errors: { form: error.message } }
    }
    throw error
  }

  if (data.saveAddress) {
    await prisma.address.create({
      data: {
        userId: user.id,
        label: data.label,
        recipient: data.recipient,
        zip: data.zip,
        street: data.street,
        number: data.number,
        complement: data.complement,
        district: data.district,
        city: data.city,
        state: data.state,
      },
    })
  }

  // A partir daqui o pedido já existe e o estoque já foi reservado. Se o
  // provedor falhar, o cliente vai para a página do pedido e consegue tentar
  // pagar de novo — em vez de perder a compra inteira.
  let checkoutUrl: string | null = null

  try {
    const session = await paymentProvider().createCheckout({
      orderId: order.id,
      orderNumber: order.number,
      method: data.method,
      items: cart.items.map((line) => ({
        id: line.variant.sku,
        title: line.variant.product.name,
        description: variantLabel(line.variant),
        quantity: line.quantity,
        unitPrice: linePrice(line),
        imageUrl: line.variant.product.images[0]?.url ?? null,
      })),
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      payer: {
        name: user.name,
        email: user.email,
        document: user.document,
        phone: user.phone,
      },
      shippingAddress: {
        zip: data.zip,
        street: data.street,
        number: data.number,
        city: data.city,
        state: data.state,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        provider: session.provider,
        preferenceId: session.preferenceId,
        checkoutUrl: session.checkoutUrl,
        paymentPayload: session.payload ?? null,
      },
    })

    checkoutUrl = session.checkoutUrl
  } catch (error) {
    console.error('[checkout] falha ao abrir a sessão de pagamento', error)
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        status: 'PENDING',
        message: 'Não foi possível abrir o pagamento. Tente pagar novamente pela página do pedido.',
      },
    })
  }

  store.delete(COUPON_COOKIE)
  revalidatePath('/', 'layout')

  redirect(checkoutUrl ?? `/pedido/${order.id}`)
}

/** Reabre o pagamento de um pedido que ficou pendente. */
export async function retryPaymentAction(orderId: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order || (order.userId !== user.id && user.role !== 'ADMIN')) redirect('/conta/pedidos')
  if (order.paymentStatus === 'APPROVED') redirect(`/pedido/${order.id}`)

  const session = await paymentProvider().createCheckout({
    orderId: order.id,
    orderNumber: order.number,
    method: order.paymentMethod as 'PIX' | 'BOLETO' | 'CREDIT_CARD',
    items: order.items.map((item) => ({
      id: item.sku,
      title: item.productName,
      description: item.variantLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      imageUrl: item.imageUrl,
    })),
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    payer: {
      name: user.name,
      email: user.email,
      document: user.document,
      phone: user.phone,
    },
    shippingAddress: {
      zip: order.zip,
      street: order.street,
      number: order.number_,
      city: order.city,
      state: order.state,
    },
  })

  await prisma.order.update({
    where: { id: order.id },
    data: {
      provider: session.provider,
      preferenceId: session.preferenceId,
      checkoutUrl: session.checkoutUrl,
      paymentPayload: session.payload ?? null,
    },
  })

  redirect(session.checkoutUrl ?? `/pedido/${order.id}`)
}
