import type { Metadata } from 'next'
import Link from 'next/link'
import { EMPRESA, enderecoCompleto } from '@/lib/empresa'
import { formatBRL } from '@/lib/money'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping'
import { PaginaLegal, type SecaoLegal } from '@/components/loja/pagina-legal'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description:
    'Regras de uso da Loja Strong Business School: cadastro, pedidos, pagamento, entrega, arrependimento e trocas.',
}

// Valores como frete grátis vêm das constantes que o checkout usa de verdade
// (FREE_SHIPPING_THRESHOLD), em vez de números digitados aqui: assim a regra
// anunciada e a regra cobrada não têm como divergir.
const SECOES: SecaoLegal[] = [
  {
    titulo: 'Quem somos',
    paragrafos: [
      <>
        A {EMPRESA.nomeFantasia} é operada por {EMPRESA.razaoSocial}, CNPJ {EMPRESA.cnpj}, com sede
        em {enderecoCompleto()}.
      </>,
      <>
        Atendimento pelo e-mail{' '}
        <a
          href={`mailto:${EMPRESA.contato.email}`}
          className="font-semibold text-brand-700 underline underline-offset-4"
        >
          {EMPRESA.contato.email}
        </a>{' '}
        e pelo telefone {EMPRESA.contato.telefone}, em {EMPRESA.contato.horario}.
      </>,
      'Ao navegar, criar conta ou comprar nesta loja, você concorda com estes termos. Se não concordar com algum ponto, não utilize a loja.',
    ],
  },
  {
    titulo: 'Conta e cadastro',
    paragrafos: [
      'Para comprar é preciso criar uma conta com dados verdadeiros e completos. Você é responsável por mantê-los atualizados.',
      'Depois do cadastro enviamos um e-mail de confirmação. Enquanto o endereço não for confirmado você navega e monta o carrinho normalmente, mas não consegue finalizar pedidos — é por esse e-mail que enviamos a confirmação da compra e o código de rastreio.',
      'A senha é pessoal e intransferível. Se desconfiar que alguém teve acesso a ela, troque-a imediatamente: ao salvar uma senha nova, todas as sessões abertas em outros aparelhos são encerradas.',
      'Podemos suspender contas que descumpram estes termos, que usem dados falsos ou que apresentem indícios de fraude.',
    ],
  },
  {
    titulo: 'Produtos, preços e disponibilidade',
    paragrafos: [
      'As fotos são ilustrativas e podem ter pequenas variações de tom em relação à peça física, por diferença de calibragem entre telas.',
      'Os preços valem para o momento da compra e podem mudar sem aviso prévio. O valor que vale é o exibido na finalização do pedido.',
      'Vendas dependem de estoque. Não reservamos unidades antes da conclusão do pedido: itens no carrinho continuam disponíveis para outros clientes até você finalizar a compra.',
      'Em caso de erro evidente de cadastro de preço, podemos cancelar o pedido antes do envio e devolver integralmente qualquer valor já pago, comunicando você.',
    ],
  },
  {
    titulo: 'Pagamento',
    paragrafos: [
      'Aceitamos Pix, boleto bancário e cartão de crédito em até 12x, processados pelo Mercado Pago. Os dados do cartão são digitados no ambiente do próprio Mercado Pago e não passam pelos nossos servidores.',
      'O pedido só entra em separação após a confirmação do pagamento. Pix costuma confirmar em minutos; boleto pode levar até 3 dias úteis para compensar.',
      'Pedidos com pagamento não confirmado dentro do prazo do boleto ou do Pix são cancelados automaticamente, e os itens voltam ao estoque.',
    ],
  },
  {
    titulo: 'Entrega',
    paragrafos: [
      <>
        Enviamos para todo o Brasil a partir de São Paulo. A postagem ocorre em até 2 dias úteis
        após a confirmação do pagamento, e o prazo de transporte varia conforme a região, calculado
        pelo seu CEP antes da finalização. Compras a partir de {formatBRL(FREE_SHIPPING_THRESHOLD)}{' '}
        têm entrega padrão sem custo.
      </>,
      'O prazo começa a contar da postagem, não da compra. Atrasos causados por endereço incorreto ou incompleto, ausência de recebedor ou eventos alheios ao nosso controle não são de nossa responsabilidade.',
      <>
        O código de rastreio aparece na página do pedido, dentro de{' '}
        <Link href="/conta" className="font-semibold text-brand-700 underline underline-offset-4">
          Minha conta
        </Link>
        , assim que o pedido é despachado.
      </>,
    ],
  },
  {
    titulo: 'Direito de arrependimento',
    paragrafos: [
      'Por se tratar de compra pela internet, o artigo 49 do Código de Defesa do Consumidor garante a você o direito de desistir da compra em até 7 dias corridos, contados do recebimento do produto, sem precisar justificar.',
      'Basta comunicar a desistência pelo nosso canal de atendimento dentro desse prazo. O produto deve ser devolvido sem uso, com etiqueta e embalagem original, e o custo do frete de devolução nesse caso é nosso.',
      'A devolução do valor pago é integral — incluindo o frete original — e é feita pelo mesmo meio de pagamento usado na compra, após recebermos o produto de volta.',
    ],
  },
  {
    titulo: 'Trocas e defeitos',
    paragrafos: [
      'O arrependimento acima é um direito legal e não se confunde com nossa política de trocas, que é mais generosa: a primeira troca de tamanho de cada pedido não tem custo de frete, e pode ser pedida em até 30 dias do recebimento, com a peça sem uso, com etiqueta e na embalagem original.',
      'Produtos com defeito de fabricação seguem o prazo legal de garantia: 30 dias para produtos não duráveis e 90 dias para duráveis, contados do recebimento. Nesses casos, reparamos, trocamos ou devolvemos o valor, conforme a lei.',
      'Desgaste natural pelo uso, lavagem fora das instruções da etiqueta e danos causados por mau uso não são cobertos.',
    ],
  },
  {
    titulo: 'Cupons de desconto',
    paragrafos: [
      'Cupons têm regras próprias de validade, valor mínimo de compra e quantidade de usos, informadas na divulgação de cada um. Só é possível aplicar um cupom por pedido.',
      'Cupons não são cumulativos com outras promoções, salvo indicação em contrário, e não podem ser trocados por dinheiro. Cancelado o pedido, o cupom pode não estar mais disponível para uso posterior.',
    ],
  },
  {
    titulo: 'Propriedade intelectual',
    paragrafos: [
      'A marca Strong Business School, o logotipo, os textos, as fotos e o desenho da loja são protegidos por lei. O uso sem autorização prévia e por escrito é proibido.',
      'A compra de um produto dá a você a propriedade da peça, não o direito de usar a marca para fins comerciais, de revenda ou de divulgação.',
    ],
  },
  {
    titulo: 'Privacidade',
    paragrafos: [
      <>
        O tratamento dos seus dados pessoais é descrito na{' '}
        <Link
          href="/privacidade"
          className="font-semibold text-brand-700 underline underline-offset-4"
        >
          Política de Privacidade
        </Link>
        , que é parte integrante destes termos.
      </>,
    ],
  },
  {
    titulo: 'Mudanças e foro',
    paragrafos: [
      'Podemos alterar estes termos a qualquer momento. A data da última revisão aparece no topo desta página, e a versão vigente é sempre a publicada aqui. Pedidos já feitos seguem os termos válidos na data da compra.',
      <>
        Fica eleito o foro da comarca de {EMPRESA.foro} para resolver questões decorrentes destes
        termos, sem prejuízo do direito do consumidor de acionar o foro do seu próprio domicílio.
      </>,
    ],
  },
]

export default function TermosPage() {
  return (
    <PaginaLegal
      eyebrow="Documentos legais"
      titulo="Termos de Uso"
      intro="As regras da loja: como funciona o cadastro, o pedido, o pagamento, a entrega e seus direitos de arrependimento e troca."
      secoes={SECOES}
      outraPagina={{ href: '/privacidade', label: 'Ler a Política de Privacidade' }}
    />
  )
}
