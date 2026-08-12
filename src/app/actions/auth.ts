'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { endSession, getCurrentUser, hashPassword, startSession, verifyPassword } from '@/lib/auth'
import { mergeCartsOnLogin } from '@/lib/cart'
import { fieldErrors, passwordChangeSchema, profileSchema, signInSchema, signUpSchema } from '@/lib/validation'
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

  return { ok: true, message: 'Senha alterada.' }
}
