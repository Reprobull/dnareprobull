import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTier, getNextTier, getProgressToNextTier } from "@/lib/dna";
import { createClient, deleteClient, deleteSale } from "@/lib/actions";
import { inputClass } from "@/lib/styles";
import Nav from "@/components/Nav";
import Link from "next/link";

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

  const [clients, sales] = await Promise.all([
    prisma.client.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sale.findMany({
      where: { sellerId: userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalSales = sales.reduce((sum, s) => sum + s.saleValue, 0);
  const totalCommission = sales.reduce((sum, s) => sum + s.commission, 0);

  const currentTier = getCurrentTier(totalSales);
  const nextTier = getNextTier(totalSales);
  const progress = getProgressToNextTier(totalSales);

  const now = new Date();
  const monthCommission = sales
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
            registradas. Exclua as vendas dele primeiro, se necessário.
          </div>
        )}

        {/* Comissão + DNA */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[#123A63] rounded-xl p-6">
            <p className="text-[#6FA8E0] text-xs font-bold tracking-wider mb-2">
              SUA COMISSÃO
            </p>
            <p className="text-4xl font-bold">
              R$ {monthCommission.toLocaleString("pt-BR")}
            </p>
            <p className="text-sm text-gray-300 mt-1">já faturado este mês</p>
            <hr className="border-[#1E4E85] my-3" />
            <p className="text-sm text-gray-300">
              Acumulado no ano:{" "}
              <span className="font-bold text-white">
                R$ {totalCommission.toLocaleString("pt-BR")}
              </span>
            </p>
          </div>

          <div className="bg-[#123A63] rounded-xl p-6">
            <p className="text-[#6FA8E0] text-xs font-bold tracking-wider mb-2">
              🧬 SEU DNA
            </p>
            <p className="text-2xl font-bold">
              {currentTier
                ? `DNA ${currentTier.level} — ${currentTier.name}`
                : "Ainda sem DNA ativo"}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Vendas brutas acumuladas: R$ {totalSales.toLocaleString("pt-BR")}
            </p>
            <div className="w-full bg-[#0A1F38] rounded-full h-2.5 mt-4">
              <div
                className="bg-[#0055B2] h-2.5 rounded-full transition-all"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            {nextTier ? (
              <p className="text-xs text-gray-400 mt-2">
                Faltam R${" "}
                {(nextTier.threshold - totalSales).toLocaleString("pt-BR")}{" "}
                para ativar DNA {nextTier.level} — {nextTier.name}
              </p>
            ) : (
              <p className="text-xs text-[#6FA8E0] mt-2">
                Você chegou ao topo do Programa DNA ReproBull. 🏆
              </p>
            )}
          </div>
        </div>

        {/* Cadastro rápido de cliente */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">+ Cadastrar cliente</h2>
          <form action={createClient} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                Nome
              </label>
              <input name="fullName" required className={inputClass} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                Telefone
              </label>
              <input name="phone" required className={inputClass} />
            </div>
            <button
              type="submit"
              className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition"
            >
              Cadastrar
            </button>
          </form>
        </section>

        {/* Lista de clientes */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Meus clientes</h2>
          <div className="space-y-2">
            {clients.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhum cliente cadastrado ainda.</p>
            )}
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
              >
                <Link href={`/dashboard/clients/${c.id}`} className="flex-1">
                  <p className="font-semibold hover:text-[#6FA8E0] transition">
                    {c.fullName}
                  </p>
                  <p className="text-xs text-gray-400">{c.phone}</p>
                </Link>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <form action={deleteClient.bind(null, c.id, "/dashboard")}>
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-300 text-sm font-semibold"
                    >
                      Excluir
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Histórico de vendas */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Histórico de vendas</h2>
          <div className="space-y-2">
            {sales.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhuma venda registrada ainda.</p>
            )}
            {sales.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
              >
                <Link href={`/dashboard/clients/${s.clientId}`} className="flex-1">
                  <p className="font-semibold hover:text-[#6FA8E0] transition">
                    {s.client.fullName} — {s.course}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.monthYear} · R$ {s.saleValue.toLocaleString("pt-BR")} ·
                    comissão R$ {s.commission.toLocaleString("pt-BR")}
                  </p>
                </Link>
                <form action={deleteSale.bind(null, s.id)}>
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300 text-sm font-semibold"
                  >
                    Excluir venda
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    INICIANDO: "bg-yellow-600",
    INTERMEDIARIO: "bg-orange-600",
    FECHANDO: "bg-blue-600",
    VENDA_CONCLUIDA: "bg-green-600",
  };
  const labelMap: Record<string, string> = {
    INICIANDO: "Iniciando",
    INTERMEDIARIO: "Intermediário",
    FECHANDO: "Fechando",
    VENDA_CONCLUIDA: "Venda Concluída",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${map[status] || "bg-gray-600"}`}
    >
      {labelMap[status] || status}
    </span>
  );
}
