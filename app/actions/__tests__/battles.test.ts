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
import type { Battle, ResolvedBattle } from "@/app/types/cards";

const mockBattle: Battle = {
  id: "battle-1",
  streamerId: "streamer-1",
  challengerCardId: "card-1",
  defenderCardId: "card-2",
  status: "pending",
  streamId: null,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockResolvedBattle: ResolvedBattle = {
  id: "battle-1",
  status: "finished",
  winnerCard: {
    id: "card-1",
    ownerId: "user-1",
    templateId: "t-1",
    level: 2,
    xp: 150,
    attack: 10,
    defense: 8,
    agility: 6,
    obtainedVia: "pack",
    isActive: true,
    destroyedAt: null,
    destroyedReason: null,
    obtainedAt: "2024-01-01T00:00:00Z",
    template: {
      id: "t-1",
      name: "Test Card",
      rarity: "common",
      imageUrl: "https://example.com/img.png",
    },
  },
  xpGained: 50,
  finishedAt: "2024-01-01T01:00:00Z",
};

function makeCookieMock() {
  const mockDelete = vi.fn();
  vi.mocked(cookies).mockResolvedValue({ delete: mockDelete } as any);
  return { mockDelete };
}

// ─── createBattle ─────────────────────────────────────────────────────────────

describe("createBattle()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: Battle } and revalidates /dashboard/battles", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockBattle });
    makeCookieMock();

    const { createBattle } = await import("../battles");
    const payload = { challengerCardId: "card-1", defenderCardId: "card-2" };
    const result = await createBattle(payload);

    expect(result).toEqual({ ok: true, data: mockBattle });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/battles",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/battles");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { createBattle } = await import("../battles");
    const result = await createBattle({ challengerCardId: "card-1", defenderCardId: "card-2" });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("FORBIDDEN (403): returns { ok: false, error: 'forbidden' } and does NOT delete cookie", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", status: 403 },
    });
    const { mockDelete } = makeCookieMock();

    const { createBattle } = await import("../battles");
    const result = await createBattle({ challengerCardId: "card-1", defenderCardId: "card-2" });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(mockDelete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (400): returns { ok: false, error: 'bad_request' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 400, message: "Bad request" },
    });
    makeCookieMock();

    const { createBattle } = await import("../battles");
    const result = await createBattle({ challengerCardId: "card-1", defenderCardId: "card-2" });

    expect(result).toEqual({ ok: false, error: "bad_request" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'unprocessable' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Unprocessable entity" },
    });
    makeCookieMock();

    const { createBattle } = await import("../battles");
    const result = await createBattle({ challengerCardId: "card-1", defenderCardId: "card-2" });

    expect(result).toEqual({ ok: false, error: "unprocessable" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (404): returns { ok: false, error: 'not_found' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 404, message: "Not found" },
    });
    makeCookieMock();

    const { createBattle } = await import("../battles");
    const result = await createBattle({ challengerCardId: "card-1", defenderCardId: "card-2" });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── resolveBattle ────────────────────────────────────────────────────────────

describe("resolveBattle()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: ResolvedBattle } and revalidates /dashboard/battles", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockResolvedBattle });
    makeCookieMock();

    const { resolveBattle } = await import("../battles");
    const payload = { winnerCardId: "card-1" };
    const result = await resolveBattle("battle-1", payload);

    expect(result).toEqual({ ok: true, data: mockResolvedBattle });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/battles/battle-1/resolve",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/battles");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { resolveBattle } = await import("../battles");
    const result = await resolveBattle("battle-1", { winnerCardId: "card-1" });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("FORBIDDEN (403): returns { ok: false, error: 'forbidden' } and does NOT delete cookie", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", status: 403 },
    });
    const { mockDelete } = makeCookieMock();

    const { resolveBattle } = await import("../battles");
    const result = await resolveBattle("battle-1", { winnerCardId: "card-1" });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(mockDelete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (400): returns { ok: false, error: 'bad_request' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 400, message: "Bad request" },
    });
    makeCookieMock();

    const { resolveBattle } = await import("../battles");
    const result = await resolveBattle("battle-1", { winnerCardId: "card-1" });

    expect(result).toEqual({ ok: false, error: "bad_request" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'unprocessable' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Unprocessable entity" },
    });
    makeCookieMock();

    const { resolveBattle } = await import("../battles");
    const result = await resolveBattle("battle-1", { winnerCardId: "card-1" });

    expect(result).toEqual({ ok: false, error: "unprocessable" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
