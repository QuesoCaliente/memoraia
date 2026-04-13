import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('../auth-fetch', () => ({
  authFetch: vi.fn(),
}));

import { authFetch } from '../auth-fetch';
import type { AuthResult } from '../auth-fetch';
import type { User, EnableStreamerResponse, TwitchReward } from '@/app/types/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type {
  CardCategory,
  CardTemplate,
  CardCategoryListResponse,
  CardTemplateListResponse,
  PoolEntry,
  PoolEntryListResponse,
  TierRarityModifier,
  UserCard,
  UserCardListResponse,
  DustTransaction,
  DustHistoryResponse,
  Battle,
  BattleListResponse,
  Mission,
  MissionListResponse,
  UserMission,
  UserMissionListResponse,
  PhysicalCard,
  PhysicalCardListResponse,
} from '@/app/types/cards';

describe('updateProfile()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { ok: true, data: User } when authFetch returns ok', async () => {
    const user: User = {
      id: 'u1',
      twitchId: 'tw1',
      login: 'tester',
      displayName: 'Tester',
      avatarUrl: null,
      role: 'user',
      streamerEnabled: false,
      streamerBio: null,
      streamerSlug: null,
      cardDropRewardId: null,
      dust: 0,
    };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: user });

    const { updateProfile } = await import('../api');
    const result = await updateProfile({ displayName: 'Tester' });

    expect(result).toEqual({ ok: true, data: user });
  });

  it('calls authFetch with PATCH /auth/me, Content-Type header, and JSON body', async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: {} as User });

    const { updateProfile } = await import('../api');
    await updateProfile({ displayName: 'NewName', streamerBio: 'Bio' });

    expect(authFetch).toHaveBeenCalledWith('/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'NewName', streamerBio: 'Bio' }),
    });
  });

  it('returns { ok: false, error: BACKEND_ERROR 400 } when authFetch returns 400', async () => {
    const error: AuthResult<User> = {
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 400, message: 'Bad Request' },
    };
    vi.mocked(authFetch).mockResolvedValue(error);

    const { updateProfile } = await import('../api');
    const result = await updateProfile({ displayName: 'X' });

    expect(result).toEqual({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 400, message: 'Bad Request' },
    });
  });

  it('returns { ok: false, error: BACKEND_ERROR 409 } when authFetch returns 409', async () => {
    const error: AuthResult<User> = {
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 409, message: 'Conflict' },
    };
    vi.mocked(authFetch).mockResolvedValue(error);

    const { updateProfile } = await import('../api');
    const result = await updateProfile({ streamerSlug: 'taken-slug' });

    expect(result).toEqual({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 409, message: 'Conflict' },
    });
  });

  it('returns { ok: false, error: NO_TOKEN } when authFetch returns NO_TOKEN', async () => {
    const error: AuthResult<User> = {
      ok: false,
      error: { code: 'NO_TOKEN' },
    };
    vi.mocked(authFetch).mockResolvedValue(error);

    const { updateProfile } = await import('../api');
    const result = await updateProfile({ displayName: 'X' });

    expect(result).toEqual({ ok: false, error: { code: 'NO_TOKEN' } });
  });
});

describe('enableStreamer()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { ok: true, data: { id, streamerEnabled: true } } when authFetch returns ok', async () => {
    const data: EnableStreamerResponse = { id: 'u1', streamerEnabled: true };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data });

    const { enableStreamer } = await import('../api');
    const result = await enableStreamer();

    expect(result).toEqual({ ok: true, data: { id: 'u1', streamerEnabled: true } });
  });

  it('calls authFetch with POST /auth/me/enable-streamer and no body', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      data: { id: 'u1', streamerEnabled: true } as EnableStreamerResponse,
    });

    const { enableStreamer } = await import('../api');
    await enableStreamer();

    expect(authFetch).toHaveBeenCalledWith('/auth/me/enable-streamer', {
      method: 'POST',
    });
  });

  it('returns { ok: false, error: UNAUTHORIZED } when authFetch returns 401', async () => {
    const error: AuthResult<EnableStreamerResponse> = {
      ok: false,
      error: { code: 'UNAUTHORIZED', status: 401 },
    };
    vi.mocked(authFetch).mockResolvedValue(error);

    const { enableStreamer } = await import('../api');
    const result = await enableStreamer();

    expect(result).toEqual({
      ok: false,
      error: { code: 'UNAUTHORIZED', status: 401 },
    });
  });
});

