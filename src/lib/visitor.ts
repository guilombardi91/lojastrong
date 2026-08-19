import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { trackingAllowed } from './consent'
import { VISITOR_COOKIE } from './session'

// Identificador anônimo de navegador, sem nenhum dado pessoal — mesmo
// princípio do cookie de carrinho (ver src/lib/cart.ts): um token aleatório
// que só serve para contar "quantos visitantes diferentes" e ligar uma visita
// a uma compra posterior no relatório administrativo.

const VISITOR_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 365,
}

/** Lê o visitante atual sem criar nada. Seguro durante o render. */
export async function readVisitorId(): Promise<string | null> {
  const store = await cookies()
  return store.get(VISITOR_COOKIE)?.value ?? null
}

/**
 * Devolve o id do visitante, criando um se necessário.
 *
 * Escreve cookie, então só pode ser chamada de Server Action ou Route
 * Handler — mesma restrição de `ensureCart`.
 *
 * Devolve null para quem não consentiu com os cookies não essenciais. A
 * checagem fica aqui, e não só em quem chama, para que nenhum uso futuro
 * volte a criar o identificador sem passar pelo consentimento.
 */
export async function ensureVisitorId(): Promise<string | null> {
  const store = await cookies()
  const existing = store.get(VISITOR_COOKIE)?.value
  if (existing) return existing

  if (!(await trackingAllowed())) return null

  const id = randomUUID()
  store.set(VISITOR_COOKIE, id, VISITOR_COOKIE_OPTIONS)
  return id
}
