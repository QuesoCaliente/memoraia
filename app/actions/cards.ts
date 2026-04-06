"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { authFetch, type AuthError } from "@/app/lib/auth-fetch";
import type {
  CardCategory,
  CardTemplate,
  CardMedia,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CreateTemplatePayload,
  UpdateTemplatePayload,
  AddMediaPayload,
  DeleteTemplateResponse,
  PoolEntry,
  UpdatePoolEntryPayload,
  TierRarityModifier,
  UpdateModifiersPayload,
  SimulateDropPayload,
  SimulateDropResponse,
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
      if (error.status === 422) return "has_templates";
      return "server_error";
    case "NETWORK_ERROR":
      return "server_error";
    default:
      return "server_error";
  }
}

export async function createCategory(
  payload: CreateCategoryPayload
): Promise<ActionResult<CardCategory>> {
  const result = await authFetch<CardCategory>("/api/cards/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards");
  return { ok: true, data: result.data };
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload
): Promise<ActionResult<CardCategory>> {
  const result = await authFetch<CardCategory>(`/api/cards/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards");
  return { ok: true, data: result.data };
}

export async function deleteCategory(id: string): Promise<ActionResult<null>> {
  const result = await authFetch<null>(`/api/cards/categories/${id}`, {
    method: "DELETE",
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards");
  return { ok: true, data: null };
}

export async function createTemplate(
  payload: CreateTemplatePayload
): Promise<ActionResult<CardTemplate>> {
  const result = await authFetch<CardTemplate>("/api/cards/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/templates");
  return { ok: true, data: result.data };
}

export async function updateTemplate(
  id: string,
  payload: UpdateTemplatePayload
): Promise<ActionResult<CardTemplate>> {
  const result = await authFetch<CardTemplate>(`/api/cards/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/templates");
  return { ok: true, data: result.data };
}

export async function deleteTemplate(
  id: string
): Promise<ActionResult<DeleteTemplateResponse>> {
  const result = await authFetch<DeleteTemplateResponse>(
    `/api/cards/templates/${id}`,
    { method: "DELETE" }
  );
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/templates");
  return { ok: true, data: result.data };
}

export async function addTemplateMedia(
  templateId: string,
  payload: AddMediaPayload
): Promise<ActionResult<CardMedia>> {
  const result = await authFetch<CardMedia>(
    `/api/cards/templates/${templateId}/media`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/templates");
  return { ok: true, data: result.data };
}

export async function deleteTemplateMedia(
  templateId: string,
  mediaId: string
): Promise<ActionResult<null>> {
  const result = await authFetch<null>(
    `/api/cards/templates/${templateId}/media/${mediaId}`,
    { method: "DELETE" }
  );
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/templates");
  return { ok: true, data: null };
}

export async function updatePoolEntry(
  templateId: string,
  payload: UpdatePoolEntryPayload
): Promise<ActionResult<PoolEntry>> {
  const result = await authFetch<PoolEntry>(`/api/cards/pool/${templateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/pool");
  return { ok: true, data: result.data };
}

export async function updateModifiers(
  payload: UpdateModifiersPayload
): Promise<ActionResult<TierRarityModifier[]>> {
  const result = await authFetch<TierRarityModifier[]>("/api/cards/modifiers", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
    }
    return { ok: false, error: mapError(result.error) };
  }
  revalidatePath("/dashboard/cards/modifiers");
  return { ok: true, data: result.data };
}

export async function simulateDrop(
  payload: SimulateDropPayload
): Promise<ActionResult<SimulateDropResponse>> {
  const result = await authFetch<SimulateDropResponse>("/api/cards/drop/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!result.ok) {
    if (result.error.code === "NO_TOKEN" || result.error.code === "UNAUTHORIZED") {
      await clearTokenCookie();
      return { ok: false, error: "unauthorized" };
    }
    if (result.error.code === "BACKEND_ERROR") {
      if (result.error.status === 403) return { ok: false, error: "forbidden" };
      if (result.error.status === 404) return { ok: false, error: "user_not_found" };
      if (result.error.status === 422) return { ok: false, error: "empty_pool" };
    }
    return { ok: false, error: "server_error" };
  }
  return { ok: true, data: result.data };
}
