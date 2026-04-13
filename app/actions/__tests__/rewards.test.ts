import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/app/lib/api", () => ({
  getRewards: vi.fn(),
}));

import { getRewards } from "@/app/lib/api";
import type { TwitchReward } from "@/app/types/auth";

const mockRewards: TwitchReward[] = [
  {
    id: "reward-1",
    title: "Card Pack",
    cost: 500,
    isEnabled: true,
    image: null,
  },
  {
    id: "reward-2",
    title: "Rare Card",
    cost: 1000,
    isEnabled: true,
    image: "https://example.com/img.png",
  },
];

// ─── getRewardsAction ─────────────────────────────────────────────────────────

describe("getRewardsAction()", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(getRewards).mockReset();
  });

  it("returns rewards array on success", async () => {
    vi.mocked(getRewards).mockResolvedValue(mockRewards);

    const { getRewardsAction } = await import("../rewards");
    const result = await getRewardsAction();

    expect(result).toEqual(mockRewards);
    expect(getRewards).toHaveBeenCalledOnce();
  });

  it("returns empty array when no rewards", async () => {
    vi.mocked(getRewards).mockResolvedValue([]);

    const { getRewardsAction } = await import("../rewards");
    const result = await getRewardsAction();

    expect(result).toEqual([]);
    expect(getRewards).toHaveBeenCalledOnce();
  });

  it("returns empty array on error", async () => {
    vi.mocked(getRewards).mockResolvedValue([]);

    const { getRewardsAction } = await import("../rewards");
    const result = await getRewardsAction();

    expect(result).toEqual([]);
    expect(getRewards).toHaveBeenCalledOnce();
  });
});
