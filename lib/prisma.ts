import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Evita criar múltiplas conexões em desenvolvimento (hot reload do Next.js)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// A partir do Prisma 7, é obrigatório passar um "adapter" explícito —
// o Prisma Client não lê mais a variável DATABASE_URL sozinho em tempo de execução.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
