'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { trackingAllowed } from '@/lib/consent'
import { ensureVisitorId } from '@/lib/visitor'

/**
 * Registra uma visita à página de um produto para o relatório de visitas.
 *
 * Sem consentimento não grava nada e nem cria o cookie de visitante. Esta é a
 * barreira que importa: é uma Server Action, ou seja, um endpoint POST público
 * — checar só no componente que a chama deixaria a porta aberta.
 */
export async function trackProductViewAction(productId: string): Promise<void> {
  if (!(await trackingAllowed())) return

  const [visitorId, user] = await Promise.all([ensureVisitorId(), getCurrentUser()])
  // Null aqui significa consentimento ausente ou revogado entre a checagem
  // acima e agora; ProductView.visitorId é obrigatório, então não há o que
  // gravar sem identificador.
  if (!visitorId) return

  await prisma.productView.create({ data: { productId, visitorId, userId: user?.id } })
}
