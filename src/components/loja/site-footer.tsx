import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { EMPRESA, enderecoCompleto } from '@/lib/empresa'
import { Logo } from '@/components/marca/logo'

const HELP_LINKS = [
  { href: '/ajuda/entregas', label: 'Prazos e entregas' },
  { href: '/ajuda/trocas', label: 'Trocas e devoluções' },
  { href: '/ajuda/pagamentos', label: 'Formas de pagamento' },
  { href: '/ajuda/contato', label: 'Falar com a loja' },
]

const INSTITUTIONAL_LINKS = [
  { href: 'https://strong.com.br', label: 'Site da Strong' },
  { href: 'https://strong.com.br', label: 'Cursos e MBAs FGV' },
  { href: '/ajuda/corporativo', label: 'Compras corporativas' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/privacidade', label: 'Política de Privacidade' },
]

export async function SiteFooter() {
  const categories = await prisma.category.findMany({
    where: { active: true, products: { some: { active: true } } },
    orderBy: { sortOrder: 'asc' },
    select: { name: true, slug: true },
  })

  return (
    <footer className="field-deep relative isolate mt-auto overflow-hidden text-brand-100">
      <div className="grid-lines absolute inset-0 opacity-50" aria-hidden />
      <div className="container-page relative grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/80">
            A loja oficial da Strong Business School. Peças para quem estuda, ensina e representa a
            escola dentro e fora da sala de aula.
          </p>
        </div>

        <nav aria-labelledby="rodape-catalogo">
          <h2 id="rodape-catalogo" className="tag mb-4 text-amber-300">
            Catálogo
          </h2>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link href="/produtos" className="transition-colors hover:text-white">
                Todos os produtos
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/categorias/${category.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="rodape-ajuda">
          <h2 id="rodape-ajuda" className="tag mb-4 text-amber-300">
            Ajuda
          </h2>
          <ul className="space-y-2.5 text-sm">
            {HELP_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="rodape-institucional">
          <h2 id="rodape-institucional" className="tag mb-4 text-amber-300">
            Institucional
          </h2>
          <ul className="space-y-2.5 text-sm">
            {INSTITUTIONAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6">
          {/* CNPJ e endereço aparecem em todas as páginas porque o Decreto
              7.962/2013 exige essa identificação de forma ostensiva em
              qualquer comércio eletrônico — não basta estar nos termos. */}
          <address className="text-xs not-italic leading-relaxed text-brand-100/60">
            {EMPRESA.razaoSocial} · CNPJ {EMPRESA.cnpj}
            <br />
            {enderecoCompleto()}
            <br />
            Atendimento:{' '}
            <a href={`mailto:${EMPRESA.contato.email}`} className="hover:text-white">
              {EMPRESA.contato.email}
            </a>{' '}
            · {EMPRESA.contato.telefone} ({EMPRESA.contato.horario})
          </address>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="tag text-brand-100/60">
              © {new Date().getFullYear()} Strong Business School
            </p>
            <p className="tag text-brand-100/60">Pagamentos processados pelo Mercado Pago</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
