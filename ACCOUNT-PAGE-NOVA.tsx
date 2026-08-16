import { auth } from "@/lib/auth";
import Nav from "@/components/Nav";
import { changePassword } from "@/lib/actions";
import { inputClass } from "@/lib/styles";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();
  const userName = session!.user.name ?? "";
  const userRole = session!.user.role;

  const errorMessages: Record<string, string> = {
    senha_atual_incorreta: "Senha atual incorreta.",
    senha_nao_confere: "A nova senha e a confirmação não são iguais.",
    senha_curta: "A nova senha precisa ter pelo menos 6 caracteres.",
  };

  return (
    <div className="min-h-screen">
      <Nav userName={userName} role={userRole} />

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Minha conta</h1>

        {success && (
          <div className="bg-green-900/60 border border-green-700 rounded-lg px-4 py-3 text-sm">
            Senha alterada com sucesso.
          </div>
        )}
        {error && errorMessages[error] && (
          <div className="bg-red-900/60 border border-red-700 rounded-lg px-4 py-3 text-sm">
            {errorMessages[error]}
          </div>
        )}

        <form
          action={changePassword}
          className="bg-[#123A63] rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Senha atual
            </label>
            <input
              name="currentPassword"
              type="password"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Nova senha
            </label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[#6FA8E0] text-xs font-semibold block mb-1">
              Confirmar nova senha
            </label>
            <input
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#0055B2] hover:bg-[#0A6BC7] text-white font-bold py-2.5 rounded-lg transition"
          >
            Alterar senha
          </button>
        </form>
      </main>
    </div>
  );
}
