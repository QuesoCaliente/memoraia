"use server";

import "server-only";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authFetch, type AuthError } from "@/app/lib/auth-fetch";
import { updateProfile } from "@/app/lib/api";
import type { User, UpdateProfilePayload, TwitchReward } from "@/app/types/auth";
import type { ActionResult } from "@/app/actions/cards";

async function clearTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
}

function mapError(error: AuthError): string {
  switch (error.code) {
    case "NO_TOKEN":
    case "UNAUTHORIZED":
      return "unauthorized";
    case "FORBIDDEN":
      return "forbidden";
    case "BACKEND_ERROR":
      if (error.status === 409) return "conflict";
      return "server_error";
    case "NETWORK_ERROR":
      return "server_error";
    default:
      return "server_error";
  }
}

export async function updateProfileAction(
  payload: UpdateProfilePayload
): Promise<ActionResult<User>> {
  const result = await updateProfile(payload);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true, data: result.data };
}

export async function getRewardsWithStatusAction(): Promise<{
  rewards: TwitchReward[];
  affiliateRequired: boolean;
}> {
  const result = await authFetch<TwitchReward[]>("/api/rewards");
  if (!result.ok) {
    if (
      result.error.code === "BACKEND_ERROR" &&
      result.error.status === 403
    ) {
      return { rewards: [], affiliateRequired: true };
    }
    return { rewards: [], affiliateRequired: false };
  }
  return { rewards: result.data, affiliateRequired: false };
}
