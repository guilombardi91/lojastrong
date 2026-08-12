import Link from 'next/link'
import { Logo } from '@/components/marca/logo'

export default function NotFound() {
  return (
    <div className="field-deep aurora relative isolate flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-5 text-center text-white">
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />

      <Link href="/" className="relative">
        <Logo tone="light" width={168} />
      </Link>

      <p className="tag relative mt-6 text-amber-300">Erro 404</p>
      <h1 className="relative max-w-lg font-display text-4xl font-extrabold leading-tight">
        Essa página saiu do catálogo
      </h1>
      <p className="relative max-w-md text-brand-100/80">
        O endereço não existe ou o produto foi retirado da vitrine. O catálogo completo continua a
        um clique.
      </p>

      <div className="relative mt-2 flex flex-wrap justify-center gap-3">
        <Link href="/produtos" className="btn btn-amber">
          Ver o catálogo
        </Link>
        <Link href="/" className="btn btn-glass">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
