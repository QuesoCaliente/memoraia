"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPhysicalCard } from "@/app/actions/physical-cards";
import type { PhysicalCard, PhysicalCardStatus } from "@/app/types/cards";

interface PhysicalCardListProps {
  initialRequests: PhysicalCard[];
  total: number;
}

const STATUS_BADGE: Record<PhysicalCardStatus, string> = {
  pending: "bg-amber-900 text-amber-300",
  approved: "bg-blue-900 text-blue-300",
  shipped: "bg-purple-900 text-purple-300",
  delivered: "bg-green-900 text-green-300",
  rejected: "bg-red-900 text-red-300",
};

const ERROR_MESSAGES: Record<string, string> = {
  already_requested: "A physical card request already exists for this card",
  inactive_card: "This card is not active",
  forbidden: "You don't own this card",
  unauthorized: "Session expired. Please log in again.",
  server_error: "Something went wrong. Please try again.",
};

const EMPTY_SHIPPING = { name: "", address: "", city: "", country: "" };

export function PhysicalCardList({ initialRequests, total }: PhysicalCardListProps) {
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
        setSubmitError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.server_error);
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
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Request a Physical Card</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400" htmlFor="userCardId">
              Card ID
            </label>
            <input
              id="userCardId"
              type="text"
              value={userCardId}
              onChange={(e) => setUserCardId(e.target.value)}
              required
              placeholder="Enter your card ID"
              className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-medium text-zinc-400">Shipping Information</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-zinc-500" htmlFor="shippingName">
                  Full Name
                </label>
                <input
                  id="shippingName"
                  type="text"
                  value={shipping.name}
                  onChange={(e) => handleShippingChange("name", e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-zinc-500" htmlFor="shippingCountry">
                  Country
                </label>
                <input
                  id="shippingCountry"
                  type="text"
                  value={shipping.country}
                  onChange={(e) => handleShippingChange("country", e.target.value)}
                  required
                  placeholder="US"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-zinc-500" htmlFor="shippingAddress">
                  Address
                </label>
                <input
                  id="shippingAddress"
                  type="text"
                  value={shipping.address}
                  onChange={(e) => handleShippingChange("address", e.target.value)}
                  required
                  placeholder="123 Main St"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-zinc-500" htmlFor="shippingCity">
                  City
                </label>
                <input
                  id="shippingCity"
                  type="text"
                  value={shipping.city}
                  onChange={(e) => handleShippingChange("city", e.target.value)}
                  required
                  placeholder="Springfield"
                  className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </fieldset>

          {submitError && (
            <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Submitting…" : "Request Physical Card"}
          </button>
        </form>
      </div>

      {/* Requests list */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">
          Your Requests{" "}
          <span className="text-sm font-normal text-zinc-500">({total})</span>
        </h2>

        {requests.length === 0 ? (
          <p className="text-sm text-zinc-500">No physical card requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs text-zinc-400">
                      Card ID:{" "}
                      <span className="font-mono text-zinc-300">{req.userCardId}</span>
                    </p>
                    {req.verificationCode && (
                      <p className="text-xs text-zinc-400">
                        Verification Code:{" "}
                        <span className="font-mono text-zinc-300">{req.verificationCode}</span>
                      </p>
                    )}
                    <p className="text-xs text-zinc-500">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[req.status]}`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
