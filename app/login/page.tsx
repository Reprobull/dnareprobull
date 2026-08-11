import { signIn } from "@/lib/auth";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A1F38] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[#6FA8E0] text-xs font-bold tracking-[0.2em] mb-2">
            PROGRAMA OFICIAL 2026
          </p>
          <h1 className="text-white text-3xl font-bold">DNA REPROBULL</h1>
        </div>

        <form
          action={async (formData) => {
            "use server";
            await signIn("credentials", {
              email: formData.get("email"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            });
          }}
          className="bg-[#123A63] rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg px-3 py-2 bg-[#0A1F38] text-white border border-[#1E4E85] focus:outline-none focus:border-[#0055B2]"
              placeholder="seuemail@reprobull.com"
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Senha
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-lg px-3 py-2 bg-[#0A1F38] text-white border border-[#1E4E85] focus:outline-none focus:border-[#0055B2]"
              placeholder="••••••••"
            />
          </div>

          {searchParams?.error && (
            <p className="text-red-400 text-sm">
              E-mail ou senha incorretos.
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold py-2.5 rounded-lg transition"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
