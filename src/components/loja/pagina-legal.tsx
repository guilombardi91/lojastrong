import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { EMPRESA } from '@/lib/empresa'

export type SecaoLegal = {
  titulo: string
  /** Cada item vira um parágrafo. Aceita JSX para links e destaques. */
  paragrafos: React.ReactNode[]
  /** Lista de tópicos exibida depois dos parágrafos. */
  itens?: React.ReactNode[]
  /** Bloco livre no fim da seção — vai fora dos <p>, então aceita controles. */
  extra?: React.ReactNode
}

/**
 * Molde das páginas de Privacidade e Termos.
 *
 * Segue o mesmo desenho da central de ajuda — trilha, coluna de leitura
 * estreita e barra lateral —, mas com sumário numerado: documento legal é
 * consultado por seção, não lido de cabo a rabo.
 */
export function PaginaLegal({
  eyebrow,
  titulo,
  intro,
  secoes,
  outraPagina,
}: {
  eyebrow: string
  titulo: string
  intro: string
  secoes: SecaoLegal[]
  outraPagina: { href: string; label: string }
}) {
  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Trilha" className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-brand-900">{titulo}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1fr_16rem]">
        <article className="max-w-2xl">
          <p className="tag mb-3 text-amber-600">{eyebrow}</p>
          <h1 className="font-display text-4xl font-extrabold text-brand-950">{titulo}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p>
          <p className="mt-4 text-sm text-ink-muted">
            Última atualização: {EMPRESA.atualizadoEm}
          </p>

          <div className="mt-10 flex flex-col gap-9">
            {secoes.map((secao, index) => (
              <section key={secao.titulo} id={`secao-${index + 1}`} className="scroll-mt-28">
                <h2 className="border-l-2 border-amber-500 pl-4 font-display text-xl font-bold text-brand-950">
                  <span className="mr-2 font-mono text-sm text-amber-600">{index + 1}.</span>
                  {secao.titulo}
                </h2>

                <div className="mt-3 flex flex-col gap-3 pl-4">
                  {secao.paragrafos.map((paragrafo, i) => (
                    <p key={i} className="leading-relaxed text-ink-muted">
                      {paragrafo}
                    </p>
                  ))}

                  {secao.itens && (
                    <ul className="flex list-disc flex-col gap-2 pl-5 leading-relaxed text-ink-muted marker:text-amber-500">
                      {secao.itens.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {secao.extra}
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:h-fit">
          <nav aria-label="Sumário">
            <h2 className="tag mb-3 text-ink-muted">Nesta página</h2>
            <ol className="card divide-y divide-brand-100">
              {secoes.map((secao, index) => (
                <li key={secao.titulo}>
                  <a
                    href={`#secao-${index + 1}`}
                    className="flex gap-2 px-4 py-2.5 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    <span className="font-mono text-xs text-ink-muted">{index + 1}</span>
                    {secao.titulo}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <Link href={outraPagina.href} className="btn btn-outline w-full">
            {outraPagina.label}
          </Link>
        </aside>
      </div>
    </div>
  )
}
