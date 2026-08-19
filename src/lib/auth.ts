import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import {
  SESSION_COOKIE,
  readSession,
  sessionCookieOptions,
  signSession,
  type SessionPayload,
} from './session'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function startSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, sessionCookieOptions)
}

export async function endSession(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

/**
 * Invalida todas as sessões já emitidas para o usuário.
 *
 * O corte é truncado no segundo porque o `iat` do JWT também é: sem isso, um
 * token emitido no mesmo instante do corte nasceria inválido, e quem acabou de
 * trocar a própria senha seria deslogado no ato.
 */
export async function revokeSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionsValidFrom: new Date(Math.floor(Date.now() / 1000) * 1000) },
  })
}

/**
 * Sessão do usuário atual, revalidada contra o banco.
 *
 * O token carrega papel e nome para leitura rápida no proxy, mas as telas usam
 * esta função: assim, desativar uma conta ou rebaixar um admin tem efeito
 * imediato em vez de esperar o token de 30 dias expirar.
 */
export async function getCurrentUser() {
  const store = await cookies()
  const session = await readSession(store.get(SESSION_COOKIE)?.value)
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      phone: true,
      document: true,
      emailVerifiedAt: true,
      sessionsValidFrom: true,
    },
  })

  if (!user || !user.active) return null
  // Trocar a senha empurra `sessionsValidFrom` para a frente e derruba os
  // tokens antigos, que continuariam válidos por até 30 dias.
  if (session.issuedAt * 1000 < user.sessionsValidFrom.getTime()) return null

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    phone: user.phone,
    document: user.document,
    emailVerifiedAt: user.emailVerifiedAt,
    emailVerified: user.emailVerifiedAt !== null,
  }
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar')
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) redirect('/entrar?destino=/admin')
  if (user.role !== 'ADMIN') redirect('/conta')
  return user
}