describe('getCategories()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('calls authFetch with /api/cards/categories and returns the data array', async () => {
    const categories: CardCategory[] = [
      {
        id: 'cat-1',
        streamerId: null,
        origin: 'system',
        name: 'Test Category',
        description: null,
        sortOrder: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];
    const response: CardCategoryListResponse = { data: categories, total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getCategories } = await import('../api');
    const result = await getCategories();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/categories');
    expect(result).toEqual(categories);
  });

  it('calls authFetch with streamerId query param when provided', async () => {
    const categories: CardCategory[] = [];
    const response: CardCategoryListResponse = { data: categories, total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getCategories } = await import('../api');
    await getCategories('streamer-1');

    expect(authFetch).toHaveBeenCalledWith('/api/cards/categories?streamerId=streamer-1');
  });

  it('calls redirect when authFetch returns NO_TOKEN', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getCategories } = await import('../api');
    await expect(getCategories()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('throws when authFetch returns BACKEND_ERROR', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: 'Internal Server Error' },
    });

    const { getCategories } = await import('../api');
    await expect(getCategories()).rejects.toThrow('Failed to fetch categories: BACKEND_ERROR');
  });
});

describe('getTemplates()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('calls authFetch with /api/cards/templates and returns { data, total }', async () => {
    const response: CardTemplateListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getTemplates } = await import('../api');
    const result = await getTemplates();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/templates');
    expect(result).toEqual(response);
  });

  it('appends filter query params to the URL', async () => {
    const response: CardTemplateListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getTemplates } = await import('../api');
    await getTemplates({ rarity: 'rare', isActive: true });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('rarity=rare');
    expect(calledWith).toContain('isActive=true');
    expect(calledWith).toMatch(/^\/api\/cards\/templates\?/);
  });

  it('calls redirect when authFetch returns NO_TOKEN', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getTemplates } = await import('../api');
    await expect(getTemplates()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('getTemplate()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('calls authFetch with /api/cards/templates/:id and returns the template', async () => {
    const template: CardTemplate = {
      id: 't-1',
      streamerId: null,
      origin: 'system',
      categoryId: null,
      name: 'Test Template',
      description: null,
      imageUrl: 'https://example.com/image.png',
      rarity: 'common',
      baseAttack: 10,
      baseDefense: 10,
      baseAgility: 10,
      growthAttack: 1,
      growthDefense: 1,
      growthAgility: 1,
      dropWeight: 1,
      isActive: true,
      maxSupply: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: template });

    const { getTemplate } = await import('../api');
    const result = await getTemplate('t-1');

    expect(authFetch).toHaveBeenCalledWith('/api/cards/templates/t-1');
    expect(result).toEqual(template);
  });
});

describe('getPool()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/cards/pool and returns full response', async () => {
    const entry: PoolEntry = {
      id: 'pe-1',
      streamerId: 's-1',
      templateId: 't-1',
      customWeight: null,
      isEnabled: true,
      addedAt: '2024-01-01T00:00:00.000Z',
      template: {
        id: 't-1',
        name: 'Test Card',
        rarity: 'common',
        imageUrl: 'https://example.com/img.png',
        dropWeight: 10,
        isActive: true,
      },
    };
    const response: PoolEntryListResponse = { data: [entry], total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getPool } = await import('../api');
    const result = await getPool();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/pool');
    expect(result).toEqual(response);
  });

  it('with filters: appends query params to the URL', async () => {
    const response: PoolEntryListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getPool } = await import('../api');
    await getPool({ isEnabled: true, limit: 10 });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('isEnabled=true');
    expect(calledWith).toContain('limit=10');
    expect(calledWith).toMatch(/^\/api\/cards\/pool\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getPool } = await import('../api');
    await expect(getPool()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('getModifiers()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success: calls /api/cards/modifiers and returns array', async () => {
    const modifiers: TierRarityModifier[] = [
      {
        id: 'mod-1',
        streamerId: 's-1',
        tier: '1000',
        rarity: 'common',
        weightMultiplier: 1.5,
      },
    ];
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: modifiers });

    const { getModifiers } = await import('../api');
    const result = await getModifiers();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/modifiers');
    expect(result).toEqual(modifiers);
  });

  it('UNAUTHORIZED: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'UNAUTHORIZED', status: 401 },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getModifiers } = await import('../api');
    await expect(getModifiers()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('getInventory()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/cards/inventory and returns { data, total }', async () => {
    const card: UserCard = {
      id: 'uc-1',
      ownerId: 'u-1',
      templateId: 't-1',
      level: 1,
      xp: 0,
      attack: 10,
      defense: 10,
      agility: 10,
      obtainedVia: 'drop',
      isActive: true,
      destroyedAt: null,
      destroyedReason: null,
      obtainedAt: '2024-01-01T00:00:00.000Z',
      template: {
        id: 't-1',
        name: 'Test Card',
        rarity: 'common',
        imageUrl: 'https://example.com/img.png',
      },
    };
    const response: UserCardListResponse = { data: [card], total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getInventory } = await import('../api');
    const result = await getInventory();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/inventory');
    expect(result).toEqual(response);
  });

  it('with filters: appends query params to the URL', async () => {
    const response: UserCardListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getInventory } = await import('../api');
    await getInventory({ rarity: 'rare', isActive: true, limit: 10 });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('rarity=rare');
    expect(calledWith).toContain('isActive=true');
    expect(calledWith).toContain('limit=10');
    expect(calledWith).toMatch(/^\/api\/cards\/inventory\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getInventory } = await import('../api');
    await expect(getInventory()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('BACKEND_ERROR: throws with "Failed to fetch inventory"', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: 'Internal Server Error' },
    });

    const { getInventory } = await import('../api');
    await expect(getInventory()).rejects.toThrow('Failed to fetch inventory');
  });
});

