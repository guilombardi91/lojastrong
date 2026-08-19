'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  endSession,
  getCurrentUser,
  hashPassword,
  revokeSessions,
  startSession,
  verifyPassword,
} from '@/lib/auth'
import { consumeAuthToken, issueAuthToken, purgeExpiredTokens } from '@/lib/auth-tokens'
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/emails'
import { mergeCartsOnLogin } from '@/lib/cart'
import {
  fieldErrors,
  forgotPasswordSchema,
  passwordChangeSchema,
  profileSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validation'
import type { Role } from '@/lib/enums'

export type FormState = {
  errors?: Record<string, string>
  message?: string
  ok?: boolean
}

/** Só aceita destinos internos: um `destino` externo viraria open redirect. */
function safeDestination(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === 'string' ? value.trim() : ''
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

/**
 * Envia o e-mail de confirmação sem deixar uma falha de SMTP derrubar a ação
 * que chamou. A conta já existe neste ponto: melhor o cliente entrar e pedir
 * o reenvio do que ver o cadastro falhar depois de gravado.
 */
async function deliverVerification(user: { id: string; name: string; email: string }) {
  try {
    const token = await issueAuthToken(user.id, 'EMAIL_VERIFICATION')
    await sendVerificationEmail({ to: user.email, name: user.name, token })
  } catch (error) {
    console.error('[auth] falha ao enviar confirmação de e-mail', error)
  }
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { errors: { email: 'Já existe uma conta com este e-mail.' } }
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await hashPassword(password) },
  })

  await deliverVerification(user)

  await startSession({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  })
  await mergeCartsOnLogin(user.id)

  redirect(safeDestination(formData.get('destino')) ?? '/conta')
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) }
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })

  // Mensagem única para e-mail inexistente e senha errada: dizer qual dos dois
  // falhou entrega a um atacante quais e-mails têm conta na loja.
  const invalid = { errors: { form: 'E-mail ou senha incorretos.' } }
  if (!user || !user.active) return invalid
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return invalid

  await startSession({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  })
  await mergeCartsOnLogin(user.id)

  const destination = safeDestination(formData.get('destino'))
  redirect(destination ?? (user.role === 'ADMIN' ? '/admin' : '/conta'))
}

export async function signOutAction() {
  await endSession()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { errors: { form: 'Sua sessão expirou. Entre novamente.' } }

  const parsed = profileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    document: formData.get('document'),
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone?.replace(/\D/g, '') || null,
      document: parsed.data.document?.replace(/\D/g, '') || null,
    },
  })

  // O nome aparece no cabeçalho, que lê do token: reemitir mantém os dois em dia.
  await startSession({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: parsed.data.name,
  })

  revalidatePath('/conta')
  return { ok: true, message: 'Dados atualizados.' }
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { errors: { form: 'Sua sessão expirou. Entre novamente.' } }

  const parsed = passwordChangeSchema.safeParse({
    current: formData.get('current'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const record = await prisma.user.findUnique({ where: { id: user.id } })
  if (!record || !(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { errors: { current: 'Senha atual incorreta.' } }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  })

  // Derruba as sessões abertas em outros aparelhos e reemite a deste, para
  // quem trocou a senha não ser expulso da própria aba.
  await revokeSessions(user.id)
  await startSession({
    userId: user.id,
    role: user.role as Role,
    email: user.email,
    name: user.name,
  })

  return { ok: true, message: 'Senha alterada. As sessões em outros aparelhos foram encerradas.' }
}

// ------------------------------------------------- confirmação de e-mail

/** Reenvia o link de confirmação para quem está logado e ainda não confirmou. */
export async function resendVerificationAction(): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { errors: { form: 'Sua sessão expirou. Entre novamente.' } }
  if (user.emailVerified) return { ok: true, message: 'Seu e-mail já está confirmado.' }

  await deliverVerification(user)
  revalidatePath('/conta')

  return { ok: true, message: `Enviamos um link novo para ${user.email}.` }
}

/**
 * Consome o token do link e marca o e-mail como confirmado.
 *
 * Só roda em POST, a partir do botão da página /confirmar-email. Fazer isso no
 * GET seria mais direto, mas o Safe Links do Microsoft 365 abre os endereços
 * das mensagens para escaneá-las: o token queimaria no scanner e o cliente
 * receberia "link inválido" sem nunca ter clicado.
 */
export async function confirmEmailAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get('token') ?? '')
  const consumed = await consumeAuthToken(token, 'EMAIL_VERIFICATION')

  if (!consumed.ok) {
    return {
      errors: {
        form:
          consumed.reason === 'expired'
            ? 'Este link expirou. Entre na sua conta e peça um novo.'
            : 'Este link não vale mais. Se você já confirmou, é só entrar na loja.',
      },
    }
  }

  await prisma.user.update({
    where: { id: consumed.userId },
    data: { emailVerifiedAt: new Date() },
  })

  revalidatePath('/conta')
  revalidatePath('/checkout')
  return { ok: true, message: 'E-mail confirmado! Sua conta está liberada para comprar.' }
}

// ---------------------------------------------------- esqueci minha senha

/**
 * Dispara o e-mail de redefinição.
 *
 * Responde a mesma coisa exista ou não a conta: a tela de "esqueci a senha" é
 * pública, e um retorno diferente para cada caso viraria um verificador de
 * quais e-mails têm cadastro na loja.
 */
export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const confirmation = {
    ok: true,
    message: 'Se houver uma conta com esse e-mail, o link de redefinição chegará em instantes.',
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user || !user.active) return confirmation

  try {
    await purgeExpiredTokens()
    const token = await issueAuthToken(user.id, 'PASSWORD_RESET')
    await sendPasswordResetEmail({ to: user.email, name: user.name, token })
  } catch (error) {
    console.error('[auth] falha ao enviar redefinição de senha', error)
  }

  return confirmation
}

/** Grava a senha nova a partir do token do e-mail. */
export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    confirm: formData.get('confirm'),
  })

  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const consumed = await consumeAuthToken(parsed.data.token, 'PASSWORD_RESET')
  if (!consumed.ok) {
    return {
      errors: {
        form:
          consumed.reason === 'expired'
            ? 'Este link expirou. Peça um novo para redefinir a senha.'
            : 'Este link não vale mais. Peça um novo para redefinir a senha.',
      },
    }
  }

  await prisma.user.update({
    where: { id: consumed.userId },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  })

  // Quem pediu a redefinição pode estar recuperando a conta de um invasor:
  // toda sessão anterior cai junto. Sem abrir sessão nova aqui — a pessoa
  // entra com a senha que acabou de criar, o que confirma que ela a guardou.
  await revokeSessions(consumed.userId)

  return { ok: true, message: 'Senha redefinida. Use a senha nova para entrar.' }
}
