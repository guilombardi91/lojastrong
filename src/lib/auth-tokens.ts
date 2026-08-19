import { createHash, randomBytes } from 'node:crypto'
import { prisma } from './prisma'
import type { AuthTokenType } from './enums'

// Confirmação de e-mail e redefinição de senha usam o mesmo mecanismo: um
// segredo aleatório que viaja só dentro do e-mail, e do qual o banco guarda
// apenas o hash. Quem lê o banco não consegue montar o link.

const TTL_MINUTES: Record<AuthTokenType, number> = {
  // Um dia é folgado para quem só vai abrir o e-mail à noite.
  EMAIL_VERIFICATION: 60 * 24,
  // Redefinição é uma janela de risco: quanto menor, melhor.
  PASSWORD_RESET: 60,
}

function digest(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/**
 * Emite um token novo e invalida os anteriores do mesmo tipo.
 *
 * Invalidar os antigos é o que impede que um link pedido semanas atrás — e
 * possivelmente vazado — continue valendo depois de o cliente pedir outro.
 *
 * Devolve o valor cru, que só deve ser usado para montar o link do e-mail.
 */
export async function issueAuthToken(userId: string, type: AuthTokenType): Promise<string> {
  const rawToken = randomBytes(32).toString('base64url')

  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: digest(rawToken),
        expiresAt: new Date(Date.now() + TTL_MINUTES[type] * 60_000),
      },
    }),
  ])

  return rawToken
}

export type ConsumedToken = { ok: true; userId: string } | { ok: false; reason: 'invalid' | 'expired' }

/**
 * Valida o token e o marca como usado na mesma operação.
 *
 * O `updateMany` com `usedAt: null` no filtro é o que garante uso único: dois
 * cliques simultâneos no mesmo link disputam a mesma linha, e só um vê
 * `count === 1`.
 */
export async function consumeAuthToken(
  rawToken: string,
  type: AuthTokenType,
): Promise<ConsumedToken> {
  const record = await prisma.authToken.findUnique({
    where: { tokenHash: digest(rawToken) },
    select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true },
  })

  if (!record || record.type !== type || record.usedAt) return { ok: false, reason: 'invalid' }
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' }

  const claimed = await prisma.authToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  })
  if (claimed.count !== 1) return { ok: false, reason: 'invalid' }

  return { ok: true, userId: record.userId }
}

/** Descarta tokens vencidos. Chamado junto das emissões, sem job agendado. */
export async function purgeExpiredTokens(): Promise<void> {
  await prisma.authToken.deleteMany({ where: { expiresAt: { lt: new Date() } } })
}
