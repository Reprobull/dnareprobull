import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import { getCurrentTier } from "@/lib/dna";
import { removeSeller, reactivateSeller, deleteSeller } from "@/lib/actions";

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const sellers = await prisma.user.findMany({
    include: { sales: true, clients: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {error === "vendedor_tem_dados" && (
          <div className="bg-red-900/60 border border-red-700 rounded-lg px-4 py-3 text-sm">
            Não é possível excluir esse vendedor porque ele já tem clientes ou
            vendas registradas. Use &quot;Remover acesso&quot; para bloquear o
            login dele sem perder o histórico.
          </div>
        )}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Time de vendas</h1>
          <Link
            href="/admin/sellers/new"
            className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-4 py-2 rounded-lg transition text-sm"
          >
            + Adicionar vendedor
          </Link>
        </div>

        <div className="space-y-2">
          {sellers.map((s) => {
            const total = s.sales.reduce((sum, sale) => sum + sale.saleValue, 0);
            const tier = getCurrentTier(total);
            const removed = s.passwordHash === "REMOVIDO";
            const hasData = s.sales.length > 0 || s.clients.length > 0;

            return (
              <div
                key={s.id}
                className="flex items-center justify-between bg-[#123A63] rounded-xl p-4"
              >
                <Link href={`/admin/sellers/${s.id}`} className="flex-1">
                  <p className="font-semibold hover:text-[#6FA8E0] transition">
                    {s.name}{" "}
                    {s.role === "ADMIN" && (
                      <span className="text-xs text-[#6FA8E0]">(admin)</span>
                    )}
                    {removed && (
                      <span className="text-xs text-red-400 ml-2">acesso removido</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.email} · R$ {total.toLocaleString("pt-BR")} vendidos
                    {tier && ` · 🧬 DNA ${tier.level} — ${tier.name}`}
                  </p>
                </Link>
                {s.role !== "ADMIN" && (
                  <div className="flex items-center gap-3">
                    <form
                      action={
                        removed
                          ? reactivateSeller.bind(null, s.id)
                          : removeSeller.bind(null, s.id)
                      }
                    >
                      <button
                        type="submit"
                        className={`text-xs font-semibold ${
                          removed
                            ? "text-[#6FA8E0] hover:text-white"
                            : "text-red-400 hover:text-red-300"
                        }`}
                      >
                        {removed ? "Reativar acesso" : "Remover acesso"}
                      </button>
                    </form>
                    {!hasData && (
                      <form action={deleteSeller.bind(null, s.id)}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-red-400 hover:text-red-300"
                        >
                          Excluir
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
