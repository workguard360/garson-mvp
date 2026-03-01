import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garson MVP",
  description: "QR ile masaya giriş, koltuk seçimi, sipariş, KDS-lite",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white text-slate-900">
        <div className="mx-auto max-w-3xl p-4">
          <header className="mb-6 flex items-center justify-between">
            <div className="font-semibold">Garson MVP</div>
            <nav className="text-sm space-x-3">
              <a className="underline" href="/t/demo">Guest</a>
              <a className="underline" href="/kitchen">Kitchen</a>
              <a className="underline" href="/admin">Admin</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
