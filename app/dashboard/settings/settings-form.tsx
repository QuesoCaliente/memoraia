"use client";

import { useState } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import type { User, TwitchReward } from "@/app/types/auth";

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

export function SettingsForm({ user, rewards, affiliateRequired }: SettingsFormProps) {
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
    if (streamerSlug !== initial.streamerSlug) payload.streamerSlug = streamerSlug;
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

  const inputClass =
    "rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-600 focus:border-zinc-500 disabled:opacity-50";
  const labelClass = "text-sm text-zinc-400";
  const fieldClass = "flex flex-col gap-1";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-md border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Profile
        </p>

        <div className={fieldClass}>
          <label className={labelClass}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            disabled={isPending}
            className={inputClass}
          />
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Bio</label>
          <textarea
            value={streamerBio}
            onChange={(e) => setStreamerBio(e.target.value)}
            placeholder="Tell viewers about yourself"
            rows={3}
            disabled={isPending}
            className={`resize-none ${inputClass}`}
          />
        </div>

        <div className={fieldClass}>
          <label className={labelClass}>Slug</label>
          <input
            type="text"
            value={streamerSlug}
            onChange={(e) => setStreamerSlug(e.target.value)}
            placeholder="your-unique-slug"
            disabled={isPending}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-md border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Card Drop Reward
        </p>

        {affiliateRequired ? (
          <p className="text-sm text-zinc-400">
            Channel Point Rewards require Twitch Affiliate or Partner status.
            Become an Affiliate to configure a reward trigger for card drops.
          </p>
        ) : (
          <div className={fieldClass}>
            <label className={labelClass}>Trigger Reward</label>
            <select
              value={cardDropRewardId}
              onChange={(e) => setCardDropRewardId(e.target.value)}
              disabled={isPending}
              className={inputClass}
            >
              <option value="">— None —</option>
              {rewards.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.cost} points)
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              When a viewer redeems this reward, a card drop will be triggered.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-md bg-green-950 px-3 py-2 text-sm text-green-400">
          Settings saved successfully.
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
