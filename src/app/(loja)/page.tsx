import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { formatBRL } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { PRODUCT_CARD_SELECT } from '@/lib/catalog'
import { ProductCard } from '@/components/loja/product-card'
import { Reveal } from '@/components/ui/reveal'

const GUARANTEES = [
  {
    icon: Truck,
    title: `Frete grátis acima de ${formatBRL(FREE_SHIPPING_THRESHOLD)}`,
    text: 'Entrega para todo o Brasil, com prazo calculado pelo seu CEP.',
  },
  {
    icon: ShieldCheck,
    title: 'Pagamento protegido',
    text: 'Pix, boleto ou cartão em até 12x sem juros, processado pelo Mercado Pago.',
  },
  {
    icon: PackageCheck,
    title: 'Troca em 30 dias',
    text: 'Não serviu? Trocamos o tamanho sem custo de frete na primeira troca.',
  },
  {
    icon: BadgeCheck,
    title: 'Produção oficial',
    text: 'Peças licenciadas pela escola, com controle de qualidade em cada lote.',
  },
]

export default async function HomePage() {
  const [hero, featured, categories, latest] = await Promise.all([
    prisma.product.findFirst({
      where: { active: true, slug: 'moletom-strong-campus' },
      select: PRODUCT_CARD_SELECT,
    }),
    prisma.product.findMany({
      where: { active: true, featured: true },
      select: PRODUCT_CARD_SELECT,
      take: 8,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { active: true, products: { some: { active: true } } },
      orderBy: { sortOrder: 'asc' },
      select: {
        name: true,
        slug: true,
        description: true,
        emblem: true,
        _count: { select: { products: { where: { active: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: PRODUCT_CARD_SELECT,
      take: 4,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const heroImage = hero?.images[0]
  const heroStock = hero?.variants.reduce((sum, v) => sum + v.stock, 0) ?? 0

  return (
    <>
      {/* ------------------------------------------------------------ herói */}
      <section className="field-deep aurora relative isolate overflow-hidden text-white">
        <div className="grid-lines absolute inset-0 opacity-70" aria-hidden />

        <div className="container-page relative grid items-center gap-14 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-28">
          <div className="stagger">
            <p
              className="tag glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-amber-300"
              style={{ '--i': 0 } as React.CSSProperties}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
              Loja oficial · Strong Business School
            </p>

            <h1
              className="mt-7 font-display text-[clamp(2.4rem,5.2vw,4rem)] font-extrabold leading-[1.02]"
              style={{ '--i': 1 } as React.CSSProperties}
            >
              O que você aprende aqui, você <span className="marked">leva</span> para todo lugar.
            </h1>

            <p
              className="mt-7 max-w-lg text-lg leading-relaxed text-brand-100/85"
              style={{ '--i': 2 } as React.CSSProperties}
            >
              Canecas, camisas, agasalhos, canetas e cadernos com a assinatura da escola. Feitos
              para durar o curso inteiro — e o que vem depois dele.
            </p>

            <div className="mt-9 flex flex-wrap gap-3" style={{ '--i': 3 } as React.CSSProperties}>
              <Link href="/produtos" className="btn btn-amber">
                Ver o catálogo
                <ArrowRight size={17} aria-hidden />
              </Link>
              <Link href="/categorias/cadernos" className="btn btn-glass">
                Kit de primeiro dia
              </Link>
            </div>

            <dl
              className="mt-12 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/12 pt-7"
              style={{ '--i': 4 } as React.CSSProperties}
            >
              {[
                ['Peças no catálogo', String(categories.reduce((s, c) => s + c._count.products, 0))],
                ['Linhas', String(categories.length)],
                ['Entrega', 'Brasil inteiro'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="tag text-brand-100/55">{label}</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* A peça em destaque, suspensa e com a ficha técnica flutuando ao
              lado — o mesmo gesto de segurar o produto para olhar de perto. */}
          {hero && heroImage && (
            <div className="stage relative mx-auto w-full max-w-md lg:max-w-none">
              <Link href={`/produtos/${hero.slug}`} className="group block">
                <div
                  className="halo floating relative aspect-square"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Dois focos de luz: um âmbar quente atrás da peça e um
                      halo frio mais largo, para a silhueta escura não se
                      dissolver no azul do campo. */}
                  <div
                    className="absolute inset-x-10 inset-y-16 rounded-full bg-brand-500/25 blur-[64px]"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-x-24 bottom-20 top-24 rounded-full bg-amber-500/30 blur-[52px]"
                    aria-hidden
                  />
                  <Image
                    src={heroImage.url}
                    alt={heroImage.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 88vw, 32rem"
                    className="relative object-contain drop-shadow-[0_36px_48px_rgba(3,28,51,0.55)] transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="glass-solid mx-auto -mt-4 max-w-sm rounded-2xl p-5 sm:absolute sm:bottom-2 sm:right-[-1.5rem] sm:mx-0 sm:mt-0 sm:max-w-[17rem]">
                  <p className="tag text-amber-300">Peça da temporada</p>
                  <h2 className="mt-1.5 font-display text-lg font-bold leading-tight text-white">
                    {hero.name}
                  </h2>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-3 text-center">
                    <div>
                      <dt className="tag text-brand-100/60">Grade</dt>
                      <dd className="mt-1 font-mono text-xs font-semibold text-white">P–XG</dd>
                    </div>
                    <div>
                      <dt className="tag text-brand-100/60">Estoque</dt>
                      <dd className="mt-1 font-mono text-xs font-semibold text-amber-300">
                        {heroStock}
                      </dd>
                    </div>
                    <div>
                      <dt className="tag text-brand-100/60">Preço</dt>
                      <dd className="mt-1 font-mono text-xs font-semibold text-white">
                        {formatBRL(hero.basePrice)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Transição para o papel, sem corte seco. */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-paper"
          aria-hidden
        />
      </section>

      {/* ------------------------------------------------------- garantias */}
      <section className="border-b border-brand-100 bg-white">
        <div className="container-page grid gap-x-8 gap-y-6 py-9 sm:grid-cols-2 lg:grid-cols-4">
          {GUARANTEES.map((item, index) => (
            <Reveal key={item.title} delay={index * 70} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                <item.icon size={18} aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-brand-950">{item.title}</h3>
                <p className="mt-1 text-sm leading-snug text-ink-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ categorias */}
      <section className="container-page py-20">
        <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tag mb-2 text-amber-700">Navegue por linha</p>
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">
              Tudo que a escola veste, escreve e carrega
            </h2>
          </div>
          <Link
            href="/produtos"
            className="text-sm font-semibold text-brand-700 underline underline-offset-4"
          >
            Ver todos os produtos
          </Link>
        </Reveal>

        <div className="stage grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.slug} delay={index * 60}>
              <Link
                href={`/categorias/${category.slug}`}
                className="tilt card group flex h-full items-start gap-4 p-5"
              >
                <span
                  aria-hidden
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 text-xl text-white shadow-[var(--shadow-lift)]"
                >
                  {category.emblem}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-brand-950">{category.name}</h3>
                  <p className="mt-1 text-sm leading-snug text-ink-muted">{category.description}</p>
                  <p className="tag mt-3 text-brand-600">
                    {category._count.products}{' '}
                    {category._count.products === 1 ? 'produto' : 'produtos'}
                  </p>
                </div>
                <ArrowRight
                  size={18}
                  className="ml-auto mt-1 shrink-0 text-brand-100 transition-all group-hover:translate-x-1 group-hover:text-amber-500"
                  aria-hidden
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------- destaques */}
      <section className="border-y border-brand-100 bg-white py-20">
        <div className="container-page">
          <Reveal className="mb-9">
            <p className="tag mb-2 text-amber-700">Seleção da coordenação</p>
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">
              As peças mais pedidas
            </h2>
          </Reveal>

          <div className="stage grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product, index) => (
              <Reveal key={product.slug} delay={index * 55}>
                <ProductCard product={product} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- novidades */}
      <section className="container-page py-20">
        <Reveal className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tag mb-2 text-amber-700">Chegou agora</p>
            <h2 className="font-display text-3xl font-extrabold text-brand-950 sm:text-4xl">
              Últimas adições ao catálogo
            </h2>
          </div>
          <Link
            href="/produtos?ordenar=recentes"
            className="text-sm font-semibold text-brand-700 underline underline-offset-4"
          >
            Ver novidades
          </Link>
        </Reveal>

        <div className="stage grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((product, index) => (
            <Reveal key={product.slug} delay={index * 55}>
              <ProductCard product={product} className="h-full" />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ corporativo */}
      <section className="container-page pb-20">
        <Reveal>
          <div className="field-brand aurora relative isolate overflow-hidden rounded-[var(--radius-card)] text-white">
            <div className="grid-lines absolute inset-0 opacity-60" aria-hidden />
            <div className="relative grid gap-7 p-9 sm:p-14 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="tag mb-3 text-amber-300">Turmas, eventos e RH</p>
                <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
                  Precisa de cem canecas até sexta?
                </h2>
                <p className="mt-4 max-w-xl text-brand-100/85">
                  Atendemos pedidos em volume para abertura de turma, formatura, congresso e
                  programas corporativos — com personalização por turma e nota fiscal em nome da
                  empresa.
                </p>
              </div>
              <Link
                href="/ajuda/corporativo"
                className="btn btn-amber justify-self-start lg:justify-self-end"
              >
                Falar com a loja
                <ArrowRight size={17} aria-hidden />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  )
}
