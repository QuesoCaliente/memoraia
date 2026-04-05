import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/app/lib/auth-fetch", () => ({
  authFetch: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { authFetch } from "@/app/lib/auth-fetch";

const mockCategory = {
  id: "cat-1",
  streamerId: "s-1",
  origin: "streamer" as const,
  name: "Test Category",
  description: null,
  sortOrder: 0,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockTemplate = {
  id: "t-1",
  streamerId: "s-1",
  origin: "streamer" as const,
  categoryId: "cat-1",
  name: "Test Template",
  description: null,
  imageUrl: "https://example.com/img.png",
  rarity: "common" as const,
  baseAttack: 10,
  baseDefense: 10,
  baseAgility: 10,
  growthAttack: 1,
  growthDefense: 1,
  growthAgility: 1,
  dropWeight: 1,
  isActive: true,
  maxSupply: null,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

const mockMedia = {
  id: "m-1",
  templateId: "t-1",
  mediaType: "image" as const,
  url: "https://example.com/media.png",
  title: null,
  sortOrder: 0,
};

function makeCookieMock() {
  const mockDelete = vi.fn();
  vi.mocked(cookies).mockResolvedValue({ delete: mockDelete } as any);
  return { mockDelete };
}

// ─── createCategory ────────────────────────────────────────────────────────────

describe("createCategory()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: category } and revalidates /dashboard/cards", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockCategory });
    makeCookieMock();

    const { createCategory } = await import("../cards");
    const result = await createCategory({ name: "Test Category" });

    expect(result).toEqual({ ok: true, data: mockCategory });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/cards/categories",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test Category" }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { createCategory } = await import("../cards");
    const result = await createCategory({ name: "Test" });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("FORBIDDEN (403): returns { ok: false, error: 'forbidden' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", status: 403 },
    });
    makeCookieMock();

    const { createCategory } = await import("../cards");
    const result = await createCategory({ name: "Test" });

    expect(result).toEqual({ ok: false, error: "forbidden" });
  });

  it("BACKEND_ERROR: returns { ok: false, error: 'server_error' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 500, message: "Internal Server Error" },
    });
    makeCookieMock();

    const { createCategory } = await import("../cards");
    const result = await createCategory({ name: "Test" });

    expect(result).toEqual({ ok: false, error: "server_error" });
  });
});

// ─── updateCategory ────────────────────────────────────────────────────────────

describe("updateCategory()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data and revalidates /dashboard/cards", async () => {
    const updated = { ...mockCategory, name: "Updated" };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: updated });
    makeCookieMock();

    const { updateCategory } = await import("../cards");
    const result = await updateCategory("cat-1", { name: "Updated" });

    expect(result).toEqual({ ok: true, data: updated });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards");
  });

  it("UNAUTHORIZED: deletes cookie and returns unauthorized", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { updateCategory } = await import("../cards");
    const result = await updateCategory("cat-1", { name: "Updated" });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
  });
});

// ─── deleteCategory ────────────────────────────────────────────────────────────

describe("deleteCategory()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success (204, data: null): returns { ok: true, data: null } and revalidates", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: null });
    makeCookieMock();

    const { deleteCategory } = await import("../cards");
    const result = await deleteCategory("cat-1");

    expect(result).toEqual({ ok: true, data: null });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards");
  });

  it("BACKEND_ERROR status 422: returns { ok: false, error: 'has_templates' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Category has templates" },
    });
    makeCookieMock();

    const { deleteCategory } = await import("../cards");
    const result = await deleteCategory("cat-1");

    expect(result).toEqual({ ok: false, error: "has_templates" });
  });

  it("UNAUTHORIZED: deletes cookie and returns unauthorized", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { deleteCategory } = await import("../cards");
    const result = await deleteCategory("cat-1");

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
  });
});

// ─── createTemplate ────────────────────────────────────────────────────────────

describe("createTemplate()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data and revalidates /dashboard/cards/templates", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockTemplate });
    makeCookieMock();

    const { createTemplate } = await import("../cards");
    const result = await createTemplate({
      origin: "streamer",
      name: "Test Template",
      imageUrl: "https://example.com/img.png",
      rarity: "common",
    });

    expect(result).toEqual({ ok: true, data: mockTemplate });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/templates");
  });

  it("NO_TOKEN: deletes cookie and returns unauthorized", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { createTemplate } = await import("../cards");
    const result = await createTemplate({
      origin: "streamer",
      name: "Test",
      imageUrl: "https://example.com/img.png",
      rarity: "common",
    });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
  });
});

// ─── updateTemplate ────────────────────────────────────────────────────────────

