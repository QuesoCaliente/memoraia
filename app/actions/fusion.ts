"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authFetch, type AuthError } from "@/app/lib/auth-fetch";
import type {
  FusePayload,
  FuseResponse,
  DestroyForDustResponse,
  CraftCardResponse,
} from "@/app/types/cards";

export type ActionResult<T> =
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
      if (error.status === 404) return "not_found";
      if (error.status === 409) return "conflict";
      if (error.status === 422) return "invalid_fusion";
      return "server_error";
    case "NETWORK_ERROR":
      return "server_error";
    default:
      return "server_error";
  }
}

export async function fuseCards(
  payload: FusePayload
): Promise<ActionResult<FuseResponse>> {
  const result = await authFetch<FuseResponse>("/api/cards/fuse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
      redirect("/");
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/fuse");
  return { ok: true, data: result.data };
}

export async function destroyCardForDust(
  cardId: string
): Promise<ActionResult<DestroyForDustResponse>> {
  const result = await authFetch<DestroyForDustResponse>(
    "/api/cards/dust/destroy",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId }),
    }
  );
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
      redirect("/");
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/dust");
  return { ok: true, data: result.data };
}

export async function craftCard(
  templateId: string
): Promise<ActionResult<CraftCardResponse>> {
  const result = await authFetch<CraftCardResponse>("/api/cards/dust/craft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
      redirect("/");
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/inventory/dust");
  return { ok: true, data: result.data };
}
