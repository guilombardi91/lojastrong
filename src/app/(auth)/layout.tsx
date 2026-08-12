import Link from 'next/link'
import { Logo } from '@/components/marca/logo'

/**
 * As telas de identificação usam um layout próprio: à esquerda a marca sobre
 * papel pautado, à direita só o formulário. Menos navegação, menos motivo para
 * abandonar o cadastro no meio.
 */
export default function AuthLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="field-deep aurora relative isolate hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />

        <Link href="/" className="relative">
          <Logo tone="light" width={160} />
        </Link>

        <div className="relative max-w-md">
          <p className="tag mb-5 text-amber-300">Loja oficial</p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1]">
            O que você aprende aqui, você <span className="marked">leva</span> para todo lugar.
          </h1>
          <p className="mt-6 text-brand-100/80">
            Canecas, camisas, agasalhos, canetas e cadernos da Strong Business School — feitos com
            o mesmo cuidado que a escola coloca em cada aula.
          </p>
        </div>

        <p className="tag relative text-brand-100/50">
          Strong Business School · MBAs e Pós-graduação em parceria com a FGV
        </p>
      </aside>

      <main className="flex flex-col justify-center bg-paper px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-10 inline-block lg:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
    </div>
  )
}