describe("updateTemplate()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data and revalidates /dashboard/cards/templates", async () => {
    const updated = { ...mockTemplate, name: "Updated Template" };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: updated });
    makeCookieMock();

    const { updateTemplate } = await import("../cards");
    const result = await updateTemplate("t-1", { name: "Updated Template" });

    expect(result).toEqual({ ok: true, data: updated });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/templates");
  });

  it("UNAUTHORIZED: deletes cookie and returns unauthorized", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { updateTemplate } = await import("../cards");
    const result = await updateTemplate("t-1", { name: "Updated" });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
  });
});

// ─── deleteTemplate ────────────────────────────────────────────────────────────

describe("deleteTemplate()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data and revalidates /dashboard/cards/templates", async () => {
    const deleteResponse = { id: "t-1", isActive: false as const };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: deleteResponse });
    makeCookieMock();

    const { deleteTemplate } = await import("../cards");
    const result = await deleteTemplate("t-1");

    expect(result).toEqual({ ok: true, data: deleteResponse });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/templates");
  });
});

// ─── addTemplateMedia ──────────────────────────────────────────────────────────

describe("addTemplateMedia()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data and revalidates /dashboard/cards/templates", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockMedia });
    makeCookieMock();

    const { addTemplateMedia } = await import("../cards");
    const result = await addTemplateMedia("t-1", {
      mediaType: "image",
      url: "https://example.com/media.png",
    });

    expect(result).toEqual({ ok: true, data: mockMedia });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/templates");
  });

  it("UNAUTHORIZED: deletes cookie and returns unauthorized", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { addTemplateMedia } = await import("../cards");
    const result = await addTemplateMedia("t-1", {
      mediaType: "image",
      url: "https://example.com/media.png",
    });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
  });
});

// ─── deleteTemplateMedia ───────────────────────────────────────────────────────

describe("deleteTemplateMedia()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success (204, data: null): returns { ok: true, data: null } and revalidates", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: null });
    makeCookieMock();

    const { deleteTemplateMedia } = await import("../cards");
    const result = await deleteTemplateMedia("t-1", "m-1");

    expect(result).toEqual({ ok: true, data: null });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/templates");
  });

  it("UNAUTHORIZED: deletes cookie and returns unauthorized", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { deleteTemplateMedia } = await import("../cards");
    const result = await deleteTemplateMedia("t-1", "m-1");

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
  });
});

// ─── updatePoolEntry ───────────────────────────────────────────────────────────

const mockPoolEntry = {
  id: "pe-1",
  streamerId: "s-1",
  templateId: "t-1",
  customWeight: null,
  isEnabled: true,
  addedAt: "2024-01-01T00:00:00Z",
  template: {
    id: "t-1",
    name: "Test Card",
    rarity: "common" as const,
    imageUrl: "https://example.com/img.png",
    dropWeight: 10,
    isActive: true,
  },
};

describe("updatePoolEntry()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data and revalidates /dashboard/cards/pool", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockPoolEntry });
    makeCookieMock();

    const { updatePoolEntry } = await import("../cards");
    const result = await updatePoolEntry("t-1", { isEnabled: true });

    expect(result).toEqual({ ok: true, data: mockPoolEntry });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/pool");
  });

  it("UNAUTHORIZED: deletes cookie and returns 'unauthorized'", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { updatePoolEntry } = await import("../cards");
    const result = await updatePoolEntry("t-1", { isEnabled: false });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("FORBIDDEN: returns 'forbidden'", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", status: 403 },
    });
    makeCookieMock();

    const { updatePoolEntry } = await import("../cards");
    const result = await updatePoolEntry("t-1", { customWeight: 5 });

    expect(result).toEqual({ ok: false, error: "forbidden" });
  });
});

// ─── updateModifiers ──────────────────────────────────────────────────────────

const mockModifiers = [
  {
    id: "mod-1",
    streamerId: "s-1",
    tier: "1000" as const,
    rarity: "common" as const,
    weightMultiplier: 1.5,
  },
];

describe("updateModifiers()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns data array and revalidates /dashboard/cards/modifiers", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockModifiers });
    makeCookieMock();

    const { updateModifiers } = await import("../cards");
    const result = await updateModifiers({
      modifiers: [{ tier: "1000", rarity: "common", weightMultiplier: 1.5 }],
    });

    expect(result).toEqual({ ok: true, data: mockModifiers });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/cards/modifiers");
  });

  it("UNAUTHORIZED: deletes cookie and returns 'unauthorized'", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { updateModifiers } = await import("../cards");
    const result = await updateModifiers({
      modifiers: [{ tier: "1000", rarity: "common", weightMultiplier: 1.5 }],
    });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
