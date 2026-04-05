"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authFetch, type AuthError } from "@/app/lib/auth-fetch";
import type {
  PhysicalCard,
  RequestPhysicalCardPayload,
  UpdatePhysicalCardPayload,
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
      if (error.status === 409) return "already_requested";
      if (error.status === 422) return "inactive_card";
      if (error.status === 400) return "invalid_transition";
      if (error.status === 404) return "not_found";
      return "server_error";
    case "NETWORK_ERROR":
      return "server_error";
    default:
      return "server_error";
  }
}

export async function requestPhysicalCard(
  payload: RequestPhysicalCardPayload
): Promise<ActionResult<PhysicalCard>> {
  const result = await authFetch<PhysicalCard>("/api/cards/physical", {
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
  revalidatePath("/dashboard/physical-cards");
  return { ok: true, data: result.data };
}

export async function updatePhysicalCard(
  id: string,
  payload: UpdatePhysicalCardPayload
): Promise<ActionResult<PhysicalCard>> {
  const result = await authFetch<PhysicalCard>(`/api/admin/physical/${id}`, {
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
  revalidatePath("/dashboard/physical-cards");
  return { ok: true, data: result.data };
}
