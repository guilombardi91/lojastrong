import { sendMail } from './mailer'
import { button, noticeBox, paragraph, productCard, renderEmail } from './email-template'

// Os e-mails transacionais da loja. Cada um monta duas versões: o HTML e um
// texto puro equivalente. O texto não é enfeite — filtros corporativos pontuam
// melhor mensagens multipart, e alguns clientes entregam só essa parte.

/** URL pública da loja, com fallback para o ambiente local. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]
}

/** Mensagem pronta para o transporte — e para inspeção sem envio. */
export type BuiltEmail = { subject: string; text: string; html: string }

export function buildVerificationEmail(input: { name: string; token: string }): BuiltEmail {
  const url = `${siteUrl()}/confirmar-email?token=${encodeURIComponent(input.token)}`
  const nome = firstName(input.name)

  return {
    subject: 'Confirme seu cadastro na Loja Strong',
    text: [
      `Olá, ${nome}!`,
      '',
      'Sua conta na Loja Strong Business School foi criada. Falta confirmar que este',
      'e-mail é seu — é por ele que enviamos a confirmação dos pedidos e o código de',
      'rastreio das entregas.',
      '',
      'Confirme por este endereço:',
      url,
      '',
      'O link vale por 24 horas.',
      'Se não foi você quem criou a conta, ignore esta mensagem — nada será ativado.',
      '',
      'Loja Strong Business School',
    ].join('\n'),
    html: renderEmail({
      preheader: 'Falta um clique para liberar suas compras na Loja Strong.',
      eyebrow: 'Confirmação de cadastro',
      heading: `Boas-vindas, ${nome}!`,
      body: [
        paragraph(
          'Sua conta foi criada. Falta só confirmar que este e-mail é seu — é por ele que enviamos a confirmação dos pedidos e o código de rastreio das entregas.',
        ),
        paragraph(
          'Enquanto não confirmar, você navega e monta o carrinho normalmente, mas a finalização da compra fica bloqueada.',
        ),
        noticeBox(
          'O link vale por <strong>24 horas</strong>. Se não foi você quem criou a conta, é só ignorar esta mensagem — nada será ativado.',
        ),
      ].join('\n'),
      cta: { label: 'Confirmar meu e-mail', url },
      footerNote: 'Você recebeu este e-mail porque ele foi usado em um cadastro na nossa loja.',
    }),
  }
}

export async function sendVerificationEmail(input: {
  to: string
  name: string
  token: string
}): Promise<void> {
  await sendMail({ to: input.to, ...buildVerificationEmail(input) })
}

export function buildPasswordResetEmail(input: { name: string; token: string }): BuiltEmail {
  const url = `${siteUrl()}/redefinir-senha?token=${encodeURIComponent(input.token)}`
  const nome = firstName(input.name)

  return {
    subject: 'Redefinir sua senha da Loja Strong',
    text: [
      `Olá, ${nome}!`,
      '',
      'Recebemos um pedido para redefinir a senha da sua conta na Loja Strong.',
      '',
      'Crie uma senha nova por este endereço:',
      url,
      '',
      'O link vale por 1 hora e só funciona uma vez.',
      'Ao salvar a senha nova, as sessões abertas em outros aparelhos são encerradas.',
      '',
      'Se não foi você que pediu, ignore esta mensagem: sua senha atual continua valendo',
      'e ninguém consegue entrar com este link sem acesso à sua caixa de e-mail.',
      '',
      'Loja Strong Business School',
    ].join('\n'),
    html: renderEmail({
      preheader: 'Link para criar uma senha nova. Vale por 1 hora.',
      eyebrow: 'Recuperação de acesso',
      heading: 'Vamos criar uma senha nova',
      body: [
        paragraph(
          `Olá, ${nome}! Recebemos um pedido para redefinir a senha da sua conta na Loja Strong.`,
        ),
        paragraph(
          'Ao salvar a senha nova, as sessões abertas em outros aparelhos são encerradas automaticamente.',
        ),
        noticeBox(
          'O link vale por <strong>1 hora</strong> e só funciona uma vez.<br><strong>Não foi você que pediu?</strong> Ignore esta mensagem: sua senha atual continua valendo, e ninguém entra com este link sem acesso à sua caixa de e-mail.',
        ),
      ].join('\n'),
      cta: { label: 'Criar uma senha nova', url },
      footerNote: 'Por segurança, nunca pedimos sua senha por e-mail ou telefone.',
    }),
  }
}

export async function sendPasswordResetEmail(input: {
  to: string
  name: string
  token: string
}): Promise<void> {
  await sendMail({ to: input.to, ...buildPasswordResetEmail(input) })
}

export type BackInStockInput = {
  productName: string
  variantLabel?: string
  price: string
  imageUrl?: string | null
  productUrl: string
}

export function buildBackInStockEmail(input: BackInStockInput): BuiltEmail {
  const label = input.variantLabel ? ` (${input.variantLabel})` : ''

  return {
    subject: `${input.productName} está de volta ao estoque`,
    text: [
      `${input.productName}${label} voltou ao estoque.`,
      '',
      `Preço: ${input.price}`,
      '',
      'Garanta o seu:',
      input.productUrl,
      '',
      'Este aviso foi enviado uma única vez, para quem pediu para ser avisado.',
      'A reposição é limitada e não reservamos unidades.',
      '',
      'Loja Strong Business School',
    ].join('\n'),
    html: renderEmail({
      preheader: `${input.productName}${label} voltou ao estoque — e a reposição é limitada.`,
      eyebrow: 'Voltou ao estoque',
      heading: 'O item que você esperava chegou',
      body: [
        paragraph('Você pediu para ser avisado quando este item voltasse. Ele acabou de voltar:'),
        productCard({
          name: input.productName,
          variantLabel: input.variantLabel,
          price: input.price,
          imageUrl: input.imageUrl,
        }),
        paragraph(
          'A reposição é limitada e não reservamos unidades — quem finaliza a compra primeiro leva.',
          { muted: true },
        ),
      ].join('\n'),
      cta: { label: 'Ver produto na loja', url: input.productUrl },
      footerNote:
        'Você recebeu este aviso porque pediu para ser avisado sobre este item. Ele é enviado uma única vez.',
    }),
  }
}

export async function sendBackInStockEmail(input: BackInStockInput & { to: string }): Promise<void> {
  await sendMail({ to: input.to, ...buildBackInStockEmail(input) })
}

// Reexportado para quem monta um e-mail pontual sem passar por estas funções.
export { button, noticeBox, paragraph, renderEmail }
