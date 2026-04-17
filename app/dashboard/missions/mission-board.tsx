"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissionBoardProps {
  missions: Mission[];
  myMissions: UserMission[];
}

const TABS: { label: string; value: MissionType }[] = [
  { label: "Diarias", value: "daily" },
  { label: "Semanales", value: "weekly" },
  { label: "Especiales", value: "special" },
];

const TYPE_BADGE_VARIANT: Record<MissionType, { className: string }> = {
  daily: { className: "text-primary border-primary/30" },
  weekly: { className: "text-chart-5 border-chart-5/30" },
  special: { className: "text-chart-4 border-chart-4/30" },
};

const EMPTY_STATE: Record<MissionType, { heading: string; description: string }> = {
  daily: {
    heading: "Volvé mañana",
    description: "No hay misiones diarias disponibles por ahora.",
  },
  weekly: {
    heading: "Próximamente",
    description: "No hay misiones semanales disponibles en este momento.",
  },
  special: {
    heading: "Próximamente",
    description: "No hay misiones especiales disponibles en este momento.",
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  not_claimable: "La misión aún no está completada o ya fue reclamada.",
  unauthorized: "Sesión expirada. Por favor, iniciá sesión nuevamente.",
  not_found: "Misión no encontrada.",
  server_error: "Algo salió mal. Por favor, intentá de nuevo.",
};

export function MissionBoard({ missions, myMissions }: MissionBoardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function getUserMission(missionId: string): UserMission | undefined {
    return myMissions.find((um) => um.missionId === missionId);
  }

  function handleClaim(missionId: string) {
    setPendingId(missionId);

    startTransition(async () => {
      const res = await claimMissionReward(missionId);
      setPendingId(null);

      if (!res.ok) {
        if (res.error === "unauthorized") {
          router.push("/");
          return;
        }
        toast.error(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.server_error);
        return;
      }

      const reward = res.data.reward;
      const rewardLabel =
        reward.type === "dust"
          ? `${reward.amount} polvo`
          : (reward.card?.template.name ?? "Carta");

      toast.success(`¡Recompensa recibida! Obtuviste ${rewardLabel}`);
    });
  }

  function renderMissionList(type: MissionType) {
    const filtered = missions.filter((m) => m.missionType === type);
    const emptyState = EMPTY_STATE[type];

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Target aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="text-sm font-semibold text-foreground">{emptyState.heading}</h3>
          <p className="text-xs text-muted-foreground">{emptyState.description}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((mission) => {
          const userMission = getUserMission(mission.id);
          const status = userMission?.status;
          const isLoading = pendingId === mission.id;
          const badgeStyle = TYPE_BADGE_VARIANT[mission.missionType];

          return (
            <Card key={mission.id} size="sm" className="transition-all duration-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Badge
                      variant="outline"
                      className={cn("capitalize", badgeStyle.className)}
                    >
                      {mission.missionType === "daily"
                        ? "Diaria"
                        : mission.missionType === "weekly"
                        ? "Semanal"
                        : "Especial"}
                    </Badge>
                    <CardTitle>{mission.name}</CardTitle>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs font-medium text-primary">
                      {mission.rewardType === "dust"
                        ? `${mission.rewardAmount} polvo`
                        : "Recompensa: carta"}
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
                        <span>Progreso</span>
                        <span>{userMission.progress}%</span>
                      </div>
                      <Progress value={Math.min(userMission.progress, 100)} />
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {status === "in_progress" && (
                      <Badge variant="secondary">En progreso</Badge>
                    )}
                    {status === "completed" && (
                      <Badge variant="outline" className="text-primary border-primary/30">
                        Completada
                      </Badge>
                    )}
                    {status === "claimed" && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground line-through"
                      >
                        Reclamada
                      </Badge>
                    )}

                    {status === "completed" && (
                      <Button
                        size="xs"
                        onClick={() => handleClaim(mission.id)}
                        disabled={isLoading}
                        aria-busy={isLoading}
                      >
                        {isLoading ? "Reclamando…" : "Reclamar"}
                      </Button>
                    )}
                  </div>
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
