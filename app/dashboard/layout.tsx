import Link from "next/link";
import { getMe } from "../lib/api";
import { LogoutButton } from "./logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMe();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0b14]">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-150 w-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/8 blur-[120px]" />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 md:px-16">
        <Link href="/dashboard" className="text-lg font-bold text-white">
          Memor<span className="text-blue-400">AIA</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/dashboard/inventory"
            className="text-xs font-semibold uppercase tracking-widest text-zinc-400 transition-colors hover:text-white"
          >
            Colección
          </Link>
          <Link
            href="/dashboard/missions"
            className="text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
          >
            Misiones
          </Link>
          {user.streamerEnabled && (
            <Link
              href="/dashboard/cards"
              className="text-xs font-semibold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
            >
              Cartas
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user.displayName}</span>
          <LogoutButton />
        </div>
      </nav>

      {/* ── Content ──────────────────────────────────────────────── */}
      <main className="relative z-10 mx-auto max-w-6xl px-6 pt-8 pb-16 md:px-12">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 flex flex-col items-center gap-4 border-t border-zinc-800/50 px-4 py-10">
        <span className="text-sm font-bold text-white">
          Memor<span className="text-blue-400">AIA</span>
        </span>
        <p className="max-w-sm text-center text-xs text-zinc-600">
          © 2026 MemorAIA. Colecciona, fusiona y batalla con cartas de tus
          streamers favoritos.
        </p>
      </footer>
    </div>
  );
}
