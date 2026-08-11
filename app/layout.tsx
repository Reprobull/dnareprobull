import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DNA ReproBull",
  description: "Programa DNA ReproBull — sistema interno de vendas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0A1F38] text-white antialiased">{children}</body>
    </html>
  );
}
