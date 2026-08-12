import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

// Popula a loja com o catálogo inicial, dois usuários e os cupons de abertura.
// Rodar de novo é seguro: tudo é upsert por chave natural (slug, sku, e-mail).
//
//   npx prisma db seed        (ou: npm run db:seed)

type SeedVariant = {
  sku: string
  size?: string
  color?: string
  colorHex?: string
  price?: number
  stock: number
}

type SeedProduct = {
  name: string
  slug: string
  tagline: string
  description: string
  basePrice: number
  compareAt?: number
  weightGrams: number
  featured?: boolean
  images: string[]
  variants: SeedVariant[]
}

type SeedCategory = {
  name: string
  slug: string
  description: string
  emblem: string
  products: SeedProduct[]
}

const AZUL = '#074784'
const AMBAR = '#fab644'
const BRANCA = '#f4f7fa'
const GRAFITE = '#39424d'
const ACO = '#b9c3ce'

const CLOTHING_SIZES = ['P', 'M', 'G', 'GG', 'XG']

/** Gera a grade tamanho × cor de uma peça de vestuário. */
function apparelGrid(
  prefix: string,
  colors: Array<{ name: string; hex: string; code: string; stock: number[] }>,
): SeedVariant[] {
  return colors.flatMap((color) =>
    CLOTHING_SIZES.map((size, index) => ({
      sku: `${prefix}-${color.code}-${size}`,
      size,
      color: color.name,
      colorHex: color.hex,
      stock: color.stock[index] ?? 0,
    })),
  )
}

