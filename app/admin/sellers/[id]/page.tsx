import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { getCurrentTier, getNextTier, getProgressToNextTier } from "@/lib/dna";
import { deleteClient, cancelSale } from "@/lib/actions";

export default async function SellerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const seller = await prisma.user.findUnique({ where: { id } });
  if (!seller) notFound();

  const [clients, sales] = await Promise.all([
    prisma.client.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.findMany({
      where: { sellerId: seller.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeSales = sales.filter((s) => !s.cancelledAt);
  const totalSales = activeSales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalCommission = activeSales.reduce((sum, s) => sum + s.commission, 0);
  const currentTier = getCurrentTier(totalSales);
  const nextTier = getNextTier(totalSales);
  const progress = getProgressToNextTier(totalSales);

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
        <div>
          <p className="text-xs text-[#6FA8E0] font-bold tracking-wider">
            PERFIL DO VENDEDOR
          </p>
          <h1 className="text-2xl font-bold">{seller.name}</h1>
          <p className="text-sm text-gray-400">{seller.email}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#123A63] rounded-xl p-6">
            <p className="text-[#6FA8E0] text-xs font-bold tracking-wider mb-2">
              COMISSÃO ACUMULADA
            </p>
            <p className="text-4xl font-bold">
              R$ {totalCommission.toLocaleString("pt-BR")}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Vendas brutas: R$ {totalSales.toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="bg-[#123A63] rounded-xl p-6">
            <p className="text-[#6FA8E0] text-xs font-bold tracking-wider mb-2">
              🧬 DNA ATUAL
            </p>
            <p className="text-2xl font-bold">
              {currentTier ? `DNA ${currentTier.level} — ${currentTier.name}` : "Sem DNA ativo"}
            </p>
            <div className="w-full bg-[#0A1F38] rounded-full h-2.5 mt-4">
              <div
                className="bg-[#0055B2] h-2.5 rounded-full"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            {nextTier && (
              <p className="text-xs text-gray-400 mt-2">
                Faltam R$ {(nextTier.threshold - totalSales).toLocaleString("pt-BR")}{" "}
                para DNA {nextTier.level} — {nextTier.name}
              </p>
            )}
          </div>
        </div>

        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Clientes ({clients.length})</h2>
          <div className="space-y-2">
            {clients.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhum cliente cadastrado.</p>
            )}
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-semibold">{c.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {c.course} · {c.monthYear} · {c.phone}
                  </p>
                </div>
                <form action={deleteClient.bind(null, c.id, `/admin/sellers/${id}`)}>
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300 text-sm font-semibold"
                  >
                    Excluir
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Histórico de vendas ({sales.length})</h2>
          <div className="space-y-2">
            {sales.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhuma venda registrada.</p>
            )}
            {sales.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {s.client.fullName} — {s.course}
                    {s.cancelledAt && (
                      <span className="text-red-400 text-xs ml-2">CANCELADA</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    Valor: R$ {s.saleValue.toLocaleString("pt-BR")} · Comissão: R${" "}
                    {s.commission.toLocaleString("pt-BR")}
                  </p>
                </div>
                {!s.cancelledAt && (
                  <form action={cancelSale.bind(null, s.id)}>
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-300 text-sm font-semibold"
                    >
                      Cancelar venda
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
