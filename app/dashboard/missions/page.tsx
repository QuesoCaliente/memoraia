import { getMissions, getMyMissions } from "@/app/lib/api";
import { MissionBoard } from "./mission-board";
import Link from "next/link";

export default async function MissionsPage() {
  const [missions, myMissions] = await Promise.all([
    getMissions({ isActive: true }),
    getMyMissions(),
  ]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Missions</h1>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <MissionBoard missions={missions.data} myMissions={myMissions.data} />
      </div>
    </div>
  );
}
