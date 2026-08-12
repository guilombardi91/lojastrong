import { SignJWT, jwtVerify } from 'jose'
import type { Role } from './enums'

// Só assinatura e leitura de token: este módulo não toca no banco nem em
// bcrypt, então continua utilizável no proxy (runtime edge).

export const SESSION_COOKIE = 'sbs_session'
export const CART_COOKIE = 'sbs_cart'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 dias

export type SessionPayload = {
  userId: string
  role: Role
  email: string
  name: string
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET ausente ou muito curto. Defina uma chave de ao menos 32 caracteres no .env.',
    )
  }
  return new TextEncoder().encode(secret)
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function readSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey())
    return {
      userId: String(payload.userId),
      role: payload.role as Role,
      email: String(payload.email),
      name: String(payload.name),
    }
  } catch {
    // Token expirado, adulterado ou assinado com outra chave: sessão inválida.
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MAX_AGE_SECONDS,
}
