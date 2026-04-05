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
import type { PhysicalCard } from "@/app/types/cards";

const mockPhysicalCard: PhysicalCard = {
  id: "physical-1",
  userCardId: "card-1",
  userId: "user-1",
  status: "pending",
  verificationCode: null,
  shippingInfo: null,
  createdAt: "2024-01-01T00:00:00Z",
};

function makeCookieMock() {
  const mockDelete = vi.fn();
  vi.mocked(cookies).mockResolvedValue({ delete: mockDelete } as any);
  return { mockDelete };
}

// ─── requestPhysicalCard ──────────────────────────────────────────────────────

describe("requestPhysicalCard()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: PhysicalCard } and revalidates /dashboard/physical-cards", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockPhysicalCard });
    makeCookieMock();

    const { requestPhysicalCard } = await import("../physical-cards");
    const payload = {
      userCardId: "card-1",
      shippingInfo: {
        name: "John Doe",
        address: "123 Main St",
        city: "Springfield",
        country: "US",
      },
    };
    const result = await requestPhysicalCard(payload);

    expect(result).toEqual({ ok: true, data: mockPhysicalCard });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/cards/physical",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/physical-cards");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { requestPhysicalCard } = await import("../physical-cards");
    const result = await requestPhysicalCard({
      userCardId: "card-1",
      shippingInfo: { name: "John Doe", address: "123 Main St", city: "Springfield", country: "US" },
    });

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

    const { requestPhysicalCard } = await import("../physical-cards");
    const result = await requestPhysicalCard({
      userCardId: "card-1",
      shippingInfo: { name: "John Doe", address: "123 Main St", city: "Springfield", country: "US" },
    });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(mockDelete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (409): returns { ok: false, error: 'already_requested' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 409, message: "Conflict" },
    });
    makeCookieMock();

    const { requestPhysicalCard } = await import("../physical-cards");
    const result = await requestPhysicalCard({
      userCardId: "card-1",
      shippingInfo: { name: "John Doe", address: "123 Main St", city: "Springfield", country: "US" },
    });

    expect(result).toEqual({ ok: false, error: "already_requested" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'inactive_card' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Inactive card" },
    });
    makeCookieMock();

    const { requestPhysicalCard } = await import("../physical-cards");
    const result = await requestPhysicalCard({
      userCardId: "card-1",
      shippingInfo: { name: "John Doe", address: "123 Main St", city: "Springfield", country: "US" },
    });

    expect(result).toEqual({ ok: false, error: "inactive_card" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── updatePhysicalCard ───────────────────────────────────────────────────────

describe("updatePhysicalCard()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: PhysicalCard } and revalidates /dashboard/physical-cards", async () => {
    const updatedCard: PhysicalCard = { ...mockPhysicalCard, status: "approved" };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: updatedCard });
    makeCookieMock();

    const { updatePhysicalCard } = await import("../physical-cards");
    const payload = { status: "approved" as const };
    const result = await updatePhysicalCard("physical-1", payload);

    expect(result).toEqual({ ok: true, data: updatedCard });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/admin/physical/physical-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/physical-cards");
  });

  it("FORBIDDEN (403): returns { ok: false, error: 'forbidden' } and does NOT delete cookie", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", status: 403 },
    });
    const { mockDelete } = makeCookieMock();

    const { updatePhysicalCard } = await import("../physical-cards");
    const result = await updatePhysicalCard("physical-1", { status: "approved" });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(mockDelete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (400): returns { ok: false, error: 'invalid_transition' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 400, message: "Invalid status transition" },
    });
    makeCookieMock();

    const { updatePhysicalCard } = await import("../physical-cards");
    const result = await updatePhysicalCard("physical-1", { status: "shipped" });

    expect(result).toEqual({ ok: false, error: "invalid_transition" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (404): returns { ok: false, error: 'not_found' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 404, message: "Not found" },
    });
    makeCookieMock();

    const { updatePhysicalCard } = await import("../physical-cards");
    const result = await updatePhysicalCard("physical-999", { status: "approved" });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
