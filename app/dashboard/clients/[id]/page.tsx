import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";

export default async function AdminCoursesPage() {
  const session = await auth();
  const userRole = session!.user.role;
  const userName = session!.user.name ?? "";

  if (userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  const courses = await prisma.coursePricing.findMany({
    include: { editions: { include: { sales: true } } },
    orderBy: { courseName: "asc" },
  });

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cursos</h1>
          <Link
            href="/admin/courses/new"
            className="bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold px-4 py-2 rounded-lg transition text-sm"
          >
            + Adicionar curso
          </Link>
        </div>

        <div className="space-y-2">
          {courses.length === 0 && (
            <p className="text-gray-400 text-sm">Nenhum curso cadastrado ainda.</p>
          )}
          {courses.map((c) => {
            const totalSeats = c.editions.reduce((sum, e) => sum + e.totalSeats, 0);
            const soldSeats = c.editions.reduce((sum, e) => sum + e.sales.length, 0);

            return (
              <Link
                key={c.id}
                href={`/admin/courses/${c.id}`}
                className="flex items-center justify-between bg-[#123A63] rounded-xl p-4 hover:bg-[#154480] transition"
              >
                <div>
                  <p className="font-semibold">{c.courseName}</p>
                  <p className="text-xs text-gray-400">
                    R$ {c.price.toLocaleString("pt-BR")} · comissão R${" "}
                    {c.commission.toLocaleString("pt-BR")} · {c.editions.length}{" "}
                    edição(ões)
                  </p>
                </div>
                <p className="text-xs text-[#6FA8E0]">
                  {soldSeats}/{totalSeats} vagas vendidas
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
