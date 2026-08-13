import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DNA_TIERS, getCurrentTier, getNextTier } from "@/lib/dna";
import Nav from "@/components/Nav";
import Link from "next/link";

export default async function OverviewPage() {
  const session = await auth();
  const userName = session!.user.name ?? "";
  const userRole = session!.user.role;

  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    include: { sales: true },
  });

  const leaderboard = sellers
    .map((s) => {
      const total = s.sales.reduce((sum, sale) => sum + sale.saleValue, 0);
      return {
        id: s.id,
        name: s.name,
        total,
        tier: getCurrentTier(total),
        next: getNextTier(total),
      };
    })
    .sort((a, b) => b.total - a.total);

  const editions = await prisma.courseEdition.findMany({
    include: { coursePricing: true, sales: true },
    orderBy: { createdAt: "desc" },
  });

  // Meta dupla: se existir uma edição de Setembro do Dominando e uma edição
  // de Novembro da Imersão, e as duas estiverem esgotadas, o time ganha o
  // bônus. Se essas edições ainda não existirem, o aviso simplesmente não some.
  const dominandoSetembro = editions.find(
    (e) =>
      e.coursePricing.courseName === "Dominando a Estação de Monta" &&
      e.monthYear.toLowerCase().includes("setembro")
  );
  const imersaoNovembro = editions.find(
    (e) =>
      e.coursePricing.courseName === "Imersão Muito Mais que Veterinária" &&
      e.monthYear.toLowerCase().includes("novembro")
  );
  const metaDuplaAtingida =
    dominandoSetembro &&
    imersaoNovembro &&
    dominandoSetembro.sales.length >= dominandoSetembro.totalSeats &&
    imersaoNovembro.sales.length >= imersaoNovembro.totalSeats;

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Contadores de vagas por edição */}
        {editions.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4">Vagas por turma</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {editions.map((e) => (
                <SeatCounter
                  key={e.id}
                  title={`${e.coursePricing.courseName} — ${e.monthYear}`}
                  sold={e.sales.length}
                  total={e.totalSeats}
                />
              ))}
            </div>
          </section>
        )}

        {/* Meta dupla */}
        {dominandoSetembro && imersaoNovembro && (
          <div
            className={`rounded-xl p-6 ${
              metaDuplaAtingida ? "bg-[#0055B2]" : "bg-[#123A63]"
            }`}
          >
            <p className="text-xs font-bold tracking-wider text-[#6FA8E0] mb-1">
              META DUPLA
            </p>
            {metaDuplaAtingida ? (
              <p className="font-bold">
                🎉 As duas campanhas esgotaram! O time ganhou o curso particular
                de Exame Ginecológico e Diagnóstico de Gestação, com certificado.
              </p>
            ) : (
              <p className="text-sm text-gray-300">
                Esgotando o Dominando de setembro e a Imersão de novembro, o
                time inteiro ganha um curso particular gratuito, com
                certificado.
              </p>
            )}
          </div>
        )}

        {/* Ranking */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Ranking do time</h2>
          <div className="space-y-2">
            {leaderboard.map((s, i) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-bold w-5">{i + 1}</span>
                  <div>
                    {userRole === "ADMIN" ? (
                      <Link
                        href={`/admin/sellers/${s.id}`}
                        className="font-semibold hover:text-[#6FA8E0] transition"
                      >
                        {s.name}
                      </Link>
                    ) : (
                      <p className="font-semibold">{s.name}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {s.tier ? `🧬 DNA ${s.tier.level} — ${s.tier.name}` : "Sem DNA ativo ainda"}
                      {s.next &&
                        ` · faltam R$ ${(s.next.threshold - s.total).toLocaleString("pt-BR")} para o próximo DNA`}
                    </p>
                  </div>
                </div>
                <p className="font-bold">R$ {s.total.toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trilha de DNA */}
        <section>
          <h2 className="text-lg font-bold mb-4">A jornada DNA ReproBull</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {DNA_TIERS.map((tier) => (
              <div
                key={tier.level}
                className="bg-[#123A63] rounded-xl p-4"
                style={{
                  background: `linear-gradient(135deg, #123A63, #0A1F38)`,
                }}
              >
                <p className="text-xs font-bold text-[#6FA8E0] mb-1">
                  🧬 DNA {tier.level}
                </p>
                <p className="font-bold">{tier.name}</p>
                <p className="text-xl font-bold mt-1">
                  R$ {tier.threshold.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-gray-400 mt-2">{tier.description}</p>
                <p className="text-xs text-[#6FA8E0] italic mt-2">{tier.prize}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SeatCounter({
  title,
  sold,
  total,
}: {
  title: string;
  sold: number;
  total: number;
}) {
  const remaining = Math.max(0, total - sold);
  return (
    <div className="bg-[#123A63] rounded-xl p-6 text-center">
      <p className="text-xs font-bold text-[#6FA8E0] tracking-wider mb-1">
        {title.toUpperCase()}
      </p>
      <p className="text-3xl font-bold">{remaining}</p>
      <p className="text-xs text-gray-400 mt-1">
        vagas restantes de {total} ({sold} vendidas)
      </p>
    </div>
  );
}
