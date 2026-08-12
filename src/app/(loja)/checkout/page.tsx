import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/auth'
import { linePrice, readCart, summarizeCart, variantLabel } from '@/lib/cart'
import { currentCoupon } from '@/lib/coupon'
import { formatBRL } from '@/lib/money'
import { quoteShipping } from '@/lib/shipping'
import { CheckoutForm } from '@/components/loja/checkout-form'

export const metadata: Metadata = { title: 'Finalizar compra' }

export default async function CheckoutPage() {
  const user = await requireUser()
  const cart = await readCart()
  const summary = summarizeCart(cart)

  if (!cart || summary.isEmpty) redirect('/carrinho')

  const [addresses, coupon] = await Promise.all([
    prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    }),
    currentCoupon(summary.subtotal),
  ])

  // Cotação inicial feita no servidor: a tela abre já mostrando frete e prazo
  // de quem tem endereço salvo, sem esperar o JavaScript.
  const preferred = addresses.find((address) => address.isDefault) ?? addresses[0]

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Etapa final</p>
        <h1 className="font-display text-4xl font-extrabold text-brand-950">Finalizar compra</h1>
        <p className="mt-2 text-ink-muted">
          Confira os itens, escolha a entrega e o meio de pagamento.
        </p>
      </header>

      <section className="card mb-8 p-5">
        <h2 className="mb-4 font-display text-lg font-bold text-brand-950">
          {summary.quantity} {summary.quantity === 1 ? 'item' : 'itens'} nesta compra
        </h2>
        <ul className="flex flex-wrap gap-4">
          {cart.items.map((line) => (
            <li key={line.id} className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-brand-100 bg-paper">
                {line.variant.product.images[0] && (
                  <Image
                    src={line.variant.product.images[0].url}
                    alt={line.variant.product.images[0].alt}
                    fill
                    sizes="3.5rem"
                    className="object-contain p-1"
                  />
                )}
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-900 px-1 font-mono text-[0.625rem] font-bold text-white">
                  {line.quantity}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-brand-900">{line.variant.product.name}</p>
                <p className="text-ink-muted">
                  {variantLabel(line.variant)} · {formatBRL(linePrice(line) * line.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <Link
          href="/carrinho"
          className="mt-4 inline-block text-sm font-medium text-brand-700 underline underline-offset-4"
        >
          Editar carrinho
        </Link>
      </section>

      <CheckoutForm
        initialOptions={
          preferred
            ? quoteShipping(preferred.state, summary.weightGrams, summary.subtotal)
            : []
        }
        addresses={addresses.map((address) => ({
          id: address.id,
          label: address.label,
          recipient: address.recipient,
          zip: address.zip,
          street: address.street,
          number: address.number,
          complement: address.complement,
          district: address.district,
          city: address.city,
          state: address.state,
          isDefault: address.isDefault,
        }))}
        subtotal={summary.subtotal}
        discount={coupon?.discount ?? 0}
        freeShipping={coupon?.freeShipping ?? false}
        weightGrams={summary.weightGrams}
        defaultRecipient={user.name}
      />
    </div>
  )
}
