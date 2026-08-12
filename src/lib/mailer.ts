import nodemailer from 'nodemailer'

// Sem SMTP_HOST configurado a loja loga o e-mail no console em vez de
// quebrar a ação que o chamou — mesmo princípio do provider de pagamento
// (ver src/lib/payments/index.ts): a equipe consegue testar o fluxo antes
// de ter credenciais de um provedor real.

type MailInput = {
  to: string
  subject: string
  text: string
  html: string
}

function transporter() {
  const host = process.env.SMTP_HOST
  if (!host) return null

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

export async function sendMail(input: MailInput): Promise<void> {
  const transport = transporter()

  if (!transport) {
    console.warn(`[email] SMTP_HOST não configurado. Simulando envio para ${input.to}: "${input.subject}"`)
    return
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'Loja Strong <no-reply@strong.com.br>',
    ...input,
  })
}