const CATALOG: SeedCategory[] = [
  {
    name: 'Canecas e garrafas',
    slug: 'canecas-e-garrafas',
    description:
      'Para o café entre uma aula e outra e para a água que atravessa o dia inteiro de estudo.',
    emblem: '☕',
    products: [
      {
        name: 'Caneca Strong Essential 350ml',
        slug: 'caneca-strong-essential-350ml',
        tagline: 'Cerâmica esmaltada com o monograma da escola em alto-relevo.',
        description:
          'A caneca que virou padrão nas salas de aula da Strong. Cerâmica de alta densidade com esmalte fosco por fora e vitrificado por dentro, capacidade de 350 ml e monograma aplicado em alto-relevo. Vai ao micro-ondas e à lava-louças sem perder a cor.',
        basePrice: 6990,
        weightGrams: 480,
        featured: true,
        images: ['caneca-azul', 'caneca-branca', 'caneca-ambar'],
        variants: [
          { sku: 'SBS-CAN-ESS-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 64 },
          { sku: 'SBS-CAN-ESS-BRA', color: 'Branca', colorHex: BRANCA, stock: 48 },
          { sku: 'SBS-CAN-ESS-AMB', color: 'Âmbar', colorHex: AMBAR, stock: 31 },
        ],
      },
      {
        name: 'Garrafa Térmica Strong 500ml',
        slug: 'garrafa-termica-strong-500ml',
        tagline: 'Aço inox parede dupla: 12 horas gelada, 6 horas quente.',
        description:
          'Garrafa em aço inox 304 com isolamento a vácuo de parede dupla. Mantém bebidas geladas por até 12 horas e quentes por até 6. Tampa rosqueável com vedação de silicone e acabamento externo antiderrapante. 500 ml.',
        basePrice: 14990,
        compareAt: 17990,
        weightGrams: 620,
        featured: true,
        images: ['garrafa-azul', 'garrafa-aco'],
        variants: [
          { sku: 'SBS-GAR-500-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 42 },
          { sku: 'SBS-GAR-500-ACO', color: 'Aço escovado', colorHex: ACO, stock: 27 },
        ],
      },
      {
        name: 'Caneca Executive 300ml',
        slug: 'caneca-executive-300ml',
        tagline: 'Formato compacto, para a mesa de quem alterna reunião e aula.',
        description:
          'Versão compacta da linha, pensada para a mesa de trabalho: 300 ml, base larga que não tomba e alça reforçada. Acabamento em esmalte fosco com monograma discreto.',
        basePrice: 5990,
        weightGrams: 420,
        images: ['caneca-ambar', 'caneca-azul'],
        variants: [
          { sku: 'SBS-CAN-EXE-AMB', color: 'Âmbar', colorHex: AMBAR, stock: 23 },
          { sku: 'SBS-CAN-EXE-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 4 },
        ],
      },
    ],
  },
  {
    name: 'Camisas',
    slug: 'camisas',
    description: 'Algodão de gramatura alta, modelagem que serve para aula, corrida e fim de semana.',
    emblem: '👕',
    products: [
      {
        name: 'Camiseta Strong Classic',
        slug: 'camiseta-strong-classic',
        tagline: 'Algodão penteado 180g com estampa em silk de alta durabilidade.',
        description:
          'A camiseta base da linha Strong. Malha de algodão penteado 30.1 com gramatura 180g, gola careca com ribana reforçada e costura dupla na barra. Estampa em silk-screen à base de água, que não craqueia na lavagem. Modelagem reta unissex.',
        basePrice: 8990,
        weightGrams: 220,
        featured: true,
        images: ['camiseta-azul', 'camiseta-branca', 'camiseta-grafite'],
        variants: apparelGrid('SBS-CAM-CLA', [
          { name: 'Azul Strong', hex: AZUL, code: 'AZU', stock: [18, 34, 40, 22, 9] },
          { name: 'Branca', hex: BRANCA, code: 'BRA', stock: [14, 28, 31, 17, 6] },
          { name: 'Grafite', hex: GRAFITE, code: 'GRA', stock: [11, 23, 26, 14, 5] },
        ]),
      },
      {
        name: 'Camiseta Strong Âmbar',
        slug: 'camiseta-strong-ambar',
        tagline: 'Edição em âmbar, a cor de assinatura da escola.',
        description:
          'Mesma malha da linha Classic em tingimento reativo âmbar, a cor que fecha a assinatura da Strong ao lado do azul. Estampa em silk azul no peito. Edição limitada de temporada.',
        basePrice: 9490,
        weightGrams: 220,
        images: ['camiseta-ambar'],
        variants: apparelGrid('SBS-CAM-AMB', [
          { name: 'Âmbar', hex: AMBAR, code: 'AMB', stock: [12, 25, 28, 15, 4] },
        ]),
      },
      {
        name: 'Camiseta Premium Pima',
        slug: 'camiseta-premium-pima',
        tagline: 'Algodão pima peruano, toque de seda e caimento estruturado.',
        description:
          'Confeccionada em algodão pima peruano de fibra extralonga, com toque sedoso e resistência superior ao pilling. Gola com elastano para não deformar e etiqueta impressa, sem costura interna. Monograma bordado em vez de estampado.',
        basePrice: 15990,
        compareAt: 18990,
        weightGrams: 240,
        images: ['camiseta-branca', 'camiseta-azul'],
        variants: apparelGrid('SBS-CAM-PIM', [
          { name: 'Branca', hex: BRANCA, code: 'BRA', stock: [8, 16, 19, 11, 3] },
          { name: 'Azul Strong', hex: AZUL, code: 'AZU', stock: [7, 14, 17, 9, 2] },
        ]),
      },
    ],
  },
  {
    name: 'Agasalhos',
    slug: 'agasalhos',
    description: 'Moletons de inverno para o campus, o coworking e o intervalo entre disciplinas.',
    emblem: '🧥',
    products: [
      {
        name: 'Moletom Strong Campus',
        slug: 'moletom-strong-campus',
        tagline: 'Moletom flanelado 320g com capuz forrado e bolso canguru.',
        description:
          'Moletom de inverno em malha flanelada 320g, com capuz duplo forrado, cordão redondo em algodão, bolso canguru e punhos e barra em ribana com elastano. Costura reforçada nos ombros. Modelagem unissex levemente ampla.',
        basePrice: 24990,
        weightGrams: 780,
        featured: true,
        images: ['moletom-azul', 'moletom-grafite'],
        variants: apparelGrid('SBS-MOL-CAM', [
          { name: 'Azul Strong', hex: AZUL, code: 'AZU', stock: [9, 21, 24, 13, 5] },
          { name: 'Grafite', hex: GRAFITE, code: 'GRA', stock: [7, 17, 20, 11, 4] },
        ]),
      },
      {
        name: 'Moletom Strong Âmbar',
        slug: 'moletom-strong-ambar',
        tagline: 'A cor da escola em peça de inverno. Produção limitada.',
        description:
          'Mesma construção do Campus em âmbar, com cordão e detalhes em off-white. Produção limitada a cada temporada — quando esgota, só volta no ano seguinte.',
        basePrice: 25990,
        weightGrams: 780,
        images: ['moletom-ambar'],
        variants: apparelGrid('SBS-MOL-AMB', [
          { name: 'Âmbar', hex: AMBAR, code: 'AMB', stock: [4, 9, 11, 6, 2] },
        ]),
      },
    ],
  },
  {
    name: 'Canetas',
    slug: 'canetas',
    description: 'Escrita firme para prova, anotação de aula e assinatura de contrato.',
    emblem: '🖊',
    products: [
      {
        name: 'Caneta Strong Metal',
        slug: 'caneta-strong-metal',
        tagline: 'Corpo em alumínio anodizado com gravação a laser.',
        description:
          'Esferográfica de corpo em alumínio anodizado, peso equilibrado e acionamento por rotação. Nome da escola gravado a laser, sem tinta que descasca. Carga azul 1.0 mm substituível, padrão Parker.',
        basePrice: 3990,
        weightGrams: 60,
        images: ['caneta-azul', 'caneta-ambar'],
        variants: [
          { sku: 'SBS-CNT-MET-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 120 },
          { sku: 'SBS-CNT-MET-AMB', color: 'Âmbar', colorHex: AMBAR, stock: 76 },
        ],
      },
      {
        name: 'Kit Caneta e Caderno Strong',
        slug: 'kit-caneta-e-caderno-strong',
        tagline: 'A dupla de primeiro dia de aula, com desconto de conjunto.',
        description:
          'Reúne a Caneta Strong Metal e o Caderno Pautado A5 numa caixa de presente com berço interno. É o kit que a escola entrega nas aberturas de turma — e agora também na loja.',
        basePrice: 8990,
        compareAt: 9980,
        weightGrams: 620,
        featured: true,
        images: ['caneta-azul', 'caderno-azul'],
        variants: [
          { sku: 'SBS-KIT-CCA-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 38 },
          { sku: 'SBS-KIT-CCA-AMB', color: 'Âmbar', colorHex: AMBAR, stock: 19 },
        ],
      },
    ],
  },
  {
    name: 'Cadernos',
    slug: 'cadernos',
    description: 'Papel de gramatura alta que aguenta caneta-tinteiro sem transpassar.',
    emblem: '📓',
    products: [
      {
        name: 'Caderno Pautado Strong A5',
        slug: 'caderno-pautado-strong-a5',
        tagline: '192 páginas em papel 90g, capa dura e elástico de fechamento.',
        description:
          'Caderno A5 com 192 páginas pautadas em papel offset 90g — gramatura suficiente para caneta-tinteiro não transpassar. Capa dura revestida, costura aparente que permite abrir o caderno a 180°, marcador de fita e elástico de fechamento. Fecha com bolso sanfonado na contracapa.',
        basePrice: 5990,
        weightGrams: 380,
        featured: true,
        images: ['caderno-azul', 'caderno-ambar', 'caderno-grafite'],
        variants: [
          { sku: 'SBS-CAD-A5-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 55 },
          { sku: 'SBS-CAD-A5-AMB', color: 'Âmbar', colorHex: AMBAR, stock: 41 },
          { sku: 'SBS-CAD-A5-GRA', color: 'Grafite', colorHex: GRAFITE, stock: 22 },
        ],
      },
      {
        name: 'Planner Acadêmico Strong',
        slug: 'planner-academico-strong',
        tagline: 'Doze meses de planejamento, com grade de disciplinas e entregas.',
        description:
          'Planner de doze meses desenhado para a rotina de quem estuda e trabalha: visão anual, planejamento mensal, semana em duas páginas e uma grade de disciplinas com controle de entregas e notas. Papel 90g, capa dura e elástico.',
        basePrice: 7990,
        weightGrams: 520,
        images: ['caderno-ambar', 'caderno-azul'],
        variants: [
          { sku: 'SBS-PLA-ACA-AMB', color: 'Âmbar', colorHex: AMBAR, stock: 34 },
          { sku: 'SBS-PLA-ACA-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 28 },
        ],
      },
    ],
  },
  {
    name: 'Acessórios',
    slug: 'acessorios',
    description: 'O que completa o kit de quem passa o dia entre a escola e o trabalho.',
    emblem: '🎒',
    products: [
      {
        name: 'Mochila Strong Campus',
        slug: 'mochila-strong-campus',
        tagline: 'Compartimento acolchoado para notebook de até 16 polegadas.',
        description:
          'Mochila em poliéster 900D com revestimento impermeável, compartimento acolchoado para notebook de até 16", bolso frontal organizador, alças ergonômicas com espuma injetada e faixa traseira para encaixe em mala de viagem. 28 litros.',
        basePrice: 28990,
        compareAt: 33990,
        weightGrams: 980,
        featured: true,
        images: ['mochila-azul', 'mochila-grafite'],
        variants: [
          { sku: 'SBS-MOC-CAM-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 26 },
          { sku: 'SBS-MOC-CAM-GRA', color: 'Grafite', colorHex: GRAFITE, stock: 18 },
        ],
      },
      {
        name: 'Boné Strong Aba Curva',
        slug: 'bone-strong-aba-curva',
        tagline: 'Sarja de algodão com bordado frontal e ajuste em fivela metálica.',
        description:
          'Boné de seis gomos em sarja de algodão, aba curva pré-moldada, bordado frontal em alta densidade e ajuste traseiro em fivela metálica. Tamanho único.',
        basePrice: 7990,
        weightGrams: 180,
        images: ['bone-azul'],
        variants: [{ sku: 'SBS-BON-ABC-AZU', color: 'Azul Strong', colorHex: AZUL, stock: 44 }],
      },
    ],
  },
]

const COUPONS = [
  {
    code: 'BEMVINDO10',
    description: '10% de desconto na primeira compra',
    type: 'PERCENT',
    value: 10,
    minSubtotal: 0,
    maxUses: null,
  },
  {
    code: 'FRETEGRATIS',
    description: 'Frete grátis em compras acima de R$ 150',
    type: 'FREE_SHIPPING',
    value: 0,
    minSubtotal: 15000,
    maxUses: 500,
  },
  {
    code: 'CALOURO25',
    description: 'R$ 25 de desconto em compras acima de R$ 200',
    type: 'FIXED',
    value: 2500,
    minSubtotal: 20000,
    maxUses: 200,
  },
]

async function main() {
  console.log('Semeando a loja...')

  // --------------------------------------------------------------- usuários
  const admin = await prisma.user.upsert({
    where: { email: 'admin@strong.com.br' },
    update: { role: 'ADMIN' },
    create: {
      name: 'Coordenação da Loja',
      email: 'admin@strong.com.br',
      passwordHash: await bcrypt.hash('Strong@2026', 10),
      role: 'ADMIN',
      phone: '11999990000',
    },
  })

  const customer = await prisma.user.upsert({
    where: { email: 'aluno@exemplo.com' },
    update: {},
    create: {
      name: 'Ana Ribeiro',
      email: 'aluno@exemplo.com',
      passwordHash: await bcrypt.hash('Aluno@2026', 10),
      phone: '11988887777',
      document: '39053344705',
    },
  })

  const hasAddress = await prisma.address.findFirst({ where: { userId: customer.id } })
  if (!hasAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Casa',
        recipient: 'Ana Ribeiro',
        zip: '01310100',
        street: 'Avenida Paulista',
        number: '1578',
        complement: 'Apto 91',
        district: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        isDefault: true,
      },
    })
  }

  // --------------------------------------------------------------- catálogo
  let productCount = 0
  let variantCount = 0

  for (const [index, seedCategory] of CATALOG.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: seedCategory.slug },
      update: {
        name: seedCategory.name,
        description: seedCategory.description,
        emblem: seedCategory.emblem,
        sortOrder: index,
      },
      create: {
        name: seedCategory.name,
        slug: seedCategory.slug,
        description: seedCategory.description,
        emblem: seedCategory.emblem,
        sortOrder: index,
      },
    })

    for (const seedProduct of seedCategory.products) {
      const product = await prisma.product.upsert({
        where: { slug: seedProduct.slug },
        update: {
          name: seedProduct.name,
          tagline: seedProduct.tagline,
          description: seedProduct.description,
          basePrice: seedProduct.basePrice,
          compareAt: seedProduct.compareAt ?? null,
          weightGrams: seedProduct.weightGrams,
          featured: seedProduct.featured ?? false,
          categoryId: category.id,
        },
        create: {
          name: seedProduct.name,
          slug: seedProduct.slug,
          tagline: seedProduct.tagline,
          description: seedProduct.description,
          basePrice: seedProduct.basePrice,
          compareAt: seedProduct.compareAt ?? null,
          weightGrams: seedProduct.weightGrams,
          featured: seedProduct.featured ?? false,
          categoryId: category.id,
        },
      })
      productCount++

      // Imagens são recriadas: a ordem é o que define a foto de capa.
      await prisma.productImage.deleteMany({ where: { productId: product.id } })
      await prisma.productImage.createMany({
        data: seedProduct.images.map((image, order) => ({
          productId: product.id,
          url: `/produtos/${image}.svg`,
          alt: `${seedProduct.name} — ${image.split('-').slice(1).join(' ')}`,
          sortOrder: order,
        })),
      })

      for (const variant of seedProduct.variants) {
        await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          update: {
            size: variant.size ?? 'Único',
            color: variant.color ?? null,
            colorHex: variant.colorHex ?? null,
            price: variant.price ?? null,
            stock: variant.stock,
            productId: product.id,
          },
          create: {
            productId: product.id,
            sku: variant.sku,
            size: variant.size ?? 'Único',
            color: variant.color ?? null,
            colorHex: variant.colorHex ?? null,
            price: variant.price ?? null,
            stock: variant.stock,
          },
        })
        variantCount++
      }
    }
  }

  // ------------------------------------------------------- limpeza de órfãos
  // Produtos e variantes que saíram do catálogo declarado acima só somem se
  // nunca tiverem sido vendidos: o histórico de pedidos vem antes da faxina.
  const slugsAtuais = CATALOG.flatMap((c) => c.products.map((p) => p.slug))
  const skusAtuais = CATALOG.flatMap((c) => c.products.flatMap((p) => p.variants.map((v) => v.sku)))

  const variantesOrfas = await prisma.productVariant.findMany({
    where: { sku: { notIn: skusAtuais } },
    select: { id: true, sku: true, _count: { select: { orderItems: true } } },
  })

  for (const variante of variantesOrfas) {
    if (variante._count.orderItems > 0) {
      await prisma.productVariant.update({
        where: { id: variante.id },
        data: { active: false, stock: 0 },
      })
    } else {
      await prisma.productVariant.delete({ where: { id: variante.id } })
    }
  }

  const produtosOrfaos = await prisma.product.findMany({
    where: { slug: { notIn: slugsAtuais } },
    select: { id: true, slug: true, _count: { select: { variants: true } } },
  })

  for (const produto of produtosOrfaos) {
    if (produto._count.variants > 0) {
      await prisma.product.update({ where: { id: produto.id }, data: { active: false } })
    } else {
      await prisma.product.delete({ where: { id: produto.id } })
    }
  }

  const removidos = variantesOrfas.length + produtosOrfaos.length
  if (removidos > 0) {
    console.log(
      `Catálogo antigo limpo: ${variantesOrfas.length} variantes e ${produtosOrfaos.length} produtos fora da lista atual.`,
    )
  }

  // ---------------------------------------------------------------- cupons
  for (const coupon of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { description: coupon.description, active: true },
      create: {
        ...coupon,
        expiresAt: new Date(new Date().getFullYear() + 1, 11, 31),
      },
    })
  }

  console.log(`
Loja semeada.

  Categorias  ${CATALOG.length}
  Produtos    ${productCount}
  Variantes   ${variantCount}
  Cupons      ${COUPONS.length}

Acessos de teste:
  Administrador  ${admin.email}  ·  Strong@2026
  Cliente        ${customer.email}  ·  Aluno@2026
`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
