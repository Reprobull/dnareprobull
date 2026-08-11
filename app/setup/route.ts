import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

// Rota de configuração inicial: cria os 5 usuários e a tabela de cursos
// na primeira vez. Protegida por uma chave secreta (variável de ambiente
// SETUP_KEY) para que ninguém além de você consiga executar isso.
//
// Uso: visite, uma única vez, no navegador:
//   https://SEU-DOMINIO.vercel.app/api/setup?key=SUA_SETUP_KEY
//
// Depois da primeira execução, pode deixar como está — rodar de novo não
// duplica nada nem apaga dados (usa upsert).

const DEFAULT_PASSWORD = "reprobull2026";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");

  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) {
    return NextResponse.json(
      { error: "Chave de configuração inválida ou ausente." },
      { status: 401 }
    );
  }

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

  return NextResponse.json({
    ok: true,
    message: `Usuários e cursos configurados. Senha inicial de todos: ${DEFAULT_PASSWORD} — troque assim que possível.`,
  });
}
