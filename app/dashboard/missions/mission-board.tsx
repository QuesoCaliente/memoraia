"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { claimMissionReward } from "@/app/actions/missions";
import type { Mission, UserMission, MissionType } from "@/app/types/cards";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface MissionBoardProps {
  missions: Mission[];
  myMissions: UserMission[];
}

const TABS: { label: string; value: MissionType }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Special", value: "special" },
];

const TYPE_BADGE_VARIANT: Record<
  MissionType,
  { className: string }
> = {
  daily: { className: "bg-blue-900/60 text-blue-300 border-blue-800" },
  weekly: { className: "bg-purple-900/60 text-purple-300 border-purple-800" },
  special: { className: "bg-amber-900/60 text-amber-300 border-amber-800" },
};

const ERROR_MESSAGES: Record<string, string> = {
  not_claimable: "Mission not completed yet or already claimed",
  unauthorized: "Session expired. Please log in again.",
  not_found: "Mission not found.",
  server_error: "Something went wrong. Please try again.",
};

export function MissionBoard({ missions, myMissions }: MissionBoardProps) {
  const router = useRouter();
  const [claimErrors, setClaimErrors] = useState<Record<string, string>>({});
  const [claimSuccesses, setClaimSuccesses] = useState<
    Record<string, { type: string; amount: number; cardName: string | null }>
  >({});
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

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

  function renderMissionList(type: MissionType) {
    const filtered = missions.filter((m) => m.missionType === type);

    if (filtered.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No {type} missions available.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((mission) => {
          const userMission = getUserMission(mission.id);
          const status = userMission?.status;
          const isLoading = pendingId === mission.id;
          const claimError = claimErrors[mission.id];
          const claimSuccess = claimSuccesses[mission.id];
          const badgeStyle = TYPE_BADGE_VARIANT[mission.missionType];

          return (
            <Card key={mission.id} size="sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Badge
                      variant="outline"
                      className={cn("capitalize", badgeStyle.className)}
                    >
                      {mission.missionType}
                    </Badge>
                    <CardTitle>{mission.name}</CardTitle>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-amber-400">
                      {mission.rewardType === "dust"
                        ? `${mission.rewardAmount} dust`
                        : "Card reward"}
                    </span>
                  </div>
                </div>
                <CardDescription>{mission.description}</CardDescription>
              </CardHeader>

              {userMission && (
                <CardContent className="space-y-3">
                  {status === "in_progress" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{userMission.progress}%</span>
                      </div>
                      <Progress value={Math.min(userMission.progress, 100)} />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {status === "in_progress" && (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                    {status === "completed" && (
                      <Badge className="bg-green-900/60 text-green-300 border-green-800">
                        Completed
                      </Badge>
                    )}
                    {status === "claimed" && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground line-through"
                      >
                        Claimed
                      </Badge>
                    )}

                    {status === "completed" && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleClaim(mission.id)}
                        disabled={isLoading}
                        className="bg-green-700 text-white hover:bg-green-600"
                      >
                        {isLoading ? "Claiming…" : "Claim"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}

              {(claimError || claimSuccess) && (
                <CardContent className="pt-0">
                  {claimError && (
                    <Alert variant="destructive">
                      <AlertDescription>{claimError}</AlertDescription>
                    </Alert>
                  )}
                  {claimSuccess && (
                    <Alert>
                      <AlertDescription>
                        Reward received:{" "}
                        {claimSuccess.type === "dust" ? (
                          <span className="font-medium text-foreground">
                            {claimSuccess.amount} dust
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">
                            {claimSuccess.cardName ?? "Card"}
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <Tabs defaultValue="daily">
      <TabsList variant="line">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {renderMissionList(tab.value)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
