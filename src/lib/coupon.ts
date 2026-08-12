import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { CouponType } from './enums'

/** Cupom escolhido no carrinho, carregado até o checkout. */
export const COUPON_COOKIE = 'sbs_coupon'

export type CouponResult =
  | { ok: true; code: string; discount: number; freeShipping: boolean; description: string }
  | { ok: false; reason: string }

/**
 * Valida um cupom para o subtotal informado e calcula o desconto em centavos.
 *
 * FREE_SHIPPING não gera desconto no subtotal: sinaliza `freeShipping` para o
 * checkout zerar o frete depois da cotação.
 */
export async function applyCoupon(rawCode: string, subtotal: number): Promise<CouponResult> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { ok: false, reason: 'Informe um código de cupom.' }

  const coupon = await prisma.coupon.findUnique({ where: { code } })
  if (!coupon || !coupon.active) {
    return { ok: false, reason: 'Cupom não encontrado.' }
  }

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, reason: 'Este cupom ainda não está valendo.' }
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, reason: 'Este cupom expirou.' }
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, reason: 'Este cupom atingiu o limite de usos.' }
  }
  if (subtotal < coupon.minSubtotal) {
    const missing = (coupon.minSubtotal / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    return { ok: false, reason: `Este cupom vale em compras a partir de ${missing}.` }
  }

  const type = coupon.type as CouponType
  let discount = 0
  let freeShipping = false

  if (type === 'PERCENT') {
    discount = Math.round((subtotal * coupon.value) / 100)
  } else if (type === 'FIXED') {
    discount = Math.min(coupon.value, subtotal)
  } else {
    freeShipping = true
    discount = 0
  }

  return {
    ok: true,
    code: coupon.code,
    discount,
    freeShipping,
    description: coupon.description ?? describeCoupon(type, coupon.value),
  }
}

function describeCoupon(type: CouponType, value: number): string {
  if (type === 'PERCENT') return `${value}% de desconto`
  if (type === 'FIXED') return `R$ ${(value / 100).toFixed(2).replace('.', ',')} de desconto`
  return 'Frete grátis'
}

/**
 * Cupom guardado no cookie, revalidado contra o carrinho atual.
 * Devolve null quando o cupom deixou de valer — expirou, esgotou os resgates
 * ou o carrinho encolheu abaixo do mínimo.
 */
export async function currentCoupon(subtotal: number) {
  const store = await cookies()
  const code = store.get(COUPON_COOKIE)?.value
  if (!code) return null

  const result = await applyCoupon(code, subtotal)
  return result.ok ? result : null
}

/** Marca o uso após o pedido ser criado, para respeitar o limite de resgates. */
export async function consumeCoupon(code: string) {
  await prisma.coupon.updateMany({
    where: { code },
    data: { usedCount: { increment: 1 } },
  })
}
