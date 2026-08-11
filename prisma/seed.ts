import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// SENHA PADRÃO INICIAL para todos: "reprobull2026"
// Troque a senha de cada um assim que possível (ainda não há tela de troca de senha
// nesta primeira versão — pode ser pedido como próximo passo).
const DEFAULT_PASSWORD = "reprobull2026";

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const users = [
    { name: "Marcos Guerra", email: "marcosguerra@reprobull.com", role: "ADMIN" as const },
    { name: "Ludimila Cardoso", email: "ludimila@reprobull.com", role: "SELLER" as const },
    { name: "Aline Marques", email: "aline@reprobull.com", role: "SELLER" as const },
    { name: "Julia Fausto", email: "julia@reprobull.com", role: "SELLER" as const },
    { name: "Igor Costa", email: "igor@reprobull.com", role: "SELLER" as const },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }

  const courses = [
    { courseName: "Dominando a Estação de Monta", price: 3500, commission: 300 },
    { courseName: "Imersão Muito Mais que Veterinária", price: 189, commission: 0 },
    { courseName: "Power Vet", price: 0, commission: 0 },
    { courseName: "Transferência de Embriões", price: 0, commission: 0 },
  ];

  for (const c of courses) {
    await prisma.coursePricing.upsert({
      where: { courseName: c.courseName },
      update: {},
      create: c,
    });
  }

  console.log("Seed concluído.");
  console.log("Usuários criados com a senha padrão:", DEFAULT_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
