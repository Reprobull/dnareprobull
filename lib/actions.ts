"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

const DEFAULT_NEW_USER_PASSWORD = "reprobull2026";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Não autenticado.");
  return session.user;
}

// ---------- CLIENTES ----------

// Cadastro rápido: só nome e telefone.
export async function createClient(formData: FormData) {
  const user = await requireUser();

  await prisma.client.create({
    data: {
      sellerId: user.id,
      fullName: String(formData.get("fullName")),
      phone: String(formData.get("phone")),
    },
  });

  revalidatePath("/dashboard");
}

// Completa a ficha de inscrição ReproBull, quando o cliente está fechando negócio.
export async function completeClientProfile(clientId: string, formData: FormData) {
  const user = await requireUser();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Cliente não encontrado.");
  if (client.sellerId !== user.id && user.role !== "ADMIN") {
    throw new Error("Sem permissão para editar este cliente.");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      fullName: String(formData.get("fullName")),
      phone: String(formData.get("phone")),
      email: String(formData.get("email")),
      document: String(formData.get("document")),
      birthDate: formData.get("birthDate")
        ? new Date(String(formData.get("birthDate")))
        : null,
      address: (formData.get("address") as string) || null,
      neighborhood: (formData.get("neighborhood") as string) || null,
      zipCode: (formData.get("zipCode") as string) || null,
      cityState: (formData.get("cityState") as string) || null,
    },
  });

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/dashboard");
}

export async function updateClientStatus(clientId: string, status: string) {
  const user = await requireUser();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Cliente não encontrado.");
  if (client.sellerId !== user.id && user.role !== "ADMIN") {
    throw new Error("Sem permissão para editar este cliente.");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      status: status as
        | "INICIANDO"
        | "INTERMEDIARIO"
        | "FECHANDO"
        | "VENDA_CONCLUIDA",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath("/overview");
}

export async function deleteClient(clientId: string, returnTo: string) {
  const user = await requireUser();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { sales: true },
  });
  if (!client) throw new Error("Cliente não encontrado.");
  if (client.sellerId !== user.id && user.role !== "ADMIN") {
    throw new Error("Sem permissão para excluir este cliente.");
  }

  if (client.sales.length > 0) {
    // Não deixa excluir um cliente que já tem vendas vinculadas a ele —
    // isso quebraria o histórico financeiro. Exclua as vendas primeiro.
    redirect(`${returnTo}?error=cliente_tem_vendas`);
  }

  await prisma.client.delete({ where: { id: clientId } });
  revalidatePath(returnTo);
}

// ---------- VENDAS ----------

export async function createSale(formData: FormData) {
  const user = await requireUser();

  const clientId = String(formData.get("clientId"));
  const course = String(formData.get("course"));
  const monthYear = String(formData.get("monthYear"));
  const entryPayment = String(formData.get("entryPayment")) as
    | "PIX"
    | "CARTAO";
  const remainderPayment = String(formData.get("remainderPayment")) as
    | "PIX"
    | "CARTAO_PARCELADO"
    | "BOLETO_PARCELADO";
  const installments = formData.get("installments")
    ? Number(formData.get("installments"))
    : null;
  const boletoDueDay = formData.get("boletoDueDay")
    ? Number(formData.get("boletoDueDay"))
    : null;

  // Comissão SEMPRE calculada a partir da tabela de preços do curso.
  // Nunca aceitar um valor de comissão vindo do formulário.
  const pricing = await prisma.coursePricing.findUnique({
    where: { courseName: course },
  });
  if (!pricing) {
    throw new Error(
      "Este curso ainda não tem preço/comissão configurados. Peça ao admin para cadastrar em Admin > Cursos."
    );
  }

  await prisma.sale.create({
    data: {
      clientId,
      sellerId: user.id,
      course,
      monthYear,
      saleValue: pricing.price,
      commission: pricing.commission,
      entryPayment,
      remainderPayment,
      installments,
      boletoDueDay,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/overview");
  revalidatePath(`/dashboard/clients/${clientId}`);
}

// Exclusão de verdade — some do histórico. A comissão, o total e o DNA são
// recalculados automaticamente, porque todos são somados a partir das vendas
// que ainda existem no banco (nunca guardados como número fixo em algum lugar).
export async function deleteSale(saleId: string) {
  const user = await requireUser();

  const sale = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!sale) throw new Error("Venda não encontrada.");
  if (sale.sellerId !== user.id && user.role !== "ADMIN") {
    throw new Error("Sem permissão para excluir esta venda.");
  }

  await prisma.sale.delete({ where: { id: saleId } });

  revalidatePath("/dashboard");
  revalidatePath("/overview");
  revalidatePath(`/dashboard/clients/${sale.clientId}`);
}

// ---------- ADMIN ----------

export async function resetSalesHistory() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Apenas o administrador pode zerar o histórico.");
  }

  // Zera vendas (histórico, comissão, progresso de DNA), mas mantém clientes cadastrados.
  await prisma.sale.deleteMany({});

  revalidatePath("/dashboard");
  revalidatePath("/overview");
  revalidatePath("/admin");
}

export async function upsertCoursePricing(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Apenas o administrador pode configurar preços de curso.");
  }

  const courseName = String(formData.get("courseName"));
  const price = Number(formData.get("price"));
  const commission = Number(formData.get("commission"));

  await prisma.coursePricing.upsert({
    where: { courseName },
    update: { price, commission },
    create: { courseName, price, commission },
  });

  revalidatePath("/admin");
}

export async function createSeller(formData: FormData) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Apenas o administrador pode cadastrar novos vendedores.");
  }

  const name = String(formData.get("name"));
  const email = String(formData.get("email")).toLowerCase().trim();
  const role = String(formData.get("role")) === "ADMIN" ? "ADMIN" : "SELLER";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Já existe um usuário com esse e-mail.");
  }

  const passwordHash = await bcrypt.hash(DEFAULT_NEW_USER_PASSWORD, 10);

  await prisma.user.create({
    data: { name, email, role, passwordHash },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/sellers");
  revalidatePath("/overview");
}

export async function removeSeller(sellerId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Apenas o administrador pode remover vendedores.");
  }
  if (sellerId === user.id) {
    throw new Error("Você não pode remover a si mesmo.");
  }

  // Não apaga o histórico de vendas/clientes do vendedor removido — apenas
  // impede o login. Preserva os dados para auditoria e para o ranking histórico.
  await prisma.user.update({
    where: { id: sellerId },
    data: { passwordHash: "REMOVIDO" },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/sellers");
  revalidatePath("/overview");
}
