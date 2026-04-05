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

const mockFuseResponse = {
  fusion: {
    id: "fusion-1",
    targetCardId: "card-1",
    xpGained: 100,
    cardsConsumed: 2,
    createdAt: "2024-01-01T00:00:00Z",
  },
  targetCard: {
    id: "card-1",
    userId: "user-1",
    templateId: "t-1",
    level: 2,
    xp: 100,
    obtainedAt: "2024-01-01T00:00:00Z",
    template: {
      id: "t-1",
      name: "Test Card",
      rarity: "common" as const,
      imageUrl: "https://example.com/img.png",
    },
  },
};

const mockDestroyForDustResponse = {
  dustGained: 50,
  newBalance: 150,
  cardId: "card-1",
  transaction: {
    id: "tx-1",
    userId: "user-1",
    amount: 50,
    type: "earned" as const,
    reason: "card_destroyed",
    createdAt: "2024-01-01T00:00:00Z",
  },
};

const mockCraftCardResponse = {
  card: {
    id: "card-2",
    userId: "user-1",
    templateId: "t-2",
    level: 1,
    xp: 0,
    obtainedAt: "2024-01-01T00:00:00Z",
    template: {
      id: "t-2",
      name: "Crafted Card",
      rarity: "rare" as const,
      imageUrl: "https://example.com/crafted.png",
    },
  },
  dustSpent: 100,
  newBalance: 50,
  transaction: {
    id: "tx-2",
    userId: "user-1",
    amount: -100,
    type: "spent" as const,
    reason: "card_crafted",
    createdAt: "2024-01-01T00:00:00Z",
  },
};

function makeCookieMock() {
  const mockDelete = vi.fn();
  vi.mocked(cookies).mockResolvedValue({ delete: mockDelete } as any);
  return { mockDelete };
}

// ─── fuseCards ────────────────────────────────────────────────────────────────

describe("fuseCards()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: FuseResponse } and revalidates /dashboard/inventory", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockFuseResponse });
    makeCookieMock();

    const { fuseCards } = await import("../inventory");
    const result = await fuseCards({ targetCardId: "card-1", materialCardIds: ["card-2", "card-3"] });

    expect(result).toEqual({ ok: true, data: mockFuseResponse });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/cards/fuse",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetCardId: "card-1", materialCardIds: ["card-2", "card-3"] }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inventory");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { fuseCards } = await import("../inventory");
    const result = await fuseCards({ targetCardId: "card-1", materialCardIds: ["card-2"] });

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

    const { fuseCards } = await import("../inventory");
    const result = await fuseCards({ targetCardId: "card-1", materialCardIds: ["card-2"] });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'invalid_fusion' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Invalid fusion" },
    });
    makeCookieMock();

    const { fuseCards } = await import("../inventory");
    const result = await fuseCards({ targetCardId: "card-1", materialCardIds: ["card-2"] });

    expect(result).toEqual({ ok: false, error: "invalid_fusion" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (409): returns { ok: false, error: 'conflict' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 409, message: "Conflict" },
    });
    makeCookieMock();

    const { fuseCards } = await import("../inventory");
    const result = await fuseCards({ targetCardId: "card-1", materialCardIds: ["card-2"] });

    expect(result).toEqual({ ok: false, error: "conflict" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── destroyForDust ───────────────────────────────────────────────────────────

describe("destroyForDust()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: DestroyForDustResponse } and revalidates /dashboard/inventory", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockDestroyForDustResponse });
    makeCookieMock();

    const { destroyForDust } = await import("../inventory");
    const result = await destroyForDust("card-1");

    expect(result).toEqual({ ok: true, data: mockDestroyForDustResponse });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/cards/dust/destroy",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: "card-1" }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inventory");
  });

  it("UNAUTHORIZED: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "UNAUTHORIZED", status: 401 },
    });
    const { mockDelete } = makeCookieMock();

    const { destroyForDust } = await import("../inventory");
    const result = await destroyForDust("card-1");

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'undestroyable' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Card cannot be destroyed" },
    });
    makeCookieMock();

    const { destroyForDust } = await import("../inventory");
    const result = await destroyForDust("card-1");

    expect(result).toEqual({ ok: false, error: "undestroyable" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── craftCard ────────────────────────────────────────────────────────────────

describe("craftCard()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: CraftCardResponse } and revalidates /dashboard/inventory", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockCraftCardResponse });
    makeCookieMock();

    const { craftCard } = await import("../inventory");
    const result = await craftCard("t-2");

    expect(result).toEqual({ ok: true, data: mockCraftCardResponse });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/cards/dust/craft",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "t-2" }),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/inventory");
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'craft_failed' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Insufficient dust" },
    });
    makeCookieMock();

    const { craftCard } = await import("../inventory");
    const result = await craftCard("t-2");

    expect(result).toEqual({ ok: false, error: "craft_failed" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (404): returns { ok: false, error: 'not_found' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 404, message: "Template not found" },
    });
    makeCookieMock();

    const { craftCard } = await import("../inventory");
    const result = await craftCard("t-2");

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
