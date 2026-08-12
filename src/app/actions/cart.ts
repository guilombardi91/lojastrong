'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ensureCart, readCart } from '@/lib/cart'

export type CartActionResult = { ok: boolean; message?: string }

/**
 * Coloca uma variante no carrinho.
 *
 * O estoque é o teto: pedir 10 de um item com 3 peças adiciona 3 e avisa, em
 * vez de falhar — o comprador continua a jornada sabendo o que aconteceu.
 */
export async function addToCartAction(
  variantId: string,
  quantity = 1,
): Promise<CartActionResult> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: true },
  })

  if (!variant || !variant.active || !variant.product.active) {
    return { ok: false, message: 'Este item não está disponível.' }
  }
  if (variant.stock <= 0) {
    return { ok: false, message: 'Item esgotado.' }
  }

  const user = await getCurrentUser()
  const cart = await ensureCart(user?.id)
  const current = cart.items.find((item) => item.variantId === variantId)?.quantity ?? 0
  const desired = current + Math.max(1, quantity)
  const finalQuantity = Math.min(desired, variant.stock)

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId: cart.id, variantId } },
    create: { cartId: cart.id, variantId, quantity: finalQuantity },
    update: { quantity: finalQuantity },
  })
  await prisma.cart.update({ where: { id: cart.id }, data: { updatedAt: new Date() } })

  revalidatePath('/', 'layout')

  if (finalQuantity < desired) {
    return {
      ok: true,
      message: `Adicionamos ${finalQuantity - current}: é o que resta em estoque.`,
    }
  }

  return { ok: true, message: 'Item adicionado ao carrinho.' }
}

export async function setQuantityAction(
  itemId: string,
  quantity: number,
): Promise<CartActionResult> {
  const cart = await readCart()
  const line = cart?.items.find((item) => item.id === itemId)
  if (!cart || !line) return { ok: false, message: 'Item não encontrado no carrinho.' }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } })
    revalidatePath('/', 'layout')
    return { ok: true, message: 'Item removido.' }
  }

  const capped = Math.min(quantity, line.variant.stock)
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: capped } })
  revalidatePath('/', 'layout')

  if (capped < quantity) {
    return { ok: true, message: `Restam apenas ${capped} unidades deste item.` }
  }
  return { ok: true }
}

export async function removeFromCartAction(itemId: string): Promise<CartActionResult> {
  const cart = await readCart()
  if (!cart?.items.some((item) => item.id === itemId)) {
    return { ok: false, message: 'Item não encontrado no carrinho.' }
  }

  await prisma.cartItem.delete({ where: { id: itemId } })
  revalidatePath('/', 'layout')
  return { ok: true, message: 'Item removido.' }
}
