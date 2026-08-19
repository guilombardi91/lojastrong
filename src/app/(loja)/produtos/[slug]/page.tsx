import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, PackageCheck, RotateCcw, ShieldCheck } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { PRODUCT_CARD_SELECT } from '@/lib/catalog'
import { ProductDetail } from '@/components/loja/product-detail'
import { TrackProductView } from '@/components/loja/track-view'
import { ShippingCalculator } from '@/components/loja/shipping-calculator'
import { ProductCard } from '@/components/loja/product-card'

async function getProduct(slug: string) {
  return prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: 'asc' } },
      // Ordenado por SKU porque o id é um cuid, que não é cronológico: sem um
      // critério explícito a grade sairia em ordem imprevisível a cada
      // consulta. O SKU agrupa por cor e o painel reordena os tamanhos.
      variants: { where: { active: true }, orderBy: { sku: 'asc' } },
    },
  })
}

export async function generateMetadata({ params }: PageProps<'/produtos/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Produto não encontrado' }

  return {
    title: product.name,
    description: product.tagline ?? product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.tagline ?? undefined,
      images: product.images[0] ? [product.images[0].url] : undefined,
    },
  }
}

export async function generateStaticParams() {
  // O `next build` executa isto antes de haver um Postgres alcançável (ver
  // Dockerfile). Sem banco a lista sai vazia e as rotas passam a ser geradas
  // sob demanda — que é o que já acontece de qualquer forma, porque o
  // SiteHeader lê cookies e torna dinâmica toda a árvore da loja.
  try {
    const products = await prisma.product.findMany({ where: { active: true }, select: { slug: true } })
    return products.map((product) => ({ slug: product.slug }))
  } catch {
    console.warn('[build] banco indisponível ao listar produtos; rotas serão geradas sob demanda')
    return []
  }
}

const POLICIES = [
  { icon: PackageCheck, title: 'Envio em até 2 dias úteis', text: 'Separação e postagem a partir de São Paulo.' },
  { icon: RotateCcw, title: 'Primeira troca sem custo', text: 'Trocamos o tamanho em até 30 dias.' },
  { icon: ShieldCheck, title: 'Produção oficial', text: 'Peça licenciada pela escola.' },
]

export default async function ProdutoPage({ params }: PageProps<'/produtos/[slug]'>) {
  const { slug } = await params
  const [product, user] = await Promise.all([getProduct(slug), getCurrentUser()])
  if (!product) notFound()

  const related = await prisma.product.findMany({
    where: { active: true, categoryId: product.categoryId, id: { not: product.id } },
    select: PRODUCT_CARD_SELECT,
    take: 4,
  })

  return (
    <div className="container-page py-8 lg:py-12">
      <TrackProductView productId={product.id} />

      <nav aria-label="Trilha" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href={`/categorias/${product.category.slug}`} className="hover:text-brand-700">
          {product.category.name}
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-brand-900">{product.name}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1.55fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-12">
          <header>
            <p className="tag mb-3 text-amber-600">{product.category.name}</p>
            <h1 className="font-display text-4xl font-extrabold leading-tight text-brand-950">
              {product.name}
            </h1>
            {product.tagline && (
              <p className="mt-3 max-w-2xl text-lg text-ink-muted">{product.tagline}</p>
            )}
          </header>

          <ProductDetail
            images={product.images.map((image) => ({ url: image.url, alt: image.alt }))}
            basePrice={product.basePrice}
            compareAt={product.compareAt}
            userEmail={user?.email}
            variants={product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              price: variant.price,
              stock: variant.stock,
              lowStock: variant.lowStock,
            }))}
          />

          <section className="border-t border-brand-100 pt-10">
            <h2 className="font-display text-xl font-bold text-brand-950">Sobre a peça</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">{product.description}</p>

            <dl className="mt-8 grid max-w-xl grid-cols-1 gap-x-8 sm:grid-cols-2">
              {[
                ['Linha', product.category.name],
                ['Peso aproximado', `${product.weightGrams} g`],
                ['Variações', `${product.variants.length}`],
                ['Referência', product.variants[0]?.sku.split('-').slice(0, 3).join('-') ?? '—'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 border-b border-brand-100 py-3"
                >
                  <dt className="tag text-ink-muted">{label}</dt>
                  <dd className="font-mono text-xs font-semibold text-brand-900">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-28 lg:h-fit">
          <ShippingCalculator weightGrams={product.weightGrams} subtotal={product.basePrice} />

          <ul className="card divide-y divide-brand-100">
            {POLICIES.map((policy) => (
              <li key={policy.title} className="flex gap-3 p-4">
                <policy.icon size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-brand-900">{policy.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{policy.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-brand-100 pt-12">
          <h2 className="mb-8 font-display text-2xl font-extrabold text-brand-950">
            Da mesma linha
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
