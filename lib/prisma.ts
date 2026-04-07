import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// For Prisma 7+ when url is not in schema.prisma
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: ['query'],
  } as any)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
