'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Boxes,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  TicketPercent,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { href: '/admin/categorias', label: 'Categorias', icon: Tags },
  { href: '/admin/cupons', label: 'Cupons', icon: TicketPercent },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
]

export function AdminNav({ pendingOrders }: { pendingOrders: number }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Administração" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-white/12 text-white' : 'text-brand-100/75 hover:bg-white/8 hover:text-white',
            )}
          >
            <item.icon size={17} aria-hidden />
            {item.label}
            {item.href === '/admin/pedidos' && pendingOrders > 0 && (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1.5 font-mono text-[0.6875rem] font-bold text-brand-950">
                {pendingOrders}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
