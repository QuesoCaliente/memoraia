import { getMissions, getMyMissions } from "@/app/lib/api";
import { MissionBoard } from "./mission-board";

export default async function MissionsPage() {
  const [missions, myMissions] = await Promise.all([
    getMissions({ isActive: true }),
    getMyMissions(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Missions</h1>
      <MissionBoard missions={missions.data} myMissions={myMissions.data} />
    </div>
  );
}
