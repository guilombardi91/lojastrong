// Montagem do HTML dos e-mails transacionais.
//
// Cliente de e-mail não é navegador. O Outlook do Microsoft 365 renderiza com
// o motor do Word: flexbox, grid, position e border-radius em <div> não valem
// nada lá. Por isso tudo aqui é tabela aninhada com estilo inline — <style> no
// <head> é removido por boa parte dos webmails antes de entregar a mensagem.

const PALETTE = {
  brand950: '#031c33',
  brand800: '#074784',
  brand700: '#0a5da9',
  brand100: '#d5e6f5',
  amber600: '#d99320',
  amber500: '#fab644',
  amber100: '#fef1d9',
  paper: '#f1f5f9',
  ink: '#0b1b2b',
  inkMuted: '#57687a',
  line: '#dfe7ef',
  white: '#ffffff',
}

// Segoe UI primeiro: é a fonte que o Outlook no Windows realmente tem.
const FONT = "'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Parágrafo padrão do corpo. */
export function paragraph(html: string, options: { muted?: boolean } = {}): string {
  const color = options.muted ? PALETTE.inkMuted : PALETTE.ink
  const size = options.muted ? '14px' : '15px'
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:${size};line-height:1.65;color:${color}">${html}</p>`
}

/**
 * Botão "bulletproof": o bloco VML é o que o Outlook desenha, e o <a> comum
 * atende todo o resto. Sem o VML, o Outlook mostra um retângulo quadrado e sem
 * cor de fundo.
 */
export function button(label: string, url: string): string {
  const safeUrl = escapeHtml(url)
  const safeLabel = escapeHtml(label)
  // O VML exige largura fixa em pixel; estimar pelo rótulo evita corte.
  const width = Math.max(200, label.length * 9 + 56)

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0">
  <tr><td>
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeUrl}" style="height:46px;v-text-anchor:middle;width:${width}px;" arcsize="20%" stroke="f" fillcolor="${PALETTE.brand700}">
      <w:anchorlock/>
      <center style="color:${PALETTE.white};font-family:${FONT};font-size:15px;font-weight:bold;">${safeLabel}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-- -->
    <a href="${safeUrl}" style="display:inline-block;background:${PALETTE.brand700};color:${PALETTE.white};font-family:${FONT};font-size:15px;font-weight:700;line-height:46px;text-align:center;text-decoration:none;border-radius:9px;padding:0 28px;min-width:${width - 56}px">${safeLabel}</a>
    <!--<![endif]-->
  </td></tr>
</table>`.trim()
}

/** Bloco destacado: usado para avisos de segurança e prazos. */
export function noticeBox(html: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;background:${PALETTE.amber100};border-radius:10px">
  <tr>
    <td style="padding:14px 16px;border-left:3px solid ${PALETTE.amber500};font-family:${FONT};font-size:13px;line-height:1.6;color:${PALETTE.ink}">${html}</td>
  </tr>
</table>`.trim()
}

/**
 * Cartão de produto para o aviso de reposição.
 *
 * A imagem entra só quando é um formato que cliente de e-mail desenha: o
 * catálogo semeado usa SVG, que Gmail e Outlook simplesmente não renderizam —
 * sairia um espaço vazio no lugar do produto.
 */
export function productCard(input: {
  name: string
  variantLabel?: string
  price: string
  imageUrl?: string | null
}): string {
  const usableImage =
    input.imageUrl && !/\.svg($|\?)/i.test(input.imageUrl) ? escapeHtml(input.imageUrl) : null

  const imageCell = usableImage
    ? `<td width="96" style="padding:0 16px 0 0" valign="top">
         <img src="${usableImage}" width="96" alt="${escapeHtml(input.name)}" style="display:block;width:96px;height:auto;border-radius:8px;border:1px solid ${PALETTE.line}">
       </td>`
    : ''

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:${PALETTE.paper};border-radius:12px">
  <tr>
    <td style="padding:18px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${imageCell}
          <td valign="top" style="font-family:${FONT}">
            <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:${PALETTE.brand950};line-height:1.35">${escapeHtml(input.name)}</p>
            ${
              input.variantLabel
                ? `<p style="margin:0 0 8px;font-size:13px;color:${PALETTE.inkMuted}">${escapeHtml(input.variantLabel)}</p>`
                : ''
            }
            <p style="margin:0;font-size:18px;font-weight:700;color:${PALETTE.brand700}">${escapeHtml(input.price)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim()
}

/**
 * Envelope comum a todos os e-mails.
 *
 * `preheader` é o trecho que a caixa de entrada mostra ao lado do assunto.
 * Sem ele, o Gmail preenche esse espaço com o começo do HTML — normalmente o
 * texto do rodapé, que não diz nada.
 */
export function renderEmail(input: {
  preheader: string
  eyebrow: string
  heading: string
  body: string
  cta?: { label: string; url: string }
  footerNote?: string
}): string {
  const fallbackLink = input.cta
    ? `<p style="margin:22px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${PALETTE.inkMuted}">
         Se o botão não funcionar, copie este endereço no navegador:<br>
         <span style="word-break:break-all;color:${PALETTE.brand700}">${escapeHtml(input.cta.url)}</span>
       </p>`
    : ''

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${escapeHtml(input.heading)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:${PALETTE.paper};-webkit-font-smoothing:antialiased">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${escapeHtml(input.preheader)}</div>
<!-- Espaços invisíveis impedem o Gmail de emendar o corpo no preheader. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PALETTE.paper}">
  <tr>
    <td align="center" style="padding:28px 12px 40px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${PALETTE.white};border-radius:14px;overflow:hidden">

        <tr>
          <td style="background:${PALETTE.brand950};padding:22px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-family:${FONT};font-size:17px;font-weight:700;letter-spacing:.09em;color:${PALETTE.white}">
                  STRONG
                  <span style="display:block;margin-top:3px;font-size:11px;font-weight:600;letter-spacing:.14em;color:${PALETTE.amber500}">LOJA OFICIAL</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:34px 32px 30px">
            <p style="margin:0 0 8px;font-family:${FONT};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${PALETTE.amber600}">${escapeHtml(input.eyebrow)}</p>
            <h1 style="margin:0 0 18px;font-family:${FONT};font-size:23px;line-height:1.3;font-weight:800;color:${PALETTE.brand950}">${escapeHtml(input.heading)}</h1>
            ${input.body}
            ${input.cta ? button(input.cta.label, input.cta.url) : ''}
            ${fallbackLink}
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px">
            <div style="height:1px;background:${PALETTE.line};font-size:0;line-height:0">&nbsp;</div>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 28px;font-family:${FONT};font-size:12px;line-height:1.6;color:${PALETTE.inkMuted}">
            ${input.footerNote ? `<p style="margin:0 0 10px">${input.footerNote}</p>` : ''}
            <p style="margin:0;color:${PALETTE.brand950};font-weight:600">Loja Strong Business School</p>
            <p style="margin:2px 0 0">Este é um e-mail automático — não responda a esta mensagem.</p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`
}
