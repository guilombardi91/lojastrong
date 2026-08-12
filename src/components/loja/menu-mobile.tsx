'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

type Item = { href: string; label: string }

export function MenuMobile({ items, account }: { items: Item[]; account: Item[] }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-ghost btn-sm px-2 lg:hidden"
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand-950/45"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />
          <nav className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col gap-1 overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="tag text-ink-muted">Navegar</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-ghost btn-sm px-2"
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Fechar no clique: navegar sem isso deixaria o painel aberto
                sobre a página nova. */}
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 font-display text-lg font-semibold text-brand-950 hover:bg-brand-50"
              >
                {item.label}
              </Link>
            ))}

            <hr className="my-3 border-brand-100" />

            {account.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-50"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
