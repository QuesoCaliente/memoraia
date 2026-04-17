"use client";

import { useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { User, TwitchReward } from "@/app/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckIcon, TriangleAlertIcon } from "lucide-react";

interface SettingsFormProps {
  user: User;
  rewards: TwitchReward[];
  affiliateRequired: boolean;
}

function mapFormError(error: string): string {
  switch (error) {
    case "conflict":
      return "This slug is already taken. Please choose another.";
    case "forbidden":
      return "Streamer permissions required.";
    case "unauthorized":
      return "Session expired. Please log in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function SettingsForm({
  user,
  rewards,
  affiliateRequired,
}: SettingsFormProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [streamerBio, setStreamerBio] = useState(user.streamerBio ?? "");
  const [streamerSlug, setStreamerSlug] = useState(user.streamerSlug ?? "");
  const [cardDropRewardId, setCardDropRewardId] = useState(
    user.cardDropRewardId ?? ""
  );

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initial = {
    displayName: user.displayName,
    streamerBio: user.streamerBio ?? "",
    streamerSlug: user.streamerSlug ?? "",
    cardDropRewardId: user.cardDropRewardId ?? "",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const payload: Record<string, string | null> = {};
    if (displayName !== initial.displayName) payload.displayName = displayName;
    if (streamerBio !== initial.streamerBio) payload.streamerBio = streamerBio;
    if (streamerSlug !== initial.streamerSlug)
      payload.streamerSlug = streamerSlug;
    if (cardDropRewardId !== initial.cardDropRewardId) {
      payload.cardDropRewardId = cardDropRewardId || null;
    }

    if (Object.keys(payload).length === 0) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    setIsPending(true);
    try {
      const result = await updateProfileAction(
        payload as Parameters<typeof updateProfileAction>[0]
      );
      if (!result.ok) {
        if (result.error === "unauthorized") {
          window.location.href = "/";
          return;
        }
        setError(mapFormError(result.error));
        setTimeout(() => setError(null), 4000);
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="streamerBio">Bio</Label>
            <Textarea
              id="streamerBio"
              value={streamerBio}
              onChange={(e) => setStreamerBio(e.target.value)}
              placeholder="Tell viewers about yourself"
              rows={3}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="streamerSlug">Slug</Label>
            <Input
              id="streamerSlug"
              type="text"
              value={streamerSlug}
              onChange={(e) => setStreamerSlug(e.target.value)}
              placeholder="your-unique-slug"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Card Drop Reward
          </CardTitle>
        </CardHeader>
        <CardContent>
          {affiliateRequired ? (
            <p className="text-sm text-muted-foreground">
              Channel Point Rewards require Twitch Affiliate or Partner status.
              Become an Affiliate to configure a reward trigger for card drops.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cardDropRewardId">Trigger Reward</Label>
              <Select
                value={cardDropRewardId}
                onValueChange={(value) => setCardDropRewardId(value ?? "")}
                disabled={isPending}
              >
                <SelectTrigger id="cardDropRewardId" className="w-full">
                  <SelectValue placeholder="— None —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
                  {rewards.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.title} ({r.cost} points)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                When a viewer redeems this reward, a card drop will be
                triggered.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <TriangleAlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckIcon />
          <AlertDescription>Settings saved successfully.</AlertDescription>
        </Alert>
      )}

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
