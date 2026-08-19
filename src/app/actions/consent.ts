'use server'

import { revalidatePath } from 'next/cache'
import { writeConsent, type Consent } from '@/lib/consent'

/**
 * Grava a escolha do visitante sobre os cookies não essenciais.
 *
 * O `revalidatePath` de layout existe porque o banner é renderizado no
 * servidor a partir do cookie: sem invalidar, a decisão só apareceria na
 * próxima navegação completa.
 */
export async function setConsentAction(consent: Consent): Promise<void> {
  await writeConsent(consent)
  revalidatePath('/', 'layout')
}
