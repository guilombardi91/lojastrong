import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// O Prisma 7 exige um driver adapter explícito no cliente.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// O hot reload do `next dev` reavalia os módulos a cada alteração; sem o cache
// global cada recarga abriria um pool de conexões novo no Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
