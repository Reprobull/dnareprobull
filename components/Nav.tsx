import Link from "next/link";
import { signOut } from "@/lib/auth";

export default function Nav({
  userName,
  role,
}: {
  userName: string;
  role?: string;
}) {
  return (
    <nav className="border-b border-[#123A63] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-bold text-sm tracking-wide">DNA REPROBULL</span>
        <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white">
          Meu perfil
        </Link>
        <Link href="/overview" className="text-sm text-gray-300 hover:text-white">
          Visão geral
        </Link>
        {role === "ADMIN" && (
          <>
            <Link href="/admin" className="text-sm text-[#6FA8E0] hover:text-white">
              Admin
            </Link>
            <Link href="/admin/sellers" className="text-sm text-[#6FA8E0] hover:text-white">
              Time
            </Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">{userName}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm text-red-400 hover:text-red-300">Sair</button>
        </form>
      </div>
    </nav>
  );
}
