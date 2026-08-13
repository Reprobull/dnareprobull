import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import { createCourse } from "@/lib/actions";
import { inputClass } from "@/lib/styles";

export default async function NewCoursePage() {
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
        <h1 className="text-2xl font-bold">Adicionar curso</h1>

        <form action={createCourse} className="bg-[#123A63] rounded-xl p-6 space-y-4">
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Nome do curso
            </label>
            <input
              name="courseName"
              required
              placeholder="Ex: Dominando a Estação de Monta"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Preço (R$)
            </label>
            <input
              name="price"
              type="number"
              step="0.01"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Comissão do vendedor (R$)
            </label>
            <input
              name="commission"
              type="number"
              step="0.01"
              required
              className={inputClass}
            />
          </div>
          <p className="text-xs text-gray-400">
            Depois de criar o curso, você vai poder adicionar as edições
            (turmas) dele, cada uma com data e número de vagas.
          </p>
          <button
            type="submit"
            className="w-full bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold py-2.5 rounded-lg transition"
          >
            Cadastrar curso
          </button>
        </form>
      </main>
    </div>
  );
}
