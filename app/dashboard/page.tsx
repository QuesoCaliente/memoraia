import Link from "next/link";
import { getMe, getOverlayKey } from "../lib/api";
import { OverlayPanel } from "./overlay-panel";
import { EnableStreamerButton } from "./enable-streamer-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  Target,
  CreditCard,
  Sparkles,
  Swords,
  Settings,
  Gem,
  Monitor,
  AlertCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getMe();
  const overlay = user.streamerEnabled ? await getOverlayKey() : null;

  const hasOverlay = !!overlay?.overlayKey;
  const hasCardDropReward = !!user.cardDropRewardId;

  return (
    <>
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
          Hola, <span className="text-primary">{user.displayName}</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Tu centro de control de MemorAIA
        </p>
      </div>

      {!user.streamerEnabled && (
        <div className="mb-8">
          <EnableStreamerButton />
        </div>
      )}

      {user.streamerEnabled && (
        <>
          {/* ── Module Status Cards ──────────────────────────────── */}
          <section className="mb-8" aria-label="Módulos">
            <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
              Módulos de MemorAIA
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/25 to-primary/5">
                    <Sparkles
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <Badge
                    variant={hasCardDropReward ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {hasCardDropReward ? "Activo" : "Sin configurar"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">Card Drops</p>
                </CardContent>
              </Card>

              <Card className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/25 to-primary/5">
                    <Swords
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <Badge variant="default" className="text-xs">
                    Activo
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">Batallas</p>
                </CardContent>
              </Card>

              <Card className="relative">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/25 to-primary/5">
                    <Monitor
                      className="h-6 w-6 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <Badge
                    variant={hasOverlay ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {hasOverlay ? "Activo" : "Sin configurar"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold">Overlay</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Setup Alert Banner ───────────────────────────────── */}
          {(!hasCardDropReward || !hasOverlay) && (
            <Alert className="mb-8 border-primary/20 bg-primary/5">
              <AlertCircle className="text-primary" />
              <AlertDescription>
                <SetupAlertMessage
                  hasCardDropReward={hasCardDropReward}
                  hasOverlay={hasOverlay}
                />
              </AlertDescription>
            </Alert>
          )}

          {/* ── Getting Started ──────────────────────────────────── */}
          <section className="mb-8" aria-label="Primeros pasos">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Primeros pasos</CardTitle>
              </CardHeader>

              <Separator />

              <CardContent className="space-y-0 p-0">
                {/* Step 1: Overlay */}
                <div className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Monitor
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="font-medium leading-none">
                      Añade el overlay a OBS
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Configura el widget para que las cartas y batallas
                      aparezcan en pantalla durante el stream.
                    </p>
                    {overlay && (
                      <div className="pt-2" id="overlay-panel">
                        <OverlayPanel
                          initialKey={overlay.overlayKey}
                          initialUrl={overlay.overlayUrl}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Step 2: Cards & Templates */}
                <div className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Sparkles
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="font-medium leading-none">
                      Revisa tus cartas y templates
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Crea categorías, sube templates y configura las
                      probabilidades de drop para tu comunidad.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link
                        href="/dashboard/cards/templates"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ver templates
                      </Link>
                      <Link
                        href="/dashboard/cards/modifiers"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Configurar rareza
                      </Link>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 3: Drop Reward */}
                <div className="flex gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Settings
                      className="h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <p className="font-medium leading-none">
                      Configura tu recompensa de drops
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Conecta un channel point reward de Twitch para que los
                      viewers obtengan cartas al canjear puntos.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/dashboard/settings"
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Ir a ajustes
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </>
      )}

      {/* ── Quick Access ─────────────────────────────────────── */}
      <section aria-label="Acceso rápido">
        <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
          Acceso rápido
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/inventory"
            className="group"
            aria-label="Mi Colección — Ver inventario de cartas"
          >
            <Card className="hover-lift h-full">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5">
                  <Layers
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle>Mi Colección</CardTitle>
                <CardDescription>
                  Explora tu inventario y gestiona tu dust
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="gap-1.5">
                  <Gem className="h-3 w-3" aria-hidden="true" />
                  <span className="tabular-nums">{user.dust}</span> dust
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/dashboard/missions"
            className="group"
            aria-label="Misiones"
          >
            <Card className="hover-lift h-full">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5">
                  <Target
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle>Misiones</CardTitle>
                <CardDescription>
                  Diarias, semanales y especiales
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link
            href="/dashboard/physical-cards"
            className="group"
            aria-label="Cartas Físicas"
          >
            <Card className="hover-lift h-full">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/5">
                  <CreditCard
                    className="h-5 w-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <CardTitle>Cartas Físicas</CardTitle>
                <CardDescription>
                  Solicita versiones físicas de tus cartas
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>
    </>
  );
}

function SetupAlertMessage({
  hasCardDropReward,
  hasOverlay,
}: {
  hasCardDropReward: boolean;
  hasOverlay: boolean;
}) {
  if (!hasCardDropReward && !hasOverlay) {
    return (
      <>
        Configura tu{" "}
        <Link href="/dashboard/settings">recompensa de drops</Link> y tu{" "}
        <Link href="#overlay-panel">overlay</Link> para empezar a entregar
        cartas en stream.
      </>
    );
  }

  if (!hasCardDropReward) {
    return (
      <>
        Configura una{" "}
        <Link href="/dashboard/settings">recompensa de channel points</Link>{" "}
        para activar los card drops.
      </>
    );
  }

  return (
    <>
      Configura tu <Link href="#overlay-panel">overlay en OBS</Link> para que
      las cartas aparezcan en stream.
    </>
  );
}
