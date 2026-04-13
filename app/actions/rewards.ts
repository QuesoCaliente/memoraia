"use server";

import "server-only";
import { getRewards } from "@/app/lib/api";

export async function getRewardsAction() {
  return getRewards();
}
