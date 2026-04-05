import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const FRONTEND_URL = 'http://localhost:3000';

describe('GET /api/auth/callback', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.API_URL = 'http://localhost:3001';
    process.env.NEXT_PUBLIC_FRONTEND_URL = FRONTEND_URL;
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    vi.resetModules();
    vi.clearAllMocks();
  });

  function makeRequest() {
    return new NextRequest('http://localhost:3000/api/auth/callback');
  }

  it('redirects to /dashboard when cookie exists and /auth/me returns 200', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'valid-token' }),
    } as any);

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { GET } = await import('../route');
    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${FRONTEND_URL}/dashboard`);
  });

  it('redirects to /auth/error when cookie exists and /auth/me returns 401', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'bad-token' }),
    } as any);

    mockFetch.mockResolvedValue({ ok: false, status: 401 });

    const { GET } = await import('../route');
    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${FRONTEND_URL}/auth/error`);
  });

  it('redirects to /auth/error when cookie exists and /auth/me returns 500', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'some-token' }),
    } as any);

    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const { GET } = await import('../route');
    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${FRONTEND_URL}/auth/error`);
  });

  it('redirects to /auth/error when no cookie is present', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const { GET } = await import('../route');
    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${FRONTEND_URL}/auth/error`);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('redirects to /auth/error when fetch to /auth/me throws a network error', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'some-token' }),
    } as any);

    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const { GET } = await import('../route');
    const response = await GET(makeRequest());

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${FRONTEND_URL}/auth/error`);
  });

  it('forwards the cookie header correctly to /auth/me', async () => {
    const token = 'forwarded-token-xyz';
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: token }),
    } as any);

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { GET } = await import('../route');
    await GET(makeRequest());

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/me');
    expect(options.headers.Cookie).toBe(`token=${token}`);
  });

  it('does NOT call cookieStore.set() or cookieStore.delete()', async () => {
    const mockGet = vi.fn().mockReturnValue({ value: 'some-token' });
    const mockSet = vi.fn();
    const mockDelete = vi.fn();

    vi.mocked(cookies).mockResolvedValue({
      get: mockGet,
      set: mockSet,
      delete: mockDelete,
    } as any);

    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const { GET } = await import('../route');
    await GET(makeRequest());

    expect(mockSet).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
