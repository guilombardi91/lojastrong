import { cookies } from 'next/headers'
import { CONSENT_COOKIE, VISITOR_COOKIE } from './session'

// Consentimento para os cookies não essenciais — hoje, apenas o identificador
// de visitante que alimenta o relatório de conversão (ver src/lib/visitor.ts).
//
// A regra aqui é opt-in: enquanto a pessoa não decide, nada é gravado. É mais
// restritivo do que "rastreia até recusar", e é o que faz o banner valer
// alguma coisa — banner que só registra a escolha e continua rastreando é
// enfeite, e ainda documenta por escrito que a loja ignora a recusa.

export type Consent = 'aceito' | 'recusado'

const CONSENT_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  // Seis meses: tempo suficiente para não incomodar, curto o bastante para a
  // escolha ser revista de tempos em tempos.
  maxAge: 60 * 60 * 24 * 180,
}

/** Escolha atual, ou null enquanto ninguém decidiu (é quando o banner aparece). */
export async function readConsent(): Promise<Consent | null> {
  const store = await cookies()
  const value = store.get(CONSENT_COOKIE)?.value
  return value === 'aceito' || value === 'recusado' ? value : null
}

/** Atalho para os pontos de rastreio: só grava quem aceitou explicitamente. */
export async function trackingAllowed(): Promise<boolean> {
  return (await readConsent()) === 'aceito'
}

/**
 * Grava a escolha. Recusar não é só deixar de gravar daqui para a frente:
 * apaga o identificador de visitante que já esteja no navegador, senão a
 * recusa valeria apenas para quem nunca tinha navegado antes.
 */
export async function writeConsent(consent: Consent): Promise<void> {
  const store = await cookies()
  store.set(CONSENT_COOKIE, consent, CONSENT_COOKIE_OPTIONS)

  if (consent === 'recusado') {
    store.delete(VISITOR_COOKIE)
  }
}
