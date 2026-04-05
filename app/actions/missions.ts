"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authFetch, type AuthError } from "@/app/lib/auth-fetch";
import type {
  Mission,
  ClaimRewardResponse,
  CreateMissionPayload,
  UpdateMissionPayload,
} from "@/app/types/cards";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

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
      if (error.status === 400) return "bad_request";
      if (error.status === 404) return "not_found";
      if (error.status === 422) return "not_claimable";
      return "server_error";
    case "NETWORK_ERROR":
      return "server_error";
    default:
      return "server_error";
  }
}

export async function claimMissionReward(
  missionId: string
): Promise<ActionResult<ClaimRewardResponse>> {
  const result = await authFetch<ClaimRewardResponse>(
    `/api/missions/${missionId}/claim`,
    { method: "POST" }
  );
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/missions");
  return { ok: true, data: result.data };
}

export async function createMission(
  payload: CreateMissionPayload
): Promise<ActionResult<Mission>> {
  const result = await authFetch<Mission>("/api/admin/missions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/missions");
  return { ok: true, data: result.data };
}

export async function updateMission(
  id: string,
  payload: UpdateMissionPayload
): Promise<ActionResult<Mission>> {
  const result = await authFetch<Mission>(`/api/admin/missions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/missions");
  return { ok: true, data: result.data };
}
