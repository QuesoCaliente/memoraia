"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPhysicalCard } from "@/app/actions/physical-cards";
import type { PhysicalCard, PhysicalCardStatus } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

interface PhysicalCardListProps {
  initialRequests: PhysicalCard[];
  total: number;
}

const STATUS_VARIANT: Record<
  PhysicalCardStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "secondary",
  shipped: "default",
  delivered: "secondary",
  rejected: "destructive",
};

const STATUS_LABEL: Record<PhysicalCardStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  shipped: "Enviada",
  delivered: "Entregada",
  rejected: "Rechazada",
};

const ERROR_MESSAGES: Record<string, string> = {
  already_requested: "Ya existe una solicitud de carta física para esta carta",
  inactive_card: "Esta carta no está activa",
  forbidden: "No sos el dueño de esta carta",
  unauthorized: "Sesión expirada. Por favor, iniciá sesión nuevamente.",
  server_error: "Algo salió mal. Intentá de nuevo.",
};

const EMPTY_SHIPPING = { name: "", address: "", city: "", country: "" };

export function PhysicalCardList({
  initialRequests,
  total,
}: PhysicalCardListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<PhysicalCard[]>(initialRequests);
  const [userCardId, setUserCardId] = useState("");
  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [isPending, startTransition] = useTransition();

  function handleShippingChange(field: keyof typeof shipping, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      const result = await requestPhysicalCard({
        userCardId,
        shippingInfo: shipping,
      });

      if (!result.ok) {
        if (result.error === "unauthorized") {
          router.push("/");
          return;
        }
        toast.error(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.server_error);
        return;
      }

      setRequests((prev) => [result.data, ...prev]);
      setUserCardId("");
      setShipping(EMPTY_SHIPPING);
      toast.success("Solicitud enviada");
    });
  }

  return (
    <div className="space-y-8">
      {/* Request form */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitar Carta Física</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userCardId">ID de carta</Label>
              <Input
                id="userCardId"
                type="text"
                value={userCardId}
                onChange={(e) => setUserCardId(e.target.value)}
                required
                disabled={isPending}
                placeholder="Ingresá el ID de tu carta"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                Información de envío
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shippingName">Nombre completo</Label>
                  <Input
                    id="shippingName"
                    type="text"
                    value={shipping.name}
                    onChange={(e) =>
                      handleShippingChange("name", e.target.value)
                    }
                    required
                    disabled={isPending}
                    placeholder="Juan Pérez"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingCountry">País</Label>
                  <Input
                    id="shippingCountry"
                    type="text"
                    value={shipping.country}
                    onChange={(e) =>
                      handleShippingChange("country", e.target.value)
                    }
                    required
                    disabled={isPending}
                    placeholder="AR"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingAddress">Dirección</Label>
                  <Input
                    id="shippingAddress"
                    type="text"
                    value={shipping.address}
                    onChange={(e) =>
                      handleShippingChange("address", e.target.value)
                    }
                    required
                    disabled={isPending}
                    placeholder="Av. Corrientes 1234"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingCity">Ciudad</Label>
                  <Input
                    id="shippingCity"
                    type="text"
                    value={shipping.city}
                    onChange={(e) =>
                      handleShippingChange("city", e.target.value)
                    }
                    required
                    disabled={isPending}
                    placeholder="Buenos Aires"
                  />
                </div>
              </div>
            </fieldset>

            <Button
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
              className="transition-all duration-200"
            >
              {isPending ? "Enviando…" : "Solicitar Carta Física"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Requests list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Tus solicitudes{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({total})
          </span>
        </h2>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">Sin solicitudes</p>
              <p className="text-xs text-muted-foreground">Solicitá tu primera carta física</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        ID de carta:{" "}
                        <span className="font-mono text-foreground">
                          {req.userCardId}
                        </span>
                      </p>
                      {req.verificationCode && (
                        <p className="text-xs text-muted-foreground">
                          Código de verificación:{" "}
                          <span className="font-mono text-foreground">
                            {req.verificationCode}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString("es", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANT[req.status]}
                      className="shrink-0"
                    >
                      {STATUS_LABEL[req.status]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
