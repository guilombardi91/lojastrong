'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { applyCoupon, COUPON_COOKIE } from '@/lib/coupon'
import { readCart, summarizeCart } from '@/lib/cart'

export type CouponState = { ok?: boolean; message?: string; code?: string }

/**
 * Guarda o cupom escolhido em cookie para atravessar carrinho e checkout.
 *
 * O código é apenas uma intenção: quem decide o desconto de verdade é
 * `createOrder`, que revalida tudo no fechamento do pedido.
 */
export async function applyCouponAction(
  _prev: CouponState,
  formData: FormData,
): Promise<CouponState> {
  const code = String(formData.get('cupom') ?? '').trim()
  const store = await cookies()

  if (!code) {
    store.delete(COUPON_COOKIE)
    revalidatePath('/carrinho')
    return { ok: true, message: 'Cupom removido.' }
  }

  const cart = await readCart()
  const { subtotal } = summarizeCart(cart)
  const result = await applyCoupon(code, subtotal)

  if (!result.ok) {
    store.delete(COUPON_COOKIE)
    return { ok: false, message: result.reason }
  }

  store.set(COUPON_COOKIE, result.code, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  revalidatePath('/carrinho')
  return { ok: true, message: `${result.description} aplicado.`, code: result.code }
}

export async function removeCouponAction() {
  const store = await cookies()
  store.delete(COUPON_COOKIE)
  revalidatePath('/carrinho')
}
