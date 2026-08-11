import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTier, getNextTier, getProgressToNextTier } from "@/lib/dna";
import {
  createClient,
  deleteClient,
  createSale,
  cancelSale,
} from "@/lib/actions";
import Nav from "@/components/Nav";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  const userId = session!.user.id;
  const userName = session!.user.name ?? "";
  const userRole = session!.user.role;

  const [clients, sales, courses] = await Promise.all([
    prisma.client.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.findMany({
      where: { sellerId: userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.coursePricing.findMany(),
  ]);

  const activeSales = sales.filter((s) => !s.cancelledAt);
  const totalSales = activeSales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalCommission = activeSales.reduce((sum, s) => sum + s.commission, 0);

  const currentTier = getCurrentTier(totalSales);
  const nextTier = getNextTier(totalSales);
  const progress = getProgressToNextTier(totalSales);

  const now = new Date();
  const monthCommission = activeSales
    .filter(
      (s) =>
        s.createdAt.getMonth() === now.getMonth() &&
        s.createdAt.getFullYear() === now.getFullYear()
    )
    .reduce((sum, s) => sum + s.commission, 0);

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {error === "cliente_tem_vendas" && (
          <div className="bg-red-900/60 border border-red-700 rounded-lg px-4 py-3 text-sm">
            Não é possível excluir esse cliente porque ele já tem vendas
            registradas no histórico (mesmo canceladas). O histórico
            financeiro precisa continuar existindo.
          </div>
        )}
        {/* Comissão + DNA */}
        <div className="grid
