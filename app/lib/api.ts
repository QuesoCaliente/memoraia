import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

async function fetchWithAuth(path: string, options?: RequestInit) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    redirect("/");
  }

  return res;
}

export interface User {
  userId: string;
  login: string;
  displayName: string;
}

export interface OverlayData {
  overlayKey: string;
  overlayUrl: string;
}

export async function getMe(): Promise<User> {
  const res = await fetchWithAuth("/auth/me");
  return res.json();
}

export async function getOverlayKey(): Promise<OverlayData> {
  const res = await fetchWithAuth("/api/overlay/key");
  return res.json();
}
