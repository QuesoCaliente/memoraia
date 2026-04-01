import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('server-only', () => ({}));

import { cookies } from 'next/headers';

describe('authFetch', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.API_URL = 'http://localhost:3001';
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    vi.clearAllMocks();
  });

  it('returns NO_TOKEN and does not call fetch when no token in cookies', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const { authFetch } = await import('../auth-fetch');
    const result = await authFetch('/some/path');

    expect(result).toEqual({ ok: false, error: { code: 'NO_TOKEN' } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns ok: true with data when fetch returns 200', async () => {
    const token = 'test-token-123';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
    } as any);

    const responseData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValue({
      status: 200,
      ok: true,
      json: vi.fn().mockResolvedValue(responseData),
    });

    const { authFetch } = await import('../auth-fetch');
    const result = await authFetch('/api/resource');

    expect(result).toEqual({ ok: true, data: responseData });
    expect(mockFetch).toHaveBeenCalledOnce();
    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it('returns UNAUTHORIZED when fetch returns 401', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'some-token' }),
    } as any);

    mockFetch.mockResolvedValue({
      status: 401,
      ok: false,
    });

    const { authFetch } = await import('../auth-fetch');
    const result = await authFetch('/api/resource');

    expect(result).toEqual({ ok: false, error: { code: 'UNAUTHORIZED', status: 401 } });
  });

  it('returns NETWORK_ERROR when fetch throws a TypeError', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'some-token' }),
    } as any);

    const networkError = new TypeError('Failed to fetch');
    mockFetch.mockRejectedValue(networkError);

    const { authFetch } = await import('../auth-fetch');
    const result = await authFetch('/api/resource');

    expect(result).toEqual({
      ok: false,
      error: { code: 'NETWORK_ERROR', cause: networkError },
    });
  });

  it('returns BACKEND_ERROR when fetch returns 500', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'some-token' }),
    } as any);

    const errorMessage = 'Internal Server Error';
    mockFetch.mockResolvedValue({
      status: 500,
      ok: false,
      text: vi.fn().mockResolvedValue(errorMessage),
    });

    const { authFetch } = await import('../auth-fetch');
    const result = await authFetch('/api/resource');

    expect(result).toEqual({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: errorMessage },
    });
  });
});
