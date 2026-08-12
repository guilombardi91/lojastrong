import { prisma } from './prisma'
import { sendMail } from './mailer'

export type StockAlertResult = { ok: boolean; message: string }

/** Inscreve um e-mail para ser avisado quando a variante voltar ao estoque. */
export async function subscribeStockAlert(
  variantId: string,
  email: string,
  userId?: string,
): Promise<StockAlertResult> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { active: true, stock: true },
  })

  if (!variant || !variant.active) {
    return { ok: false, message: 'Item não encontrado.' }
  }
  if (variant.stock > 0) {
    return { ok: false, message: 'Este item já está disponível.' }
  }

  await prisma.stockAlert.upsert({
    where: { variantId_email: { variantId, email } },
    // Reassinar depois de já ter sido avisado (o item esgotou de novo) reabre
    // o alerta em vez de ficar preso como "já notificado" para sempre.
    update: { notifiedAt: null, userId: userId ?? undefined },
    create: { variantId, email, userId },
  })

  return { ok: true, message: 'Pronto! Avisamos por e-mail assim que chegar.' }
}

/**
 * Dispara o aviso para quem está esperando esta variante e marca como
 * notificado. Chamado pelas ações de admin que alteram estoque, no momento em
 * que detectam a transição de zero para disponível — não há job agendado.
 */
export async function notifyStockAlerts(variantId: string): Promise<void> {
  const pending = await prisma.stockAlert.findMany({
    where: { variantId, notifiedAt: null },
    include: { variant: { include: { product: true } } },
  })
  if (pending.length === 0) return

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  for (const alert of pending) {
    const { product } = alert.variant
    const label = [alert.variant.size, alert.variant.color].filter(Boolean).join(' · ')
    const url = `${siteUrl}/produtos/${product.slug}`

    await sendMail({
      to: alert.email,
      subject: `${product.name} voltou ao estoque`,
      text: `${product.name}${label ? ` (${label})` : ''} está disponível de novo: ${url}`,
      html: `<p><strong>${product.name}</strong>${label ? ` (${label})` : ''} está disponível de novo.</p><p><a href="${url}">Ver produto</a></p>`,
    })
  }

  await prisma.stockAlert.updateMany({
    where: { id: { in: pending.map((alert) => alert.id) } },
    data: { notifiedAt: new Date() },
  })
}

/** Quantidade de alertas pendentes por variante, para a tela de estoque. */
export async function pendingAlertCounts(variantIds: string[]): Promise<Record<string, number>> {
  if (variantIds.length === 0) return {}

  const rows = await prisma.stockAlert.groupBy({
    by: ['variantId'],
    where: { variantId: { in: variantIds }, notifiedAt: null },
    _count: { _all: true },
  })

  return Object.fromEntries(rows.map((row) => [row.variantId, row._count._all]))
}
