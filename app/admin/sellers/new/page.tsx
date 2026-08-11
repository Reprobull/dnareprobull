import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createSeller } from "@/lib/actions";

export default async function NewSellerPage() {
  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Adicionar vendedor</h1>

        <form action={createSeller} className="bg-[#123A63] rounded-xl p-6 space-y-4">
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Nome completo
            </label>
            <input
              name="name"
              required
              className="w-full rounded-lg px-3 py-2 bg-[#0A1F38] text-white border border-[#1E4E85]"
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="nome@reprobull.com"
              className="w-full rounded-lg px-3 py-2 bg-[#0A1F38] text-white border border-[#1E4E85]"
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Papel
            </label>
            <select
              name="role"
              className="w-full rounded-lg px-3 py-2 bg-[#0A1F38] text-white border border-[#1E4E85]"
            >
              <option value="SELLER">Vendedor</option>
              <option value="ADMIN">Admin (acesso total)</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">
            A senha inicial será <strong>reprobull2026</strong>, igual para
            todo mundo — ainda não existe tela de trocar senha.
          </p>
          <button
            type="submit"
            className="w-full bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold py-2.5 rounded-lg transition"
          >
            Cadastrar
          </button>
        </form>
      </main>
    </div>
  );
}