describe('getInventoryCard()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success: calls /api/cards/inventory/:id and returns UserCard', async () => {
    const card: UserCard = {
      id: 'card-1',
      ownerId: 'u-1',
      templateId: 't-1',
      level: 1,
      xp: 0,
      attack: 10,
      defense: 10,
      agility: 10,
      obtainedVia: 'drop',
      isActive: true,
      destroyedAt: null,
      destroyedReason: null,
      obtainedAt: '2024-01-01T00:00:00.000Z',
      template: {
        id: 't-1',
        name: 'Test Card',
        rarity: 'common',
        imageUrl: 'https://example.com/img.png',
      },
    };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: card });

    const { getInventoryCard } = await import('../api');
    const result = await getInventoryCard('card-1');

    expect(authFetch).toHaveBeenCalledWith('/api/cards/inventory/card-1');
    expect(result).toEqual(card);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getInventoryCard } = await import('../api');
    await expect(getInventoryCard('card-1')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('BACKEND_ERROR 403: throws', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 403, message: 'Forbidden' },
    });

    const { getInventoryCard } = await import('../api');
    await expect(getInventoryCard('card-1')).rejects.toThrow('Failed to fetch inventory card');
  });
});

describe('getDustHistory()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/cards/dust/history and returns { data, total, currentBalance }', async () => {
    const transaction: DustTransaction = {
      id: 'tx-1',
      amount: -10,
      balanceAfter: 90,
      reason: 'card_destroy',
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const response: DustHistoryResponse = {
      data: [transaction],
      total: 1,
      currentBalance: 90,
    };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getDustHistory } = await import('../api');
    const result = await getDustHistory();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/dust/history');
    expect(result).toEqual(response);
  });

  it('with filters: appends query params to the URL', async () => {
    const response: DustHistoryResponse = { data: [], total: 0, currentBalance: 100 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getDustHistory } = await import('../api');
    await getDustHistory({ reason: 'card_destroy', limit: 10, offset: 0 });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('reason=card_destroy');
    expect(calledWith).toContain('limit=10');
    expect(calledWith).toContain('offset=0');
    expect(calledWith).toMatch(/^\/api\/cards\/dust\/history\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getDustHistory } = await import('../api');
    await expect(getDustHistory()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('BACKEND_ERROR: throws with "Failed to fetch dust history"', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: 'Internal Server Error' },
    });

    const { getDustHistory } = await import('../api');
    await expect(getDustHistory()).rejects.toThrow('Failed to fetch dust history');
  });
});

describe('getBattles()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/battles and returns { data, total }', async () => {
    const battle: Battle = {
      id: 'b-1',
      streamerId: 's-1',
      challengerCardId: 'c-1',
      defenderCardId: 'd-1',
      status: 'pending',
      streamId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const response: BattleListResponse = { data: [battle], total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getBattles } = await import('../api');
    const result = await getBattles();

    expect(authFetch).toHaveBeenCalledWith('/api/battles');
    expect(result).toEqual(response);
  });

  it('with { status: "pending" }: URL has ?status=pending', async () => {
    const response: BattleListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getBattles } = await import('../api');
    await getBattles({ status: 'pending' });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('status=pending');
    expect(calledWith).toMatch(/^\/api\/battles\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getBattles } = await import('../api');
    await expect(getBattles()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('BACKEND_ERROR: throws', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: 'Internal Server Error' },
    });

    const { getBattles } = await import('../api');
    await expect(getBattles()).rejects.toThrow('Failed to fetch battles');
  });
});

