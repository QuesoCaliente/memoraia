export interface User {
  id: string;
  twitchId: string;
  login: string;
  displayName: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  streamerEnabled: boolean;
  streamerBio: string | null;
  streamerSlug: string | null;
  cardDropRewardId: string | null;
  dust: number;
}

/** Fields accepted by PATCH /auth/me. At least one field required. */
export type UpdateProfilePayload = {
  displayName?: string;
  streamerBio?: string;
  streamerSlug?: string;
  cardDropRewardId?: string | null;
} & ({ displayName: string } | { streamerBio: string } | { streamerSlug: string } | { cardDropRewardId: string | null });

export interface TwitchReward {
  id: string;
  title: string;
  cost: number;
  isEnabled: boolean;
  image: string | null;
}

/** Response from POST /auth/me/enable-streamer */
export interface EnableStreamerResponse {
  id: string;
  streamerEnabled: true;
}
