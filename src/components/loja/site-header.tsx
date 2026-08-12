import Link from 'next/link'
import { Search, ShoppingBag, UserRound } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { readCart, summarizeCart } from '@/lib/cart'
import { formatBRL } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { Logo } from '@/components/marca/logo'
import { MenuMobile } from './menu-mobile'

export async function SiteHeader() {
  const [categories, user, cart] = await Promise.all([
    // Categoria sem produto ativo não entra no menu: levaria o visitante a
    // uma página vazia.
    prisma.category.findMany({
      where: { active: true, products: { some: { active: true } } },
      orderBy: { sortOrder: 'asc' },
      select: { name: true, slug: true },
    }),
    getCurrentUser(),
    readCart(),
  ])

  const { quantity } = summarizeCart(cart)

  const navItems = [
    { href: '/produtos', label: 'Todos os produtos' },
    ...categories.map((c) => ({ href: `/categorias/${c.slug}`, label: c.name })),
  ]

  const accountItems = user
    ? [
        { href: '/conta', label: 'Minha conta' },
        { href: '/conta/pedidos', label: 'Meus pedidos' },
        { href: '/conta/enderecos', label: 'Endereços' },
        ...(user.role === 'ADMIN' ? [{ href: '/admin', label: 'Área administrativa' }] : []),
      ]
    : [
        { href: '/entrar', label: 'Entrar' },
        { href: '/criar-conta', label: 'Criar conta' },
      ]

  return (
    <header className="sticky top-0 z-40">
      <div className="field-brand relative overflow-hidden py-2 text-white">
        <div className="container-page relative flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-center">
          <p className="tag text-brand-100">
            Frete grátis acima de {formatBRL(FREE_SHIPPING_THRESHOLD)}
          </p>
          <p className="tag hidden text-brand-100 sm:block">Entrega para todo o Brasil</p>
          <p className="tag text-amber-300">Pix · Boleto · Cartão em até 12x</p>
        </div>
      </div>

      <div className="border-b border-brand-100 bg-white/88 shadow-[0_1px_0_rgba(3,28,51,0.04)] backdrop-blur-xl">
        <div className="container-page flex h-[4.5rem] items-center gap-4">
          <Link
            href="/"
            aria-label="Loja Strong Business School"
            className="shrink-0 transition-transform duration-300 hover:scale-[1.03]"
          >
            <Logo width={136} />
          </Link>

          <nav className="ml-2 hidden items-center gap-0.5 lg:flex xl:ml-4 xl:gap-1">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <form action="/produtos" className="ml-auto hidden min-w-0 max-w-56 flex-1 md:block xl:max-w-xs">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
                aria-hidden
              />
              <input
                type="search"
                name="q"
                placeholder="Buscar"
                aria-label="Buscar produtos"
                className="field pl-9"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <Link
              href={user ? '/conta' : '/entrar'}
              className="btn btn-ghost btn-sm gap-2"
              aria-label={user ? 'Minha conta' : 'Entrar'}
            >
              <UserRound size={19} />
              <span className="hidden xl:inline">
                {user ? user.name.split(' ')[0] : 'Entrar'}
              </span>
            </Link>

            <Link href="/carrinho" className="btn btn-ghost btn-sm relative gap-2">
              <ShoppingBag size={19} />
              <span className="hidden xl:inline">Carrinho</span>
              {quantity > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gradient-to-br from-amber-500 to-amber-400 px-1 font-mono text-[0.6875rem] font-bold text-brand-950 shadow-[var(--shadow-amber)]"
                  aria-label={`${quantity} itens no carrinho`}
                >
                  {quantity}
                </span>
              )}
            </Link>

            <MenuMobile items={navItems} account={accountItems} />
          </div>
        </div>
      </div>
    </header>
  )
}
