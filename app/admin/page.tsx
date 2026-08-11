import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetSalesHistory, upsertCoursePricing } from "@/lib/actions";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";

export default async function AdminPage() {
  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await prisma.coursePricing.findMany();
  const totalSales = await prisma.sale.count();

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Painel do administrador</h1>

        {/* Preços e comissões dos cursos */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2">Cursos, preços e comissões</h2>
          <p className="text-sm text-gray-400 mb-4">
            A comissão configurada aqui é a única fonte usada no cálculo automático
            de cada venda — os vendedores nunca digitam esse valor.
          </p>
          <div className="space-y-3">
            {courses.map((c) => (
              <form
                action={upsertCoursePricing}
                key={c.id}
                className="grid grid-cols-3 gap-2 items-end bg-[#0A1F38] rounded-lg p-3"
              >
                <input type="hidden" name="courseName" value={c.courseName} />
                <div className="col-span-3 text-sm font-semibold">
                  {c.courseName}
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Preço (R$)</label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={c.price}
                    className="w-full rounded-lg px-2 py-1.5 bg-[#123A63] border border-[#1E4E85] text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Comissão (R$)</label>
                  <input
                    name="commission"
                    type="number"
                    step="0.01"
                    defaultValue={c.commission}
                    className="w-full rounded-lg px-2 py-1.5 bg-[#123A63] border border-[#1E4E85] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#0055B2] hover:bg-[#0A6BC7] text-sm font-bold py-1.5 rounded-lg"
                >
                  Salvar
                </button>
              </form>
            ))}
          </div>
        </section>

        {/* Reset de histórico */}
        <section className="bg-[#123A63] rounded-xl p-6 border border-red-900">
          <h2 className="text-lg font-bold mb-2 text-red-400">Zona de risco</h2>
          <p className="text-sm text-gray-400 mb-4">
            Existem atualmente <span className="font-bold">{totalSales}</span> vendas
            registradas no sistema (de todos os vendedores). A ação abaixo apaga
            TODO o histórico de vendas, zera comissões e o progresso de DNA de todo
            o time. Os clientes cadastrados NÃO são apagados. Esta ação não pode ser
            desfeita.
          </p>
          <form action={resetSalesHistory}>
            <ConfirmResetButton />
          </form>
        </section>
      </main>
    </div>
  );
}

function ConfirmResetButton() {
  return (
    <button
      type="submit"
      className="bg-red-700 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-lg transition"
    >
      Zerar histórico de vendas de todo o time
    </button>
  );
}
