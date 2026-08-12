'use server'

import { getCurrentUser } from '@/lib/auth'
import { emailSchema } from '@/lib/validation'
import { subscribeStockAlert, type StockAlertResult } from '@/lib/stock-alerts'

export type { StockAlertResult }

export async function subscribeStockAlertAction(
  variantId: string,
  email: string,
): Promise<StockAlertResult> {
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message }

  const user = await getCurrentUser()
  return subscribeStockAlert(variantId, parsed.data, user?.id)
}
