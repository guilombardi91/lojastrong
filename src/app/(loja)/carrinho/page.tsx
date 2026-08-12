import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { linePrice, readCart, summarizeCart, variantLabel } from '@/lib/cart'
import { currentCoupon } from '@/lib/coupon'
import { formatBRL } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { CartLine } from '@/components/loja/cart-line'
import { CouponForm } from '@/components/loja/coupon-form'
import { ShippingCalculator } from '@/components/loja/shipping-calculator'
import { EmptyState } from '@/components/ui/feedback'

export const metadata: Metadata = { title: 'Carrinho' }

export default async function CarrinhoPage() {
  const cart = await readCart()
  const summary = summarizeCart(cart)

  if (!cart || summary.isEmpty) {
    return (
      <div className="container-page py-16">
        <h1 className="mb-8 font-display text-4xl font-extrabold text-brand-950">Seu carrinho</h1>
        <EmptyState
          icon={<ShoppingBag size={32} aria-hidden />}
          title="Seu carrinho está vazio"
          description="Escolha uma peça no catálogo e ela aparece aqui, com frete e prazo calculados pelo seu CEP."
          action={{ label: 'Ver o catálogo', href: '/produtos' }}
        />
      </div>
    )
  }

  const coupon = await currentCoupon(summary.subtotal)
  const discount = coupon?.discount ?? 0
  const missingForFreeShipping = FREE_SHIPPING_THRESHOLD - summary.subtotal

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold text-brand-950">Seu carrinho</h1>
        <p className="mt-2 text-ink-muted">
          {summary.quantity} {summary.quantity === 1 ? 'item' : 'itens'} · o estoque é reservado
          quando você finaliza a compra.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <ul className="card divide-y divide-brand-100 px-5 py-5">
            {cart.items.map((line) => (
              <CartLine
                key={line.id}
                line={{
                  id: line.id,
                  quantity: line.quantity,
                  stock: line.variant.stock,
                  unitPrice: linePrice(line),
                  sku: line.variant.sku,
                  variantLabel: variantLabel(line.variant),
                  productName: line.variant.product.name,
                  productSlug: line.variant.product.slug,
                  categoryName: line.variant.product.category.name,
                  imageUrl: line.variant.product.images[0]?.url ?? null,
                  imageAlt: line.variant.product.images[0]?.alt ?? line.variant.product.name,
                }}
              />
            ))}
          </ul>

          <ShippingCalculator weightGrams={summary.weightGrams} subtotal={summary.subtotal} />
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="card flex flex-col gap-5 p-5">
            <h2 className="font-display text-lg font-bold text-brand-950">Resumo do pedido</h2>

            <CouponForm
              applied={coupon ? { code: coupon.code, description: coupon.description } : null}
            />

            <dl className="flex flex-col gap-2.5 border-t border-brand-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="font-medium text-brand-900">{formatBRL(summary.subtotal)}</dd>
              </div>

              {discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Desconto</dt>
                  <dd className="font-medium text-amber-600">−{formatBRL(discount)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-ink-muted">Frete</dt>
                <dd className="font-medium text-ink-muted">calculado no checkout</dd>
              </div>

              <div className="flex items-baseline justify-between border-t border-brand-100 pt-3">
                <dt className="font-display font-bold text-brand-950">Total</dt>
                <dd className="font-display text-2xl font-extrabold text-brand-950">
                  {formatBRL(Math.max(0, summary.subtotal - discount))}
                </dd>
              </div>
            </dl>

            {missingForFreeShipping > 0 ? (
              <p className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
                Faltam <strong>{formatBRL(missingForFreeShipping)}</strong> para o frete sair de
                graça.
              </p>
            ) : (
              <p className="rounded-lg bg-amber-100 px-3 py-2.5 text-sm font-medium text-amber-600">
                Frete padrão grátis nesta compra.
              </p>
            )}

            <Link href="/checkout" className="btn btn-amber w-full">
              Finalizar compra
              <ArrowRight size={17} aria-hidden />
            </Link>

            <Link
              href="/produtos"
              className="text-center text-sm font-medium text-brand-700 underline underline-offset-4"
            >
              Continuar comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
