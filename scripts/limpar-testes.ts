// Remove as contas criadas pelo teste de fumaça e tudo que elas geraram,
// devolvendo ao estoque as unidades reservadas nos pedidos apagados.
//
//   npx tsx scripts/limpar-testes.ts
//
// Não toca no catálogo nem nos usuários do seed. Para zerar o banco inteiro,
// use `npm run db:reset` (destrutivo, pede confirmação).

import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: 'teste.' } },
    select: { id: true, email: true },
  })

  if (users.length === 0) {
    console.log('Nenhuma conta de teste encontrada.')
    return
  }

  const userIds = users.map((user) => user.id)
  const orders = await prisma.order.findMany({
    where: { userId: { in: userIds } },
    include: { items: true },
  })

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.variantId) continue
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }
  }

  // As movimentações apontam para os pedidos; apagar antes evita órfãos.
  await prisma.stockMovement.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } })
  await prisma.order.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.cart.deleteMany({ where: { userId: { in: userIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })

  console.log(`Removidas ${users.length} contas de teste e ${orders.length} pedidos.`)
  console.log('Estoque devolvido às variantes.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
