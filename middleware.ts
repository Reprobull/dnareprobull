export { auth as middleware } from "@/lib/auth";

export const config = {
  // Protege todas as rotas, exceto login, arquivos estáticos e a própria API de auth
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
