import Link from "next/link";
import { getMe, getOverlayKey } from "../lib/api";
import { OverlayPanel } from "./overlay-panel";
import { EnableStreamerButton } from "./enable-streamer-button";

export default async function DashboardPage() {
  const user = await getMe();
  const overlay = user.streamerEnabled ? await getOverlayKey() : null;

  return (
    <>
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Hola, <span className="text-blue-400">{user.displayName}</span>
        </h1>
        <p className="mt-2 text-zinc-500">
          Tu centro de control de MemorAIA
        </p>
      </div>

      {!user.streamerEnabled && (
        <div className="mb-8">
          <EnableStreamerButton />
        </div>
      )}

      {/* ── Bento Grid ─────────────────────────────────────────── */}
      <div className="grid auto-rows-[minmax(160px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
        {/* Collection — large, spans 2 cols */}
        <Link
          href="/dashboard/inventory"
          className="group row-span-2 flex flex-col justify-end rounded-2xl border border-zinc-800 p-8 transition-colors hover:border-zinc-700 md:col-span-2"
        >
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Mi <span className="text-blue-400">Colección</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Explora tu inventario de cartas, fusiona duplicados y gestiona tu dust
          </p>
        </Link>

        {/* Missions */}
        <Link
          href="/dashboard/missions"
          className="group flex flex-col justify-end rounded-2xl border border-zinc-800 p-8 transition-colors hover:border-zinc-700"
        >
          <h2 className="text-xl font-bold text-white">
            <span className="text-blue-400">Misiones</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Diarias, semanales y especiales
          </p>
        </Link>

        {/* Physical Cards */}
        <Link
          href="/dashboard/physical-cards"
          className="group flex flex-col justify-end rounded-2xl border border-zinc-800 p-8 transition-colors hover:border-zinc-700"
        >
          <h2 className="text-xl font-bold text-white">
            Cartas <span className="text-blue-400">Físicas</span>
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Solicita versiones físicas de tus cartas
          </p>
        </Link>

        {/* ── Streamer section ───────────────────────────────────── */}
        {user.streamerEnabled && (
          <>
            {/* Manage Cards — large */}
            <Link
              href="/dashboard/cards"
              className="group flex flex-col justify-end rounded-2xl border border-zinc-800 p-8 transition-colors hover:border-zinc-700 md:col-span-2"
            >
              <h2 className="text-2xl font-bold text-white">
                Gestionar <span className="text-blue-400">Cartas</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Categorías, templates, pool del canal y modificadores de rareza
              </p>
            </Link>

            {/* Battles */}
            <Link
              href="/dashboard/battles"
              className="group flex flex-col justify-end rounded-2xl border border-zinc-800 p-8 transition-colors hover:border-zinc-700"
            >
              <h2 className="text-xl font-bold text-white">
                <span className="text-blue-400">Batallas</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Enfrenta cartas de viewers en stream
              </p>
            </Link>

            {/* Overlay */}
            {overlay && (
              <div className="rounded-2xl border border-zinc-800 p-8 md:col-span-2">
                <OverlayPanel
                  initialKey={overlay.overlayKey}
                  initialUrl={overlay.overlayUrl}
                />
              </div>
            )}

            {/* Settings */}
            <Link
              href="/dashboard/settings"
              className="group flex flex-col justify-end rounded-2xl border border-zinc-800 p-8 transition-colors hover:border-zinc-700"
            >
              <h2 className="text-xl font-bold text-white">
                <span className="text-blue-400">Ajustes</span>
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Perfil, slug y recompensa de drops
              </p>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
