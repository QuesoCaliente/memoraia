"use server";

import { authFetch } from "@/app/lib/auth-fetch";
import type { OverlayData } from "@/app/types/overlay";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function regenerateOverlayKey(): Promise<ActionResult<OverlayData>> {
  const result = await authFetch<OverlayData>("/api/overlay/key/regenerate", {
    method: "POST",
  });

  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      return { ok: false, error: "unauthorized" };
    }
    return { ok: false, error: "server_error" };
  }

  return { ok: true, data: result.data };
}

export async function testOverlayRedemption(): Promise<ActionResult<{ connections: number }>> {
  const result = await authFetch<{ connections: number }>("/api/overlay/test", {
    method: "POST",
  });

  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      return { ok: false, error: "unauthorized" };
    }
    return { ok: false, error: "server_error" };
  }

  return { ok: true, data: result.data };
}
