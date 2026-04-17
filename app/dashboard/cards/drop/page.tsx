import { requireAdminStreamer } from "@/app/lib/guards";
import { SimulateDropForm } from "./simulate-drop-form";

export default async function SimulateDropPage() {
  await requireAdminStreamer();

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Simular Drop</h1>
      <p className="text-sm text-muted-foreground">
        Simulá un drop de carta a un viewer específico sin necesidad de una
        suscripción real de Twitch. El tier afecta los pesos de drop según los
        modificadores configurados.
      </p>
      <SimulateDropForm />
    </div>
  );
}
