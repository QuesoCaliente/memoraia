"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authFetch, type AuthError } from "@/app/lib/auth-fetch";
import type {
  Battle,
  CreateBattlePayload,
  ResolveBattlePayload,
  ResolvedBattle,
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
      if (error.status === 422) return "unprocessable";
      return "server_error";
    case "NETWORK_ERROR":
      return "server_error";
    default:
      return "server_error";
  }
}

export async function createBattle(
  payload: CreateBattlePayload
): Promise<ActionResult<Battle>> {
  const result = await authFetch<Battle>("/api/battles", {
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
  revalidatePath("/dashboard/battles");
  return { ok: true, data: result.data };
}

export async function resolveBattle(
  id: string,
  payload: ResolveBattlePayload
): Promise<ActionResult<ResolvedBattle>> {
  const result = await authFetch<ResolvedBattle>(`/api/battles/${id}/resolve`, {
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
  revalidatePath("/dashboard/battles");
  return { ok: true, data: result.data };
}
