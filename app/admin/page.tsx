import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resetSalesHistory } from "@/lib/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

export default async function AdminPage() {
  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const totalSales = await prisma.sale.count();

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Painel do administrador</h1>

        {/* Cursos e edições */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2">Cursos e edições</h2>
          <p className="text-sm text-gray-400 mb-4">
            Cadastre cursos, preços, comissões e as edições (turmas) de cada
            um, com data e número de vagas.
          </p>
          <Link
            href="/admin/courses"
            className="inline-block bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition text-sm"
          >
            Gerenciar cursos e edições
          </Link>
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
