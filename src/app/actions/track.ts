'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ensureVisitorId } from '@/lib/visitor'

/** Registra uma visita à página de um produto para o relatório de visitas. */
export async function trackProductViewAction(productId: string): Promise<void> {
  const [visitorId, user] = await Promise.all([ensureVisitorId(), getCurrentUser()])
  await prisma.productView.create({ data: { productId, visitorId, userId: user?.id } })
}
