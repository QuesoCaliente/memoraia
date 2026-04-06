"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authFetch } from "@/app/lib/auth-fetch";
import type { EnableStreamerResponse } from "@/app/types/auth";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const API_URL = process.env.API_URL!;

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
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Cookie: `token=${token}` },
      });
    } catch {
      // Backend unreachable — still clear local cookie
    }
  }

  const cookieDomain = process.env.COOKIE_DOMAIN;
  cookieStore.delete({
    name: "token",
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
  redirect("/");
}
