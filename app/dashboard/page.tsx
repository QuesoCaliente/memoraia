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
import {
  Layers,
  Target,
  CreditCard,
  Sparkles,
  Swords,
  Settings,
  Gem,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await getMe();
  const overlay = user.streamerEnabled ? await getOverlayKey() : null;

  return (
    <>
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
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

      {/* ── Bento Grid ─────────────────────────────────────────── */}
      <div className="grid auto-rows-[minmax(140px,auto)] grid-cols-1 gap-4 md:grid-cols-3">
        {/* Collection — hero card */}
        <Link
          href="/dashboard/inventory"
          className="group row-span-2 md:col-span-2"
          aria-label="Mi Colección — Ver inventario de cartas"
        >
          <Card className="hover-lift flex h-full flex-col justify-between overflow-hidden">
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-primary/5">
                <Layers className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">
                Mi <span className="text-primary">Colección</span>
              </CardTitle>
              <CardDescription className="text-sm">
                Explora tu inventario, fusiona duplicados y gestiona tu dust
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="gap-1.5">
                  <Gem className="h-3 w-3" aria-hidden="true" />
                  <span className="tabular-nums">{user.dust}</span> dust
                </Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Missions */}
        <Link
          href="/dashboard/missions"
          className="group"
          aria-label="Misiones"
        >
          <Card className="hover-lift flex h-full flex-col justify-end">
            <CardHeader className="mt-auto">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <Target className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <CardTitle>
                <span className="text-primary">Misiones</span>
              </CardTitle>
              <CardDescription>
                Diarias, semanales y especiales
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Physical Cards */}
        <Link
          href="/dashboard/physical-cards"
          className="group"
          aria-label="Cartas Físicas"
        >
          <Card className="hover-lift flex h-full flex-col justify-end">
            <CardHeader className="mt-auto">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <CardTitle>
                Cartas <span className="text-primary">Físicas</span>
              </CardTitle>
              <CardDescription>
                Solicita versiones físicas de tus cartas
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* ── Streamer section ───────────────────────────────────── */}
        {user.streamerEnabled && (
          <>
            {/* Manage Cards */}
            <Link
              href="/dashboard/cards"
              className="group md:col-span-2"
              aria-label="Gestionar Cartas"
            >
              <Card className="hover-lift flex h-full flex-col justify-end">
                <CardHeader className="mt-auto">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                    <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-2xl">
                    Gestionar <span className="text-primary">Cartas</span>
                  </CardTitle>
                  <CardDescription>
                    Categorías, templates, pool y modificadores de rareza
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Battles */}
            <Link
              href="/dashboard/battles"
              className="group"
              aria-label="Batallas"
            >
              <Card className="hover-lift flex h-full flex-col justify-end">
                <CardHeader className="mt-auto">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                    <Swords className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>
                    <span className="text-primary">Batallas</span>
                  </CardTitle>
                  <CardDescription>
                    Enfrenta cartas de viewers en stream
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {/* Overlay */}
            {overlay && (
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <OverlayPanel
                    initialKey={overlay.overlayKey}
                    initialUrl={overlay.overlayUrl}
                  />
                </CardContent>
              </Card>
            )}

            {/* Settings */}
            <Link
              href="/dashboard/settings"
              className="group"
              aria-label="Ajustes"
            >
              <Card className="hover-lift flex h-full flex-col justify-end">
                <CardHeader className="mt-auto">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                    <Settings className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle>
                    <span className="text-primary">Ajustes</span>
                  </CardTitle>
                  <CardDescription>
                    Perfil, slug y recompensa de drops
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
