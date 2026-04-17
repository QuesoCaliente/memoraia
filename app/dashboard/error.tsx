"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col items-center gap-6 pt-6 text-center">
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Algo salió mal</AlertTitle>
            <AlertDescription>
              No se pudo cargar el dashboard. Puede ser un problema temporal con
              el servidor.
            </AlertDescription>
          </Alert>
          <Button onClick={() => unstable_retry()}>Intentar de nuevo</Button>
        </CardContent>
      </Card>
    </div>
  );
}
