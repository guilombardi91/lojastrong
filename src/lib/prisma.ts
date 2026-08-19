import { PrismaClient } from '@prisma/client'
//import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'

// O Prisma 7 exige um driver adapter explícito no cliente.
//
// Para migrar a loja para PostgreSQL:
//   1. npm install @prisma/adapter-pg pg
//   2. troque o bloco abaixo por:
//        import { PrismaPg } from '@prisma/adapter-pg'
//        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
//   3. em prisma/schema.prisma, troque provider = "sqlite" por "postgresql"
//   4. npx prisma migrate dev --name postgres
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// O hot reload do `next dev` reavalia os módulos a cada alteração; sem o cache
// global cada recarga abriria uma nova conexão.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
