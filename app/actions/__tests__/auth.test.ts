import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

describe('logout()', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockDelete: ReturnType<typeof vi.fn>;
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.API_URL = 'http://localhost:3001';
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    mockDelete = vi.fn();
    mockGet = vi.fn();
    vi.mocked(cookies).mockResolvedValue({
      get: mockGet,
      delete: mockDelete,
    } as any);
    // redirect throws a special Next.js error to interrupt execution — simulate that
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    vi.clearAllMocks();
    // re-apply redirect mock after clearAllMocks
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  it('calls backend logout, deletes cookie, and redirects to / on 200', async () => {
    const token = 'my-session-token';
    mockGet.mockReturnValue({ value: token });
    mockFetch.mockResolvedValue({ status: 200, ok: true });

    const { logout } = await import('../auth');

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('http://localhost:3001/auth/logout');
    expect(options.method).toBe('POST');
    expect(options.headers.Cookie).toBe(`token=${token}`);

    expect(mockDelete).toHaveBeenCalledWith('token');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('still deletes cookie and redirects when backend returns 500', async () => {
    mockGet.mockReturnValue({ value: 'some-token' });
    mockFetch.mockResolvedValue({ status: 500, ok: false });

    const { logout } = await import('../auth');

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDelete).toHaveBeenCalledWith('token');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('skips backend fetch but still deletes cookie and redirects when no token', async () => {
    mockGet.mockReturnValue(undefined);

    const { logout } = await import('../auth');

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith('token');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('still deletes cookie and redirects when fetch throws a network error', async () => {
    mockGet.mockReturnValue({ value: 'some-token' });
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const { logout } = await import('../auth');

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDelete).toHaveBeenCalledWith('token');
    expect(redirect).toHaveBeenCalledWith('/');
  });
});
