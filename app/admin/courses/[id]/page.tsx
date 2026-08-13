import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { createCourseEdition, upsertCoursePricing } from "@/lib/actions";
import { inputClass } from "@/lib/styles";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const course = await prisma.coursePricing.findUnique({
    where: { id },
    include: {
      editions: {
        include: { sales: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!course) notFound();

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div>
          <p className="text-xs text-[#6FA8E0] font-bold tracking-wider">
            CURSO
          </p>
          <h1 className="text-2xl font-bold">{course.courseName}</h1>
        </div>

        {/* Preço e comissão */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2">Preço e comissão</h2>
          <p className="text-xs text-gray-400 mb-4">
            A comissão configurada aqui é a única fonte usada no cálculo
            automático de cada venda — os vendedores nunca digitam esse valor.
          </p>
          <form
            action={upsertCoursePricing}
            className="grid grid-cols-2 gap-3 items-end"
          >
            <input type="hidden" name="courseName" value={course.courseName} />
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Preço (R$)
              </label>
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={course.price}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Comissão (R$)
              </label>
              <input
                name="commission"
                type="number"
                step="0.01"
                defaultValue={course.commission}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="bg-[#0055B2] hover:bg-[#0A6BC7] text-sm font-bold px-4 py-2 rounded-lg"
              >
                Salvar
              </button>
            </div>
          </form>
        </section>

        {/* Adicionar edição */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-1">Adicionar edição</h2>
          <p className="text-xs text-gray-400 mb-4">
            Uma edição é uma turma específica desse curso, por exemplo &quot;
            {course.courseName} Setembro/26&quot;.
          </p>
          <form
            action={createCourseEdition.bind(null, course.id)}
            className="grid md:grid-cols-3 gap-3"
          >
            <div>
              <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                Nome da edição
              </label>
              <input
                name="monthYear"
                required
                placeholder="Ex: Setembro/26"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                Data exata (opcional)
              </label>
              <input name="examDate" type="date" className={inputClass} />
            </div>
            <div>
              <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
                Total de vagas
              </label>
              <input
                name="totalSeats"
                type="number"
                required
                className={inputClass}
              />
            </div>
            <div className="md:col-span-3">
              <button
                type="submit"
                className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-5 py-2 rounded-lg transition text-sm"
              >
                Criar edição
              </button>
            </div>
          </form>
        </section>

        {/* Lista de edições */}
        <section className="bg-[#123A63] rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            Edições ({course.editions.length})
          </h2>
          <div className="space-y-2">
            {course.editions.length === 0 && (
              <p className="text-gray-400 text-sm">
                Nenhuma edição criada ainda.
              </p>
            )}
            {course.editions.map((e) => {
              const remaining = Math.max(0, e.totalSeats - e.sales.length);
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between bg-[#0A1F38] rounded-lg px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">
                      {course.courseName} {e.monthYear}
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.examDate
                        ? new Date(e.examDate).toLocaleDateString("pt-BR")
                        : "Data ainda não definida"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {remaining} <span className="text-xs font-normal text-gray-400">restantes</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      {e.sales.length}/{e.totalSeats} vendidas
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
