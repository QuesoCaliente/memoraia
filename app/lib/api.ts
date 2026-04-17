import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authFetch } from "./auth-fetch";
import type { AuthResult } from "./auth-fetch";
import type { User, UpdateProfilePayload, EnableStreamerResponse, TwitchReward } from "@/app/types/auth";
import type { OverlayData } from "@/app/types/overlay";
import type {
  CardCategory,
  CardTemplate,
  CardCategoryListResponse,
  CardTemplateListResponse,
  TemplateFilters,
  PoolEntryListResponse,
  PoolFilters,
  TierRarityModifier,
  UserCard,
  UserCardListResponse,
  InventoryFilters,
  DustHistoryResponse,
  DustHistoryFilters,
  Battle,
  BattleListResponse,
  BattleFilters,
  MissionListResponse,
  MissionFilters,
  UserMissionListResponse,
  UserMissionFilters,
  PhysicalCardListResponse,
  PhysicalCardFilters,
} from "@/app/types/cards";

async function clearTokenAndRedirect(): Promise<never> {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/");
}

export const getMe = cache(async function getMe(): Promise<User> {
  const result = await authFetch<User>("/auth/me");
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch user: ${result.error.code}`);
  }
  return result.data;
});

export async function updateProfile(
  payload: UpdateProfilePayload
): Promise<AuthResult<User>> {
  return authFetch<User>("/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function enableStreamer(): Promise<AuthResult<EnableStreamerResponse>> {
  return authFetch<EnableStreamerResponse>("/auth/me/enable-streamer", {
    method: "POST",
  });
}

export async function getOverlayKey(): Promise<OverlayData> {
  const result = await authFetch<OverlayData>("/api/overlay/key");
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch overlay key: ${result.error.code}`);
  }
  return result.data;
}

export async function getCategories(streamerId?: string): Promise<CardCategory[]> {
  const params = streamerId ? `?streamerId=${streamerId}` : "";
  const result = await authFetch<CardCategoryListResponse>(`/api/cards/categories${params}`);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch categories: ${result.error.code}`);
  }
  return result.data.data;
}

export async function getTemplates(filters?: TemplateFilters): Promise<CardTemplateListResponse> {
  let path = "/api/cards/templates";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<CardTemplateListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch templates: ${result.error.code}`);
  }
  return result.data;
}

export async function getTemplate(id: string): Promise<CardTemplate> {
  const result = await authFetch<CardTemplate>(`/api/cards/templates/${id}`);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch template: ${result.error.code}`);
  }
  return result.data;
}

export async function getPool(filters?: PoolFilters): Promise<PoolEntryListResponse> {
  let path = "/api/cards/pool";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<PoolEntryListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch pool: ${result.error.code}`);
  }
  return result.data;
}

export async function getInventory(filters?: InventoryFilters): Promise<UserCardListResponse> {
  let path = "/api/cards/inventory";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<UserCardListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch inventory: ${result.error.code}`);
  }
  return result.data;
}

export async function getInventoryCard(id: string): Promise<UserCard> {
  const result = await authFetch<UserCard>(`/api/cards/inventory/${id}`);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch inventory card: ${result.error.code}`);
  }
  return result.data;
}

export async function getModifiers(): Promise<TierRarityModifier[]> {
  const result = await authFetch<TierRarityModifier[]>("/api/cards/modifiers");
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch modifiers: ${result.error.code}`);
  }
  return result.data;
}

export async function getDustHistory(filters?: DustHistoryFilters): Promise<DustHistoryResponse> {
  let path = "/api/cards/dust/history";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<DustHistoryResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch dust history: ${result.error.code}`);
  }
  return result.data;
}

export async function getBattles(filters?: BattleFilters): Promise<BattleListResponse> {
  let path = "/api/battles";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<BattleListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch battles: ${result.error.code}`);
  }
  return result.data;
}

export async function getBattle(id: string): Promise<Battle> {
  const result = await authFetch<Battle>(`/api/battles/${id}`);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch battle: ${result.error.code}`);
  }
  return result.data;
}

export async function getMissions(filters?: MissionFilters): Promise<MissionListResponse> {
  let path = "/api/missions";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<MissionListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch missions: ${result.error.code}`);
  }
  return result.data;
}

export async function getMyMissions(filters?: UserMissionFilters): Promise<UserMissionListResponse> {
  let path = "/api/missions/me";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<UserMissionListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch my missions: ${result.error.code}`);
  }
  return result.data;
}

export async function getRewards(): Promise<TwitchReward[]> {
  const result = await authFetch<TwitchReward[]>("/api/rewards");
  if (!result.ok) return [];
  return result.data;
}

export async function getMyPhysicalCards(filters?: PhysicalCardFilters): Promise<PhysicalCardListResponse> {
  let path = "/api/cards/physical";
  if (filters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) path += `?${qs}`;
  }
  const result = await authFetch<PhysicalCardListResponse>(path);
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenAndRedirect();
    }
    throw new Error(`Failed to fetch physical cards: ${result.error.code}`);
  }
  return result.data;
}
