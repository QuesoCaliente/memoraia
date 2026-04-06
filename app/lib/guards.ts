import "server-only";
import { redirect } from "next/navigation";
import { getMe } from "./api";
import type { User } from "@/app/types/auth";

export async function requireAuth(): Promise<User> {
  return getMe();
}

export async function requireStreamer(): Promise<User> {
  const user = await requireAuth();
  if (!user.streamerEnabled) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}
