import { requireStreamer } from "@/app/lib/guards";
import { getRewardsWithStatusAction } from "@/app/actions/profile";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const user = await requireStreamer();
  const { rewards, affiliateRequired } = await getRewardsWithStatusAction();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      <SettingsForm
        user={user}
        rewards={rewards}
        affiliateRequired={affiliateRequired}
      />
    </div>
  );
}
