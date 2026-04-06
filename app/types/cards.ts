export type CardRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type CardOrigin = "system" | "streamer";
export type CardMediaType = "vod" | "image" | "video" | "link";

export interface CardCategory {
  id: string;
  streamerId: string | null;
  origin: CardOrigin;
  name: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CardMedia {
  id: string;
  templateId: string;
  mediaType: CardMediaType;
  url: string;
  title: string | null;
  sortOrder: number;
}

export interface CardTemplate {
  id: string;
  streamerId: string | null;
  origin: CardOrigin;
  categoryId: string | null;
  name: string;
  description: string | null;
  imageUrl: string;
  rarity: CardRarity;
  baseAttack: number;
  baseDefense: number;
  baseAgility: number;
  growthAttack: number;
  growthDefense: number;
  growthAgility: number;
  dropWeight: number;
  isActive: boolean;
  maxSupply: number | null;
  createdAt: string;
  updatedAt: string;
  media?: CardMedia[];
}

export interface CardCategoryListResponse {
  data: CardCategory[];
  total: number;
}

export interface CardTemplateListResponse {
  data: CardTemplate[];
  total: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  sortOrder?: number;
}

export interface CreateTemplatePayload {
  origin: CardOrigin;
  name: string;
  imageUrl: string;
  rarity: CardRarity;
  categoryId?: string;
  description?: string;
  baseAttack?: number;
  baseDefense?: number;
  baseAgility?: number;
  growthAttack?: number;
  growthDefense?: number;
  growthAgility?: number;
  dropWeight?: number;
  maxSupply?: number | null;
}

export interface UpdateTemplatePayload {
  categoryId?: string | null;
  name?: string;
  imageUrl?: string;
  rarity?: CardRarity;
  description?: string;
  baseAttack?: number;
  baseDefense?: number;
  baseAgility?: number;
  growthAttack?: number;
  growthDefense?: number;
  growthAgility?: number;
  dropWeight?: number;
  maxSupply?: number | null;
}

export interface AddMediaPayload {
  mediaType: CardMediaType;
  url: string;
  title?: string;
  sortOrder?: number;
}

export interface DeleteTemplateResponse {
  id: string;
  isActive: false;
}

export interface TemplateFilters {
  streamerId?: string;
  categoryId?: string;
  rarity?: CardRarity;
  origin?: CardOrigin;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// ── Pool ─────────────────────────────────────────────────────────────────────

export type SubscriptionTier = "1000" | "2000" | "3000";

export interface PoolEntry {
  id: string;
  streamerId: string;
  templateId: string;
  customWeight: number | null;
  isEnabled: boolean;
  addedAt: string;
  template: {
    id: string;
    name: string;
    rarity: CardRarity;
    imageUrl: string;
    dropWeight: number;
    isActive: boolean;
  };
}

export interface PoolEntryListResponse {
  data: PoolEntry[];
  total: number;
}

export interface UpdatePoolEntryPayload {
  isEnabled?: boolean;
  customWeight?: number | null;
}

export interface PoolFilters {
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

// ── Tier Rarity Modifiers ────────────────────────────────────────────────────

export interface TierRarityModifier {
  id: string;
  streamerId: string;
  tier: SubscriptionTier;
  rarity: CardRarity;
  weightMultiplier: number;
}

export interface UpdateModifiersPayload {
  modifiers: Array<{
    tier: SubscriptionTier;
    rarity: CardRarity;
    weightMultiplier: number;
  }>;
}

// ── User Cards (Inventory) ───────────────────────────────────────────────────

export interface UserCard {
  id: string;
  ownerId: string;
  templateId: string;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  agility: number;
  obtainedVia: string;
  isActive: boolean;
  destroyedAt: string | null;
  destroyedReason: string | null;
  obtainedAt: string;
  template: {
    id: string;
    name: string;
    rarity: string;
    imageUrl: string;
  };
}

export interface UserCardListResponse {
  data: UserCard[];
  total: number;
}

export interface InventoryFilters {
  templateId?: string;
  rarity?: CardRarity;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

// ── Dust Economy ─────────────────────────────────────────────────────────────

export interface DustTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}

export interface DustHistoryResponse {
  data: DustTransaction[];
  total: number;
  currentBalance: number;
}

export interface DustHistoryFilters {
  reason?: string;
  limit?: number;
  offset?: number;
}

// ── Card Fusion ──────────────────────────────────────────────────────────────

export interface FusePayload {
  targetCardId: string;
  materialCardIds: string[];
}

export interface FuseResponse {
  fusion: {
    id: string;
    targetCardId: string;
    xpGained: number;
    cardsConsumed: number;
    createdAt: string;
  };
  targetCard: UserCard;
}

// ── Dust Operations ──────────────────────────────────────────────────────────

export interface DestroyForDustResponse {
  dustGained: number;
  newBalance: number;
  cardId: string;
  transaction: DustTransaction;
}

export interface CraftCardResponse {
  card: UserCard;
  dustSpent: number;
  newBalance: number;
  transaction: DustTransaction;
}

// ── Battles ──────────────────────────────────────────────────────────────────

export interface Battle {
  id: string;
  streamerId: string;
  challengerCardId: string;
  defenderCardId: string;
  status: "pending" | "finished";
  streamId: string | null;
  createdAt: string;
}

export interface BattleListResponse {
  data: Battle[];
  total: number;
}

export interface BattleFilters {
  streamerId?: string;
  status?: "pending" | "finished";
  limit?: number;
  offset?: number;
}

export interface CreateBattlePayload {
  challengerCardId: string;
  defenderCardId: string;
  streamId?: string;
}

export interface ResolveBattlePayload {
  winnerCardId: string;
}

export interface ResolvedBattle {
  id: string;
  status: "finished";
  winnerCard: UserCard;
  xpGained: number;
  finishedAt: string;
}

// ── Missions ─────────────────────────────────────────────────────────────────

export type MissionType = "daily" | "weekly" | "special";
export type MissionRewardType = "dust" | "card";
export type UserMissionStatus = "in_progress" | "completed" | "claimed";

export interface Mission {
  id: string;
  name: string;
  description: string;
  missionType: MissionType;
  rewardType: MissionRewardType;
  rewardAmount: number;
  rewardCardId: string | null;
  requirements: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface MissionListResponse {
  data: Mission[];
  total: number;
}

export interface MissionFilters {
  missionType?: MissionType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserMission {
  id: string;
  userId: string;
  missionId: string;
  status: UserMissionStatus;
  progress: number;
  claimedAt: string | null;
  createdAt: string;
}

export interface UserMissionListResponse {
  data: UserMission[];
  total: number;
}

export interface UserMissionFilters {
  status?: UserMissionStatus;
  limit?: number;
  offset?: number;
}

export interface ClaimRewardResponse {
  userMission: { id: string; status: "claimed" };
  reward: {
    type: MissionRewardType;
    amount: number;
    card: UserCard | null;
  };
}

export interface CreateMissionPayload {
  name: string;
  description: string;
  missionType: MissionType;
  rewardType: MissionRewardType;
  rewardAmount: number;
  rewardCardId?: string | null;
  requirements: Record<string, unknown>;
}

export interface UpdateMissionPayload {
  name?: string;
  description?: string;
  missionType?: MissionType;
  rewardType?: MissionRewardType;
  rewardAmount?: number;
  rewardCardId?: string | null;
  requirements?: Record<string, unknown>;
  isActive?: boolean;
}

// ── Simulate Drop ───────────────────────────────────────────────────────────

export interface SimulateDropPayload {
  userId: string;
  tier?: SubscriptionTier;
}

export interface SimulateDropResponse {
  user_card_id: string;
  template_id: string;
  template_name: string;
  rarity: CardRarity;
  attack: number;
  defense: number;
  agility: number;
}

// ── Physical Cards ───────────────────────────────────────────────────────────

export type PhysicalCardStatus = "pending" | "approved" | "shipped" | "delivered" | "rejected";

export interface PhysicalCard {
  id: string;
  userCardId: string;
  userId: string;
  status: PhysicalCardStatus;
  verificationCode: string | null;
  shippingInfo: Record<string, unknown> | null;
  createdAt: string;
}

export interface PhysicalCardListResponse {
  data: PhysicalCard[];
  total: number;
}

export interface PhysicalCardFilters {
  status?: PhysicalCardStatus;
  limit?: number;
  offset?: number;
}

export interface RequestPhysicalCardPayload {
  userCardId: string;
  shippingInfo: {
    name: string;
    address: string;
    city: string;
    country: string;
  };
}

export interface UpdatePhysicalCardPayload {
  status?: PhysicalCardStatus;
  verificationCode?: string;
  shippingInfo?: Record<string, unknown>;
}
