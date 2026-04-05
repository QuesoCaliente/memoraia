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
import type { Mission, ClaimRewardResponse } from "@/app/types/cards";

const mockMission: Mission = {
  id: "mission-1",
  name: "Test Mission",
  description: "Complete 5 battles",
  missionType: "daily",
  rewardType: "dust",
  rewardAmount: 100,
  rewardCardId: null,
  requirements: { battles: 5 },
  isActive: true,
  createdAt: "2024-01-01T00:00:00Z",
};

const mockClaimRewardResponse: ClaimRewardResponse = {
  userMission: { id: "user-mission-1", status: "claimed" },
  reward: {
    type: "dust",
    amount: 100,
    card: null,
  },
};

function makeCookieMock() {
  const mockDelete = vi.fn();
  vi.mocked(cookies).mockResolvedValue({ delete: mockDelete } as any);
  return { mockDelete };
}

// ─── claimMissionReward ───────────────────────────────────────────────────────

describe("claimMissionReward()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: ClaimRewardResponse } and revalidates /dashboard/missions", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      data: mockClaimRewardResponse,
    });
    makeCookieMock();

    const { claimMissionReward } = await import("../missions");
    const result = await claimMissionReward("mission-1");

    expect(result).toEqual({ ok: true, data: mockClaimRewardResponse });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/missions/mission-1/claim",
      expect.objectContaining({ method: "POST" })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/missions");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { claimMissionReward } = await import("../missions");
    const result = await claimMissionReward("mission-1");

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (404): returns { ok: false, error: 'not_found' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 404, message: "Not found" },
    });
    makeCookieMock();

    const { claimMissionReward } = await import("../missions");
    const result = await claimMissionReward("mission-1");

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("BACKEND_ERROR (422): returns { ok: false, error: 'not_claimable' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 422, message: "Mission not claimable" },
    });
    makeCookieMock();

    const { claimMissionReward } = await import("../missions");
    const result = await claimMissionReward("mission-1");

    expect(result).toEqual({ ok: false, error: "not_claimable" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── createMission ────────────────────────────────────────────────────────────

describe("createMission()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: Mission } and revalidates /dashboard/missions", async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: mockMission });
    makeCookieMock();

    const { createMission } = await import("../missions");
    const payload = {
      name: "Test Mission",
      description: "Complete 5 battles",
      missionType: "daily" as const,
      rewardType: "dust" as const,
      rewardAmount: 100,
      requirements: { battles: 5 },
    };
    const result = await createMission(payload);

    expect(result).toEqual({ ok: true, data: mockMission });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/admin/missions",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/missions");
  });

  it("NO_TOKEN: deletes cookie and returns { ok: false, error: 'unauthorized' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "NO_TOKEN" },
    });
    const { mockDelete } = makeCookieMock();

    const { createMission } = await import("../missions");
    const result = await createMission({
      name: "Test Mission",
      description: "desc",
      missionType: "daily",
      rewardType: "dust",
      rewardAmount: 100,
      requirements: {},
    });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(mockDelete).toHaveBeenCalledWith("token");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("FORBIDDEN: returns { ok: false, error: 'forbidden' } and does NOT delete cookie", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "FORBIDDEN", status: 403 },
    });
    const { mockDelete } = makeCookieMock();

    const { createMission } = await import("../missions");
    const result = await createMission({
      name: "Test Mission",
      description: "desc",
      missionType: "daily",
      rewardType: "dust",
      rewardAmount: 100,
      requirements: {},
    });

    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(mockDelete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

// ─── updateMission ────────────────────────────────────────────────────────────

describe("updateMission()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(revalidatePath).mockReset();
    vi.mocked(authFetch).mockReset();
  });

  it("success: returns { ok: true, data: Mission } and revalidates /dashboard/missions", async () => {
    const updatedMission: Mission = { ...mockMission, name: "Updated Mission" };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: updatedMission });
    makeCookieMock();

    const { updateMission } = await import("../missions");
    const payload = { name: "Updated Mission" };
    const result = await updateMission("mission-1", payload);

    expect(result).toEqual({ ok: true, data: updatedMission });
    expect(authFetch).toHaveBeenCalledWith(
      "/api/admin/missions/mission-1",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/missions");
  });

  it("BACKEND_ERROR (404): returns { ok: false, error: 'not_found' }", async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: "BACKEND_ERROR", status: 404, message: "Not found" },
    });
    makeCookieMock();

    const { updateMission } = await import("../missions");
    const result = await updateMission("mission-999", { name: "X" });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
