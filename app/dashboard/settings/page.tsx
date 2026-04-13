import { requireStreamer } from "@/app/lib/guards";
import { getRewardsWithStatusAction } from "@/app/actions/profile";
import { SettingsForm } from "./settings-form";
import Link from "next/link";

export default async function SettingsPage() {
  const user = await requireStreamer();
  const { rewards, affiliateRequired } = await getRewardsWithStatusAction();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
      <SettingsForm
        user={user}
        rewards={rewards}
        affiliateRequired={affiliateRequired}
      />
    </div>
  );
}
