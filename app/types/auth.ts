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
  dust: number;
}

/** Fields accepted by PATCH /auth/me. At least one field required. */
export type UpdateProfilePayload = {
  displayName?: string;
  streamerBio?: string;
  streamerSlug?: string;
} & ({ displayName: string } | { streamerBio: string } | { streamerSlug: string });

/** Response from POST /auth/me/enable-streamer */
export interface EnableStreamerResponse {
  id: string;
  streamerEnabled: true;
}
