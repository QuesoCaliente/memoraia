"use server";

import { getInventory as fetchInventory } from "@/app/lib/api";
import type {
  InventoryFilters,
  UserCardListResponse,
} from "@/app/types/cards";

export async function getInventoryAction(
  filters?: InventoryFilters
): Promise<UserCardListResponse> {
  return fetchInventory(filters);
}
