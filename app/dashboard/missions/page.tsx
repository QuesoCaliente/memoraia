import { getMissions, getMyMissions } from "@/app/lib/api";
import { MissionBoard } from "./mission-board";

export default async function MissionsPage() {
  const [missions, myMissions] = await Promise.all([
    getMissions({ isActive: true }),
    getMyMissions(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Misiones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Completá misiones para ganar polvo y cartas exclusivas.
        </p>
      </div>
      <MissionBoard missions={missions.data} myMissions={myMissions.data} />
    </div>
  );
}
