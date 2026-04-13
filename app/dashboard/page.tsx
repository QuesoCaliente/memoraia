import Link from "next/link";
import { getMe, getOverlayKey } from "../lib/api";
import { OverlayPanel } from "./overlay-panel";
import { LogoutButton } from "./logout-button";
import { EnableStreamerButton } from "./enable-streamer-button";

export default async function DashboardPage() {
  const user = await getMe();
  const overlay = user.streamerEnabled ? await getOverlayKey() : null;

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-zinc-400">
              Hola, <span className="text-purple-400">{user.displayName}</span>
            </p>
          </div>
          <LogoutButton />
        </header>

        {user.streamerEnabled && overlay && (
          <OverlayPanel
            initialKey={overlay.overlayKey}
            initialUrl={overlay.overlayUrl}
          />
        )}

        {!user.streamerEnabled && <EnableStreamerButton />}

        {user.streamerEnabled && (
          <Link
            href="/dashboard/cards"
            className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:bg-zinc-800"
          >
            <h2 className="text-lg font-semibold text-white">Manage Cards</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Create and manage card categories and templates
            </p>
          </Link>
        )}

        {user.streamerEnabled && (
          <Link
            href="/dashboard/battles"
            className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:bg-zinc-800"
          >
            <h2 className="text-lg font-semibold text-white">Battles</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Create and manage card battles in your stream
            </p>
          </Link>
        )}

        {user.streamerEnabled && (
          <Link
            href="/dashboard/settings"
            className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:bg-zinc-800"
          >
            <h2 className="text-lg font-semibold text-white">Settings</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Update your profile and configure card drop rewards
            </p>
          </Link>
        )}

        <Link
          href="/dashboard/inventory"
          className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:bg-zinc-800"
        >
          <h2 className="text-lg font-semibold text-white">My Collection</h2>
          <p className="mt-1 text-sm text-zinc-400">
            View your card inventory and stats
          </p>
        </Link>

        <Link
          href="/dashboard/missions"
          className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:bg-zinc-800"
        >
          <h2 className="text-lg font-semibold text-white">Missions</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Complete daily, weekly, and special missions for rewards
          </p>
        </Link>

        <Link
          href="/dashboard/physical-cards"
          className="block rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-center transition-colors hover:bg-zinc-800"
        >
          <h2 className="text-lg font-semibold text-white">Physical Cards</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Request physical versions of your cards
          </p>
        </Link>

        {user.streamerEnabled && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-3 text-lg font-semibold text-white">
              Como usar en OBS
            </h2>
            <ol className="flex flex-col gap-2 text-sm text-zinc-400">
              <li>1. Copia la URL del overlay</li>
              <li>2. En OBS, agrega una fuente &quot;Browser Source&quot;</li>
              <li>3. Pega la URL en el campo de URL</li>
              <li>4. Ajusta el ancho y alto segun tu overlay</li>
              <li>5. Las recompensas canjeadas aparecerán automáticamente</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
