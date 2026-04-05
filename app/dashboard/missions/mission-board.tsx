"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimMissionReward } from "@/app/actions/missions";
import type { Mission, UserMission, MissionType } from "@/app/types/cards";

interface MissionBoardProps {
  missions: Mission[];
  myMissions: UserMission[];
}

const TABS: { label: string; value: MissionType }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Special", value: "special" },
];

const TYPE_BADGE: Record<MissionType, string> = {
  daily: "bg-blue-900 text-blue-300",
  weekly: "bg-purple-900 text-purple-300",
  special: "bg-amber-900 text-amber-300",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_claimable: "Mission not completed yet or already claimed",
  unauthorized: "Session expired. Please log in again.",
  not_found: "Mission not found.",
  server_error: "Something went wrong. Please try again.",
};

export function MissionBoard({ missions, myMissions }: MissionBoardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MissionType>("daily");
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [claimSuccesses, setClaimSuccesses] = useState<
    Record<string, { type: string; amount: number; cardName: string | null }>
  >({});
  const [claimingIds, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = missions.filter((m) => m.missionType === activeTab);

  function getUserMission(missionId: string): UserMission | undefined {
    return myMissions.find((um) => um.missionId === missionId);
  }

  function handleClaim(missionId: string) {
    setPendingId(missionId);
    setClaimErrors((prev) => ({ ...prev, [missionId]: "" }));

    startTransition(async () => {
      const res = await claimMissionReward(missionId);
      setPendingId(null);

      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        setClaimErrors((prev) => ({
          ...prev,
          [missionId]: ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error,
        }));
        return;
      }

      setClaimSuccesses((prev) => ({
        ...prev,
        [missionId]: {
          type: res.data.reward.type,
          amount: res.data.reward.amount,
          cardName: res.data.reward.card?.template.name ?? null,
        },
      }));
    });
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "border-b-2 border-white text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mission cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">No {activeTab} missions available.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((mission) => {
            const userMission = getUserMission(mission.id);
            const status = userMission?.status;
            const isLoading = pendingId === mission.id;
            const claimError = claimErrors[mission.id];
            const claimSuccess = claimSuccesses[mission.id];

            return (
              <div
                key={mission.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-medium capitalize ${TYPE_BADGE[mission.missionType]}`}
                      >
                        {mission.missionType}
                      </span>
                      <h3 className="text-sm font-semibold text-white">{mission.name}</h3>
                    </div>
                    <p className="text-xs text-zinc-400">{mission.description}</p>
                  </div>

                  {/* Reward */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-medium text-amber-400">
                      {mission.rewardType === "dust"
                        ? `${mission.rewardAmount} dust`
                        : "Card reward"}
                    </p>
                  </div>
                </div>

                {/* Progress + status */}
                {userMission && (
                  <div className="space-y-2">
                    {/* Progress bar */}
                    {status === "in_progress" && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-zinc-400">
                          <span>Progress</span>
                          <span>{userMission.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-800">
                          <div
                            className="h-1.5 rounded-full bg-zinc-400 transition-all"
                            style={{ width: `${Math.min(userMission.progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="flex items-center gap-3">
                      {status === "in_progress" && (
                        <span className="text-xs font-medium text-zinc-400">In Progress</span>
                      )}
                      {status === "completed" && (
                        <span className="text-xs font-medium text-green-400">Completed</span>
                      )}
                      {status === "claimed" && (
                        <span className="text-xs font-medium text-zinc-500 line-through">
                          Claimed
                        </span>
                      )}

                      {/* Claim button */}
                      {status === "completed" && (
                        <button
                          onClick={() => handleClaim(mission.id)}
                          disabled={isLoading}
                          className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isLoading ? "Claiming…" : "Claim"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Feedback */}
                {claimError && (
                  <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                    {claimError}
                  </div>
                )}
                {claimSuccess && (
                  <div className="rounded-md border border-green-800 bg-green-950/40 px-3 py-2 text-xs text-green-300">
                    Reward received:{" "}
                    {claimSuccess.type === "dust" ? (
                      <span className="font-medium">{claimSuccess.amount} dust</span>
                    ) : (
                      <span className="font-medium">
                        {claimSuccess.cardName ?? "Card"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
