import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { formatBRL } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'

type Article = {
  title: string
  intro: string
  sections: { heading: string; paragraphs: string[] }[]
}

// Conteúdo da central de ajuda. Fica em código porque muda pouco e precisa
// existir desde o primeiro dia da loja; se virar rotina editar, o passo
// seguinte é levar para o banco e dar uma tela ao admin.
const ARTICLES: Record<string, Article> = {
  entregas: {
    title: 'Prazos e entregas',
    intro:
      'Enviamos para todo o Brasil a partir de São Paulo. O prazo aparece calculado pelo seu CEP antes de você finalizar a compra.',
    sections: [
      {
        heading: 'Quando o pedido sai',
        paragraphs: [
          'Pedidos pagos até 14h em dia útil entram na separação no mesmo dia. Os demais entram no dia útil seguinte.',
          'A postagem acontece em até 2 dias úteis após a confirmação do pagamento. Pagamentos por Pix confirmam em minutos; boleto pode levar até 3 dias úteis para compensar.',
        ],
      },
      {
        heading: 'Prazo de entrega',
        paragraphs: [
          'O prazo depende da região: 4 dias úteis no Sudeste, 6 no Sul, 7 no Centro-Oeste, 9 no Nordeste e 12 no Norte, contados a partir da postagem.',
          'A entrega expressa corta o prazo pela metade e aparece como opção no checkout.',
        ],
      },
      {
        heading: 'Frete grátis',
        paragraphs: [
          `Compras a partir de ${formatBRL(FREE_SHIPPING_THRESHOLD)} têm entrega padrão sem custo, para qualquer região do país.`,
          'A modalidade expressa continua sendo cobrada mesmo acima desse valor.',
        ],
      },
      {
        heading: 'Acompanhamento',
        paragraphs: [
          'Assim que o pedido é despachado, o código de rastreio aparece na página do pedido, dentro da sua conta.',
        ],
      },
    ],
  },
  trocas: {
    title: 'Trocas e devoluções',
    intro:
      'Errou o tamanho? A primeira troca é por nossa conta. Peça a troca em até 30 dias do recebimento.',
    sections: [
      {
        heading: 'Troca de tamanho',
        paragraphs: [
          'A primeira troca de tamanho de cada pedido não tem custo de frete. Peças precisam estar sem uso, com a etiqueta e na embalagem original.',
          'Para pedir, responda o e-mail de confirmação do pedido informando o número e o tamanho desejado.',
        ],
      },
      {
        heading: 'Desistência da compra',
        paragraphs: [
          'O Código de Defesa do Consumidor garante 7 dias corridos, contados do recebimento, para desistir de uma compra feita pela internet.',
          'Nesse caso devolvemos o valor integral, incluindo o frete pago, pelo mesmo meio de pagamento usado na compra.',
        ],
      },
      {
        heading: 'Produto com defeito',
        paragraphs: [
          'Peças com defeito de fabricação são trocadas em até 90 dias, sem custo. Se não tivermos a peça em estoque, você escolhe entre outro produto de valor equivalente ou o reembolso.',
        ],
      },
    ],
  },
  pagamentos: {
    title: 'Formas de pagamento',
    intro:
      'A loja aceita Pix, boleto bancário e cartão de crédito. O pagamento é processado pelo Mercado Pago — nenhum dado de cartão passa pelos nossos servidores.',
    sections: [
      {
        heading: 'Pix',
        paragraphs: [
          'Aprovação em segundos. O código copia-e-cola fica disponível na página do pedido logo após a finalização.',
        ],
      },
      {
        heading: 'Cartão de crédito',
        paragraphs: [
          'Parcelamos em até 12 vezes sem juros, respeitando o valor mínimo de R$ 20 por parcela.',
          'A cobrança aparece na fatura como STRONG SCHOOL.',
        ],
      },
      {
        heading: 'Boleto bancário',
        paragraphs: [
          'O boleto vence em 3 dias úteis e a compensação leva até 3 dias úteis após o pagamento. As peças ficam reservadas nesse período.',
        ],
      },
      {
        heading: 'Nota fiscal',
        paragraphs: [
          'A nota fiscal é emitida com o CPF cadastrado na sua conta e enviada por e-mail junto com o aviso de postagem. Para nota em nome de empresa, use o canal de compras corporativas.',
        ],
      },
    ],
  },
  contato: {
    title: 'Falar com a loja',
    intro: 'A equipe da loja responde em dias úteis, das 9h às 18h.',
    sections: [
      {
        heading: 'Canais',
        paragraphs: [
          'E-mail: loja@strong.com.br — respondemos em até 1 dia útil.',
          'Telefone e WhatsApp: (11) 3000-0000.',
          'Presencial: a retirada de pedidos pode ser combinada na secretaria da unidade, mediante confirmação por e-mail.',
        ],
      },
      {
        heading: 'Ao escrever, tenha em mãos',
        paragraphs: [
          'O número do pedido (formato SBS-0000-000000) resolve a maioria das dúvidas na primeira resposta.',
        ],
      },
    ],
  },
  corporativo: {
    title: 'Compras corporativas',
    intro:
      'Atendemos pedidos em volume para abertura de turma, formatura, congresso, onboarding e programas corporativos.',
    sections: [
      {
        heading: 'Como funciona',
        paragraphs: [
          'Pedidos acima de 30 unidades saem por orçamento, com condição comercial própria e prazo de produção combinado.',
          'Escreva para loja@strong.com.br com a quantidade, os produtos, a data de entrega e se há personalização por turma.',
        ],
      },
      {
        heading: 'Personalização',
        paragraphs: [
          'Podemos aplicar o nome da turma, do curso ou do evento nas peças, mantendo a identidade visual da escola.',
          'Personalização exige um prazo adicional de 10 dias úteis sobre o prazo normal de produção.',
        ],
      },
      {
        heading: 'Faturamento',
        paragraphs: [
          'Emitimos nota fiscal em nome da empresa e trabalhamos com faturamento a prazo para instituições com cadastro aprovado.',
        ],
      },
    ],
  },
}

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/ajuda/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) return { title: 'Página não encontrada' }

  return { title: article.title, description: article.intro }
}

export default async function AjudaPage({ params }: PageProps<'/ajuda/[slug]'>) {
  const { slug } = await params
  const article = ARTICLES[slug]
  if (!article) notFound()

  const others = Object.entries(ARTICLES).filter(([key]) => key !== slug)

  return (
    <div className="container-page py-10 lg:py-14">
      <nav aria-label="Trilha" className="mb-6 flex items-center gap-1.5 text-sm text-ink-muted">
        <Link href="/" className="hover:text-brand-700">
          Início
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-brand-900">{article.title}</span>
      </nav>

      <div className="grid gap-12 lg:grid-cols-[1fr_16rem]">
        <article className="max-w-2xl">
          <p className="tag mb-3 text-amber-600">Central de ajuda</p>
          <h1 className="font-display text-4xl font-extrabold text-brand-950">{article.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{article.intro}</p>

          <div className="mt-10 flex flex-col gap-9">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="border-l-2 border-amber-500 pl-4 font-display text-xl font-bold text-brand-950">
                  {section.heading}
                </h2>
                <div className="mt-3 flex flex-col gap-3 pl-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="leading-relaxed text-ink-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <h2 className="tag mb-3 text-ink-muted">Outros assuntos</h2>
          <ul className="card divide-y divide-brand-100">
            {others.map(([key, other]) => (
              <li key={key}>
                <Link
                  href={`/ajuda/${key}`}
                  className="block px-4 py-3 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50"
                >
                  {other.title}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
