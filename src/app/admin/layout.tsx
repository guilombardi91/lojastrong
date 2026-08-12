import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { signOutAction } from '@/app/actions/auth'
import { Logo } from '@/components/marca/logo'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const admin = await requireAdmin()
  const pendingOrders = await prisma.order.count({
    where: { status: { in: ['PENDING', 'PAID', 'PACKING'] } },
  })

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="field-deep relative flex flex-col gap-6 p-5 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between gap-3">
          <Link href="/admin">
            <Logo tone="light" width={116} />
          </Link>
          <span className="tag rounded-full bg-white/10 px-2 py-1 text-amber-300">Admin</span>
        </div>

        <AdminNav pendingOrders={pendingOrders} />

        <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
          <p className="tag px-3 text-brand-100/50">{admin.name}</p>

          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100/75 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ExternalLink size={17} aria-hidden />
            Ver a loja
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100/75 transition-colors hover:bg-white/8 hover:text-white"
            >
              <LogOut size={17} aria-hidden />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 bg-paper px-5 py-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  )
}
