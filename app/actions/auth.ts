"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authFetch } from "@/app/lib/auth-fetch";
import type { EnableStreamerResponse } from "@/app/types/auth";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function enableStreamer(): Promise<ActionResult<EnableStreamerResponse>> {
  const result = await authFetch<EnableStreamerResponse>("/auth/me/enable-streamer", {
    method: "POST",
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      const cookieStore = await cookies();
      cookieStore.delete("token");
      return { ok: false, error: "unauthorized" };
    }
    return { ok: false, error: "server_error" };
  }
  return { ok: true, data: result.data };
}

export async function logout(): Promise<void> {
  // Backend clears the httpOnly cookie it originally set
  await authFetch("/auth/logout", { method: "POST" });

  // Also clear from Next.js side as fallback
  const cookieStore = await cookies();
  const cookieDomain = process.env.COOKIE_DOMAIN;
  cookieStore.set("token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
  redirect("/");
}
