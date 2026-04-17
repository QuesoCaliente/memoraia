"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPhysicalCard } from "@/app/actions/physical-cards";
import type { PhysicalCard, PhysicalCardStatus } from "@/app/types/cards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const ERROR_MESSAGES: Record<string, string> = {
  already_requested: "A physical card request already exists for this card",
  inactive_card: "This card is not active",
  forbidden: "You don't own this card",
  unauthorized: "Session expired. Please log in again.",
  server_error: "Something went wrong. Please try again.",
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleShippingChange(field: keyof typeof shipping, value: string) {
    setShipping((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

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
        setSubmitError(
          ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.server_error
        );
        return;
      }

      setRequests((prev) => [result.data, ...prev]);
      setUserCardId("");
      setShipping(EMPTY_SHIPPING);
    });
  }

  return (
    <div className="space-y-8">
      {/* Request form */}
      <Card>
        <CardHeader>
          <CardTitle>Request a Physical Card</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="userCardId">Card ID</Label>
              <Input
                id="userCardId"
                type="text"
                value={userCardId}
                onChange={(e) => setUserCardId(e.target.value)}
                required
                placeholder="Enter your card ID"
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-foreground">
                Shipping Information
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shippingName">Full Name</Label>
                  <Input
                    id="shippingName"
                    type="text"
                    value={shipping.name}
                    onChange={(e) =>
                      handleShippingChange("name", e.target.value)
                    }
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingCountry">Country</Label>
                  <Input
                    id="shippingCountry"
                    type="text"
                    value={shipping.country}
                    onChange={(e) =>
                      handleShippingChange("country", e.target.value)
                    }
                    required
                    placeholder="US"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingAddress">Address</Label>
                  <Input
                    id="shippingAddress"
                    type="text"
                    value={shipping.address}
                    onChange={(e) =>
                      handleShippingChange("address", e.target.value)
                    }
                    required
                    placeholder="123 Main St"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    type="text"
                    value={shipping.city}
                    onChange={(e) =>
                      handleShippingChange("city", e.target.value)
                    }
                    required
                    placeholder="Springfield"
                  />
                </div>
              </div>
            </fieldset>

            {submitError && (
              <Alert variant="destructive">
                <TriangleAlertIcon />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Request Physical Card"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Requests list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">
          Your Requests{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({total})
          </span>
        </h2>

        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No physical card requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Card ID:{" "}
                        <span className="font-mono text-foreground">
                          {req.userCardId}
                        </span>
                      </p>
                      {req.verificationCode && (
                        <p className="text-xs text-muted-foreground">
                          Verification Code:{" "}
                          <span className="font-mono text-foreground">
                            {req.verificationCode}
                          </span>
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={STATUS_VARIANT[req.status]}
                      className="shrink-0 capitalize"
                    >
                      {req.status}
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
