"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.API_URL!;

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

  cookieStore.delete("token");
  redirect("/");
}
