import { redirect } from "next/navigation";
import { authFetch } from "./auth-fetch";
import type { User } from "@/app/types/auth";
import type { OverlayData } from "@/app/types/overlay";

export async function getMe(): Promise<User> {
  const result = await authFetch<User>("/auth/me");
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      redirect("/");
    }
    throw new Error(`Failed to fetch user: ${result.error.code}`);
  }
  return result.data;
}

export async function getOverlayKey(): Promise<OverlayData> {
  const result = await authFetch<OverlayData>("/api/overlay/key");
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      redirect("/");
    }
    throw new Error(`Failed to fetch overlay key: ${result.error.code}`);
  }
  return result.data;
}
