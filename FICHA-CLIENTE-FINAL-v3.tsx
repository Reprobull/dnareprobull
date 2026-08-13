import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import {
  completeClientProfile,
  createSale,
  deleteSale,
  updateClientStatus,
} from "@/lib/actions";
import { inputClass } from "@/lib/styles";

const STATUSES = [
  { value: "INICIANDO", label: "Iniciando" },
  { value: "INTERMEDIARIO", label: "Intermediário" },
  { value: "FECHANDO", label: "Fechando" },
  { value: "VENDA_CONCLUIDA", label: "Venda Concluída" },
] as const;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user.id;
  const userName = session!.user.name ?? "";
  const userRole = session!.user.role;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      sales: {
        include: { courseEdition: { include: { coursePricing: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!client) notFound();
  if (client.sellerId !== userId && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await prisma.coursePricing.findMany({
    include: {
      editions: { include: { sales: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { courseName: "asc" },
  });
  const profileComplete = Boolean(client.email && client.document);

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <p className="text-xs text-[#6FA8E0] font-bold tracking-wider">
            CLIENTE
          </p>
          <h1 className="text-2xl font-bold">{client.fullName}</h1>
          <p className="text-sm text-gray-400">{client.phone}</p>
        </div>

        {/* Status */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Status da negociação</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <form
                key={s.value}
                action={updateClientStatus.bind(null, client.id, s.value)}
              >
                <button
                  type="submit"
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                    client.status === s.value
                      ? "bg-[#0055B2] text-white"
                      : "bg-[#0A1F38] text-gray-300 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              </form>
            ))}
          </div>
        </section>

        {/* Dados de inscrição */}
        {!profileComplete ? (
          <section className="bg-[#123A63] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-1">
              Dados pra inscrição ReproBull
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Preencha quando for fechar a venda.
            </p>
            <form
              action={completeClientProfile.bind(null, client.id)}
              className="grid md:grid-cols-2 gap-3"
            >
              <FormField
                name="fullName"
                label="Nome completo"
                defaultValue={client.fullName}
                required
              />
              <FormField name="email" label="E-mail" type="email" required />
              <FormField name="document" label="CPF/CNPJ" required />
              <FormField
                name="birthDate"
                label="Data de nascimento"
                type="date"
              />
              <FormField
                name="phone"
                label="Celular"
                defaultValue={client.phone}
                required
              />
              <FormField name="address" label="Endereço" />
              <FormField name="neighborhood" label="Bairro" />
              <FormField name="zipCode" label="CEP" />
              <FormField name="cityState" label="Cidade/Estado" />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition"
                >
                  Adicionar ao cadastro do cliente
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="bg-[#123A63] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-2">Dados de inscrição</h2>
            <p className="text-sm text-gray-300">
              {client.email} · {client.document}
            </p>
            {client.address && (
              <p className="text-sm text-gray-300 mt-1">
                {client.address}
                {client.neighborhood && `, ${client.neighborhood}`}
                {client.cityState && ` — ${client.cityState}`}
                {client.zipCode && ` · CEP ${client.zipCode}`}
              </p>
            )}
          </section>
        )}

        {/* Registrar venda */}
        {profileComplete && (
          <section className="bg-[#123A63] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Registrar venda</h2>
            <form action={createSale} className="grid md:grid-cols-2 gap-3">
              <input type="hidden" name="clientId" value={client.id} />

              <div className="md:col-span-2">
                <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                  Curso e edição (turma)
                </label>
                <select name="courseEditionId" required className={inputClass}>
                  {courses.flatMap((c) =>
                    c.editions.map((e) => {
                      const remaining = Math.max(
                        0,
                        e.totalSeats - e.sales.length
                      );
                      return (
                        <option key={e.id} value={e.id} disabled={remaining <= 0}>
                          {c.courseName} — {e.monthYear} ({remaining} vagas
                          restantes) · R$ {c.price.toLocaleString("pt-BR")}
                        </option>
                      );
                    })
                  )}
                </select>
                {courses.every((c) => c.editions.length === 0) && (
                  <p className="text-xs text-red-400 mt-1">
                    Nenhuma edição de curso cadastrada ainda. Peça ao admin
                    para criar em Admin &gt; Cursos e edições.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                  Entrada
                </label>
                <select name="entryPayment" required className={inputClass}>
                  <option value="PIX">Pix</option>
                  <option value="CARTAO">Cartão</option>
                </select>
              </div>
              <div>
                <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                  Restante
                </label>
                <select
                  name="remainderPayment"
                  required
                  className={inputClass}
                >
                  <option value="PIX">Pix</option>
                  <option value="CARTAO_PARCELADO">Parcelado no cartão</option>
                  <option value="BOLETO_PARCELADO">Parcelado no boleto</option>
                </select>
              </div>
              <FormField
                name="installments"
                label="Quantas vezes (se parcelado)"
                type="number"
              />
              <FormField
                name="boletoDueDay"
                label="Dia do vencimento (se boleto)"
                type="number"
              />

              <div className="md:col-span-2">
                <p className="text-xs text-gray-400 mb-2">
                  A comissão é calculada automaticamente com base no curso
                  selecionado.
                </p>
                <button
                  type="submit"
                  className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition"
                >
                  Registrar venda
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Cursos já comprados por este cliente */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            Cursos já comprados ({client.sales.length})
          </h2>
          <div className="space-y-2">
            {client.sales.length === 0 && (
              <p className="text-gray-400 text-sm">Nenhuma venda ainda.</p>
            )}
            {client.sales.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {s.courseEdition.coursePricing.courseName} —{" "}
                    {s.courseEdition.monthYear}
                  </p>
                  <p className="text-xs text-gray-400">
                    R$ {s.saleValue.toLocaleString("pt-BR")} · comissão R${" "}
                    {s.commission.toLocaleString("pt-BR")}
                  </p>
                </div>
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

function FormField({
  name,
  label,
  type = "text",
  required = false,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </div>
  );
}
