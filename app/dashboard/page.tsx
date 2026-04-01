import { getMe, getOverlayKey } from "../lib/api";
import { OverlayPanel } from "./overlay-panel";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const [user, overlay] = await Promise.all([getMe(), getOverlayKey()]);

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

        <OverlayPanel
          initialKey={overlay.overlayKey}
          initialUrl={overlay.overlayUrl}
        />

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
      </div>
    </div>
  );
}
