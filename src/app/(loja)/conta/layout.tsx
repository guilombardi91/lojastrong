import { LogOut } from 'lucide-react'
import { requireUser } from '@/lib/auth'
import { signOutAction } from '@/app/actions/auth'
import { ContaNav } from '@/components/conta/conta-nav'

export default async function ContaLayout({ children }: LayoutProps<'/conta'>) {
  const user = await requireUser()

  return (
    <div className="container-page py-10 lg:py-14">
      <header className="mb-8">
        <p className="tag mb-3 text-amber-600">Minha conta</p>
        <h1 className="font-display text-4xl font-extrabold text-brand-950">
          Olá, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 text-ink-muted">{user.email}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:h-fit">
          <ContaNav isAdmin={user.role === 'ADMIN'} />

          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-danger-bg hover:text-danger"
            >
              <LogOut size={17} aria-hidden />
              Sair da conta
            </button>
          </form>
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
