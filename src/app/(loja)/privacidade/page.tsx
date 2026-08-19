import type { Metadata } from 'next'
import Link from 'next/link'
import { readConsent, type Consent } from '@/lib/consent'
import { EMPRESA, enderecoCompleto } from '@/lib/empresa'
import { PaginaLegal, type SecaoLegal } from '@/components/loja/pagina-legal'
import { GerenciarCookies } from '@/components/loja/gerenciar-cookies'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Quais dados a Loja Strong Business School coleta, por que coleta, com quem compartilha e como exercer seus direitos.',
}

// O texto descreve o que o código realmente faz — as tabelas do schema, os
// cookies emitidos e os terceiros acionados. Ao mudar coleta ou compartilhamento,
// esta página muda junto: política que não corresponde ao sistema é pior que
// política nenhuma, porque documenta uma promessa que o produto não cumpre.
function secoes(consent: Consent | null): SecaoLegal[] {
  return [
    {
      titulo: 'Quem trata seus dados',
      paragrafos: [
        <>
          A loja é operada por {EMPRESA.razaoSocial}, inscrita no CNPJ {EMPRESA.cnpj}, com endereço em{' '}
          {enderecoCompleto()}.
        </>,
        <>
          Para dúvidas sobre privacidade, fale com nosso encarregado de proteção de dados
          ({EMPRESA.encarregado.nome}) pelo e-mail{' '}
          <a
            href={`mailto:${EMPRESA.encarregado.email}`}
            className="font-semibold text-brand-700 underline underline-offset-4"
          >
            {EMPRESA.encarregado.email}
          </a>
          .
        </>,
      ],
    },
    {
      titulo: 'Dados que coletamos',
      paragrafos: [
        'Coletamos apenas o necessário para vender, entregar e dar suporte. Nada aqui é vendido ou cedido para fins publicitários de terceiros.',
      ],
      itens: [
        <>
          <strong className="text-brand-900">Cadastro:</strong> nome, e-mail, senha (guardada apenas
          como hash, nunca em texto legível) e, quando você informa, telefone e CPF. O CPF é exigido
          pelo meio de pagamento na emissão de Pix e boleto.
        </>,
        <>
          <strong className="text-brand-900">Entrega:</strong> endereços salvos na sua conta e uma
          cópia congelada do endereço em cada pedido, para o histórico continuar correto mesmo que
          você altere o cadastro depois.
        </>,
        <>
          <strong className="text-brand-900">Pedidos:</strong> itens, valores, meio de pagamento,
          status e código de rastreio.
        </>,
        <>
          <strong className="text-brand-900">Navegação:</strong> se — e somente se — você aceitar os
          cookies opcionais, registramos quais produtos são visitados, associados a um identificador
          aleatório guardado no seu navegador. Com a conta aberta, essa visita também fica ligada ao
          seu cadastro. Usamos isso para medir quais produtos convertem em venda. Recusando, nada
          disso é gravado.
        </>,
        <>
          <strong className="text-brand-900">Avisos de reposição:</strong> quando você pede para ser
          avisado de um item esgotado, guardamos seu e-mail — mesmo que você não tenha conta na loja.
        </>,
      ],
    },
    {
      titulo: 'Por que tratamos cada dado',
      paragrafos: [
        'A LGPD exige uma base legal para cada uso. Estas são as nossas:',
      ],
      itens: [
        <>
          <strong className="text-brand-900">Execução do contrato:</strong> criar sua conta, processar
          o pedido, cobrar, entregar e dar suporte. Sem esses dados não há como vender.
        </>,
        <>
          <strong className="text-brand-900">Obrigação legal:</strong> guarda de documentos fiscais e
          de registros de acesso, nos prazos que a lei determina.
        </>,
        <>
          <strong className="text-brand-900">Legítimo interesse:</strong> segurança da conta e
          prevenção a fraude. Você pode se opor a esse uso a qualquer momento (veja a seção 6).
        </>,
        <>
          <strong className="text-brand-900">Consentimento:</strong> as métricas de navegação e
          conversão, que dependem do seu aceite no aviso de cookies e podem ser revogadas quando você
          quiser na seção 4; e o aviso de volta ao estoque, enviado só a quem pediu, uma única vez por
          item.
        </>,
      ],
    },
    {
      titulo: 'Cookies que usamos',
      paragrafos: [
        'Não usamos cookies de publicidade nem redes de rastreamento de terceiros. São quatro, todos próprios:',
      ],
      itens: [
        <>
          <strong className="text-brand-900">Sessão</strong> — mantém você conectado por até 30 dias.
          Sem ele não é possível entrar na conta.
        </>,
        <>
          <strong className="text-brand-900">Carrinho</strong> — guarda os itens escolhidos por até 30
          dias, para o carrinho sobreviver ao fechamento do navegador.
        </>,
        <>
          <strong className="text-brand-900">Cupom</strong> — lembra o cupom aplicado até a conclusão
          da compra.
        </>,
        <>
          <strong className="text-brand-900">Visitante</strong> — identificador aleatório, válido por
          um ano, usado para as métricas de navegação descritas acima. É o único que não é essencial
          ao funcionamento da loja, e por isso só é criado se você aceitar. Enquanto não houver
          aceite, nenhuma visita é registrada.
        </>,
      ],
      extra: <GerenciarCookies atual={consent} />,
    },
    {
      titulo: 'Com quem compartilhamos',
      paragrafos: [
        'Compartilhamos o mínimo indispensável, e só com quem participa da operação da loja:',
      ],
      itens: [
        <>
          <strong className="text-brand-900">Mercado Pago</strong> — processa os pagamentos. Recebe os
          dados necessários à cobrança, incluindo CPF quando exigido para Pix e boleto. Os dados do
          seu cartão são digitados no ambiente do próprio Mercado Pago e nunca passam pelos nossos
          servidores.
        </>,
        <>
          <strong className="text-brand-900">Serviço de e-mail</strong> — entrega as mensagens
          transacionais (confirmação de cadastro, redefinição de senha, avisos de pedido e de
          estoque).
        </>,
        <>
          <strong className="text-brand-900">Hospedagem</strong> — mantém a aplicação e o banco de
          dados no ar.
        </>,
        <>
          <strong className="text-brand-900">Transportadoras</strong> — recebem nome e endereço para
          entregar o pedido.
        </>,
        <>
          Também podemos compartilhar dados por ordem judicial ou requisição de autoridade
          competente.
        </>,
      ],
    },
    {
      titulo: 'Seus direitos',
      paragrafos: [
        <>
          A LGPD garante a você o direito de confirmar se tratamos seus dados, acessá-los, corrigir o
          que estiver errado, pedir anonimização ou eliminação, solicitar portabilidade, saber com
          quem compartilhamos, revogar consentimentos e se opor a tratamentos feitos com base em
          legítimo interesse.
        </>,
        <>
          Boa parte disso você resolve sozinho na área <Link href="/conta" className="font-semibold text-brand-700 underline underline-offset-4">Minha conta</Link>:
          alterar cadastro, gerenciar endereços e trocar a senha. Para os demais pedidos, escreva para{' '}
          <a
            href={`mailto:${EMPRESA.encarregado.email}`}
            className="font-semibold text-brand-700 underline underline-offset-4"
          >
            {EMPRESA.encarregado.email}
          </a>{' '}
          — respondemos no prazo legal.
        </>,
        'Um aviso honesto: eliminar dados ligados a pedidos já faturados tem limite. Documentos fiscais precisam ser guardados por prazo determinado em lei, e nesses casos mantemos apenas o mínimo exigido, sem usar essas informações para mais nada.',
      ],
    },
    {
      titulo: 'Por quanto tempo guardamos',
      paragrafos: [
        'Dados de cadastro ficam enquanto sua conta existir. Se você pedir a exclusão, apagamos o que não estivermos obrigados a manter.',
        'Dados de pedidos e documentos fiscais seguem os prazos de guarda previstos na legislação tributária e no Código de Defesa do Consumidor. Registros de acesso são mantidos pelo prazo do Marco Civil da Internet.',
        'Os links de confirmação de e-mail e de redefinição de senha são descartados assim que usados ou vencidos — em 24 horas e 1 hora, respectivamente.',
      ],
    },
    {
      titulo: 'Segurança',
      paragrafos: [
        'Senhas são guardadas apenas como hash, com algoritmo próprio para isso — nem a equipe da loja consegue lê-las. Trocar a senha encerra automaticamente as sessões abertas em outros aparelhos.',
        'Os links enviados por e-mail funcionam uma única vez e têm validade curta, e o banco guarda apenas uma impressão digital deles, não o link em si.',
        'Nenhum sistema é imune. Se ocorrer um incidente de segurança com risco relevante aos seus dados, comunicaremos você e a Autoridade Nacional de Proteção de Dados, como manda a lei.',
      ],
    },
    {
      titulo: 'Menores de idade',
      paragrafos: [
        'A loja é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de crianças e adolescentes. Se identificarmos um cadastro nessa condição sem o consentimento devido, ele será removido.',
      ],
    },
    {
      titulo: 'Mudanças nesta política',
      paragrafos: [
        'Quando esta política mudar, atualizamos a data no topo da página. Alterações relevantes na forma como tratamos seus dados são comunicadas por e-mail antes de entrarem em vigor.',
      ],
    },
  ]
}

export default async function PrivacidadePage() {
  const consent = await readConsent()

  return (
    <PaginaLegal
      eyebrow="Documentos legais"
      titulo="Política de Privacidade"
      intro="Quais dados a loja coleta, por que coleta, com quem compartilha e como você controla tudo isso."
      secoes={secoes(consent)}
      outraPagina={{ href: '/termos', label: 'Ler os Termos de Uso' }}
    />
  )
}
