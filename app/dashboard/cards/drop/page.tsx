import { requireAdminStreamer } from "@/app/lib/guards";
import { SimulateDropForm } from "./simulate-drop-form";
import Link from "next/link";

export default async function SimulateDropPage() {
  await requireAdminStreamer();

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Simular Drop</h1>
          <Link
            href="/dashboard/cards"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Cards
          </Link>
        </div>
        <p className="text-sm text-zinc-400">
          Simula un drop de carta a un usuario específico sin necesidad de una
          suscripción real de Twitch. El tier afecta los pesos de drop según los
          modificadores configurados.
        </p>
        <SimulateDropForm />
      </div>
    </div>
  );
}
