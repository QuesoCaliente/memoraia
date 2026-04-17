"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlertIcon } from "lucide-react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <Card className="w-full max-w-sm border-destructive">
        <CardContent className="flex flex-col items-center gap-6 pt-6 text-center">
          <TriangleAlertIcon
            className="h-10 w-10 text-destructive"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-foreground">
              Algo salió mal
            </p>
            <p className="text-sm text-muted-foreground">
              No se pudo cargar el dashboard. Puede ser un problema temporal con
              el servidor.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={() => unstable_retry()}
              className="w-full transition-all duration-200"
            >
              Intentar de nuevo
            </Button>
            <Button
              variant="ghost"
              render={<Link href="/dashboard" />}
              className="w-full transition-all duration-200"
            >
              Volver al dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
