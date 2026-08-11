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

export default async function DashboardPage() {
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

        {/* Cadastro de cliente */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Cadastrar cliente</h2>
          <form action={createClient} className="grid md:grid-cols-2 gap-3">
            <Field name="course" label="Curso que irá fazer" required />
            <Field name="monthYear" label="Mês/Ano" placeholder="Ex: Setembro/2026" required />
            <Field name="fullName" label="Nome completo" required />
            <Field name="email" label="E-mail" type="email" required />
            <Field name="document" label="CPF/CNPJ" required />
            <Field name="birthDate" label="Data de nascimento" type="date" />
            <Field name="phone" label="Celular" required />
            <Field name="address" label="Endereço" />
            <Field name="neighborhood" label="Bairro" />
            <Field name="zipCode" label="CEP" />
            <Field name="cityState" label="Cidade/Estado" />

            <div>
              <Label>Entrada</Label>
              <select name="entryPayment" required className={selectClass}>
                <option value="PIX">Pix</option>
                <option value="CARTAO">Cartão</option>
              </select>
            </div>
            <div>
              <Label>Restante</Label>
              <select name="remainderPayment" required className={selectClass}>
                <option value="PIX">Pix</option>
                <option value="CARTAO_PARCELADO">Parcelado no cartão</option>
                <option value="BOLETO_PARCELADO">Parcelado no boleto</option>
              </select>
            </div>
            <Field name="installments" label="Quantas vezes (se parcelado)" type="number" />
            <Field name="boletoDueDay" label="Dia do vencimento (se boleto)" type="number" />

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition"
              >
                Cadastrar cliente
              </button>
            </div>
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
                <div>
                  <p className="font-semibold">{c.fullName}</p>
                  <p className="text-xs text-gray-400">
                    {c.course} · {c.monthYear} · {c.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <form action={deleteClient.bind(null, c.id)}>
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

        {/* Registrar venda */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">Registrar venda</h2>
          {clients.length === 0 ? (
            <p className="text-gray-400 text-sm">
              Cadastre um cliente primeiro para poder registrar uma venda.
            </p>
          ) : (
            <form action={createSale} className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Cliente</Label>
                <select name="clientId" required className={selectClass}>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Curso vendido</Label>
                <select name="course" required className={selectClass}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.courseName}>
                      {c.courseName} (R$ {c.price.toLocaleString("pt-BR")} · comissão R${" "}
                      {c.commission.toLocaleString("pt-BR")})
                    </option>
                  ))}
                </select>
              </div>
              <Field
                name="paymentMethod"
                label="Forma de pagamento (resumo)"
                placeholder="Ex: Pix à vista, Cartão 6x, Boleto 10x"
                required
              />
              <div className="md:col-span-2">
                <p className="text-xs text-gray-400 mb-2">
                  A comissão é calculada automaticamente com base no curso selecionado —
                  não é possível digitar um valor manual.
                </p>
                <button
                  type="submit"
                  className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition"
                >
                  Registrar venda
                </button>
              </div>
            </form>
          )}
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
                className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                  s.cancelledAt ? "bg-[#0A1F38] opacity-50" : "bg-[#0A1F38]"
                }`}
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
                    {s.commission.toLocaleString("pt-BR")} · {s.paymentMethod}
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

const selectClass =
  "w-full rounded-lg px-3 py-2 bg-[#0A1F38] text-white border border-[#1E4E85] focus:outline-none focus:border-[#0055B2]";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
      {children}
    </label>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={selectClass}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    INICIANDO: "bg-yellow-600",
    INTERMEDIARIO: "bg-orange-600",
    FECHANDO: "bg-green-600",
  };
  const labelMap: Record<string, string> = {
    INICIANDO: "Iniciando",
    INTERMEDIARIO: "Intermediário",
    FECHANDO: "Fechando",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-1 rounded-full ${map[status] || "bg-gray-600"}`}
    >
      {labelMap[status] || status}
    </span>
  );
}
