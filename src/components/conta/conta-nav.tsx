'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, Package, ShieldCheck, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/conta', label: 'Meus dados', icon: UserRound },
  { href: '/conta/pedidos', label: 'Meus pedidos', icon: Package },
  { href: '/conta/enderecos', label: 'Endereços', icon: MapPin },
]

export function ContaNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Minha conta" className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active ? 'bg-brand-900 text-white' : 'text-brand-800 hover:bg-brand-50',
            )}
          >
            <item.icon size={17} aria-hidden />
            {item.label}
          </Link>
        )
      })}

      {isAdmin && (
        <Link
          href="/admin"
          className="mt-2 flex items-center gap-2.5 rounded-lg border border-brand-100 px-3 py-2.5 text-sm font-medium text-brand-800 transition-colors hover:border-brand-600"
        >
          <ShieldCheck size={17} aria-hidden />
          Área administrativa
        </Link>
      )}
    </nav>
  )
}