describe('getBattle()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success: calls /api/battles/b-1 and returns Battle', async () => {
    const battle: Battle = {
      id: 'b-1',
      streamerId: 's-1',
      challengerCardId: 'c-1',
      defenderCardId: 'd-1',
      status: 'pending',
      streamId: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: battle });

    const { getBattle } = await import('../api');
    const result = await getBattle('b-1');

    expect(authFetch).toHaveBeenCalledWith('/api/battles/b-1');
    expect(result).toEqual(battle);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getBattle } = await import('../api');
    await expect(getBattle('b-1')).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('BACKEND_ERROR 404: throws', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 404, message: 'Not Found' },
    });

    const { getBattle } = await import('../api');
    await expect(getBattle('b-1')).rejects.toThrow('Failed to fetch battle');
  });
});

describe('getMissions()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/missions and returns { data, total }', async () => {
    const mission: Mission = {
      id: 'm-1',
      name: 'Daily Login',
      description: 'Log in today',
      missionType: 'daily',
      rewardType: 'dust',
      rewardAmount: 50,
      rewardCardId: null,
      requirements: {},
      isActive: true,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const response: MissionListResponse = { data: [mission], total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getMissions } = await import('../api');
    const result = await getMissions();

    expect(authFetch).toHaveBeenCalledWith('/api/missions');
    expect(result).toEqual(response);
  });

  it('with { missionType: "daily" }: URL has ?missionType=daily', async () => {
    const response: MissionListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getMissions } = await import('../api');
    await getMissions({ missionType: 'daily' });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('missionType=daily');
    expect(calledWith).toMatch(/^\/api\/missions\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getMissions } = await import('../api');
    await expect(getMissions()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('getMyMissions()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/missions/me and returns { data, total }', async () => {
    const userMission: UserMission = {
      id: 'um-1',
      userId: 'u-1',
      missionId: 'm-1',
      status: 'in_progress',
      progress: 0,
      claimedAt: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const response: UserMissionListResponse = { data: [userMission], total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getMyMissions } = await import('../api');
    const result = await getMyMissions();

    expect(authFetch).toHaveBeenCalledWith('/api/missions/me');
    expect(result).toEqual(response);
  });

  it('with { status: "completed" }: URL has ?status=completed', async () => {
    const response: UserMissionListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getMyMissions } = await import('../api');
    await getMyMissions({ status: 'completed' });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('status=completed');
    expect(calledWith).toMatch(/^\/api\/missions\/me\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getMyMissions } = await import('../api');
    await expect(getMyMissions()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('getMyPhysicalCards()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success (no filters): calls /api/cards/physical and returns { data, total }', async () => {
    const card: PhysicalCard = {
      id: 'pc-1',
      userCardId: 'uc-1',
      userId: 'u-1',
      status: 'pending',
      verificationCode: null,
      shippingInfo: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const response: PhysicalCardListResponse = { data: [card], total: 1 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getMyPhysicalCards } = await import('../api');
    const result = await getMyPhysicalCards();

    expect(authFetch).toHaveBeenCalledWith('/api/cards/physical');
    expect(result).toEqual(response);
  });

  it('with { status: "shipped" }: URL has ?status=shipped', async () => {
    const response: PhysicalCardListResponse = { data: [], total: 0 };
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: response });

    const { getMyPhysicalCards } = await import('../api');
    await getMyPhysicalCards({ status: 'shipped' });

    const calledWith = vi.mocked(authFetch).mock.calls[0][0] as string;
    expect(calledWith).toContain('status=shipped');
    expect(calledWith).toMatch(/^\/api\/cards\/physical\?/);
  });

  it('NO_TOKEN: redirect called', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    const { getMyPhysicalCards } = await import('../api');
    await expect(getMyPhysicalCards()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});

describe('getRewards()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      delete: vi.fn(),
    } as any);
  });

  it('success: calls /api/rewards and returns array of TwitchReward', async () => {
    const rewards: TwitchReward[] = [
      {
        id: 'r-1',
        title: 'Card Drop',
        cost: 100,
        isEnabled: true,
        image: null,
      },
    ];
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: rewards });

    const { getRewards } = await import('../api');
    const result = await getRewards();

    expect(authFetch).toHaveBeenCalledWith('/api/rewards');
    expect(result).toEqual(rewards);
  });

  it('returns empty array when authFetch returns error', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: 'Internal Server Error' },
    });

    const { getRewards } = await import('../api');
    const result = await getRewards();

    expect(result).toEqual([]);
  });

  it('returns empty array when authFetch returns NO_TOKEN', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'NO_TOKEN' },
    });

    const { getRewards } = await import('../api');
    const result = await getRewards();

    expect(result).toEqual([]);
  });
});
