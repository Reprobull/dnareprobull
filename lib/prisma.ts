import { PrismaClient } from "@prisma/client";

// Evita criar múltiplas conexões em desenvolvimento (hot reload do Next.js)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
