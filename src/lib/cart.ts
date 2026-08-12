import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { CART_COOKIE } from './session'

// O carrinho vive no banco, referenciado por um cookie. Guardar no servidor é
// o que permite validar estoque e preço no momento do checkout em vez de
// confiar no que o navegador enviou.

const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
}

const cartInclude = {
  items: {
    include: {
      variant: {
        include: {
          product: {
            include: { images: { orderBy: { sortOrder: 'asc' as const }, take: 1 }, category: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
}

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof readCart>>>
export type CartLine = CartWithItems['items'][number]

/** Lê o carrinho atual sem criar nada. Seguro para usar durante o render. */
export async function readCart() {
  const store = await cookies()
  const cartId = store.get(CART_COOKIE)?.value
  if (!cartId) return null

  return prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude })
}

/**
 * Devolve o carrinho da sessão, criando um se necessário.
 *
 * Escreve cookie, então só pode ser chamada de Server Action ou Route Handler
 * — durante o render do Server Component o Next não permite `cookies().set`.
 */
export async function ensureCart(userId?: string) {
  const store = await cookies()
  const cartId = store.get(CART_COOKIE)?.value

  if (cartId) {
    const existing = await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude })
    if (existing) {
      // Vincula o carrinho anônimo à conta assim que o visitante se identifica.
      if (userId && existing.userId !== userId) {
        await prisma.cart.update({ where: { id: existing.id }, data: { userId } })
      }
      return existing
    }
  }

  const created = await prisma.cart.create({ data: { userId }, include: cartInclude })
  store.set(CART_COOKIE, created.id, CART_COOKIE_OPTIONS)
  return created
}

/** Preço efetivo da linha: a variante pode sobrescrever o preço do produto. */
export function linePrice(line: CartLine): number {
  return line.variant.price ?? line.variant.product.basePrice
}

export function variantLabel(variant: { size: string; color: string | null }): string {
  const parts = [variant.size !== 'Único' ? `Tam. ${variant.size}` : null, variant.color]
  const label = parts.filter(Boolean).join(' · ')
  return label || 'Tamanho único'
}

export function summarizeCart(cart: CartWithItems | null) {
  if (!cart || cart.items.length === 0) {
    return { subtotal: 0, quantity: 0, weightGrams: 0, isEmpty: true }
  }

  let subtotal = 0
  let quantity = 0
  let weightGrams = 0

  for (const line of cart.items) {
    subtotal += linePrice(line) * line.quantity
    quantity += line.quantity
    weightGrams += line.variant.product.weightGrams * line.quantity
  }

  return { subtotal, quantity, weightGrams, isEmpty: false }
}

/**
 * Junta o carrinho anônimo ao carrinho salvo da conta no login.
 * Quantidades do mesmo SKU são somadas, respeitando o estoque disponível.
 */
export async function mergeCartsOnLogin(userId: string) {
  const store = await cookies()
  const anonymousId = store.get(CART_COOKIE)?.value
  if (!anonymousId) return

  const [anonymous, saved] = await Promise.all([
    prisma.cart.findUnique({ where: { id: anonymousId }, include: { items: true } }),
    prisma.cart.findFirst({
      where: { userId, id: { not: anonymousId } },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  if (!anonymous) return

  if (!saved) {
    await prisma.cart.update({ where: { id: anonymous.id }, data: { userId } })
    return
  }

  for (const line of anonymous.items) {
    const existing = saved.items.find((item) => item.variantId === line.variantId)
    const variant = await prisma.productVariant.findUnique({ where: { id: line.variantId } })
    if (!variant) continue

    const wanted = (existing?.quantity ?? 0) + line.quantity
    const quantity = Math.min(wanted, variant.stock)
    if (quantity <= 0) continue

    await prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: saved.id, variantId: line.variantId } },
      create: { cartId: saved.id, variantId: line.variantId, quantity },
      update: { quantity },
    })
  }

  await prisma.cart.delete({ where: { id: anonymous.id } })
  store.set(CART_COOKIE, saved.id, CART_COOKIE_OPTIONS)
}
