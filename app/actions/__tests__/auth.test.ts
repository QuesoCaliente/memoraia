import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/app/lib/auth-fetch', () => ({
  authFetch: vi.fn(),
}));

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authFetch } from '@/app/lib/auth-fetch';

describe('logout()', () => {
  let mockDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockDelete = vi.fn();
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn(),
      delete: mockDelete,
    } as any);
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    vi.mocked(authFetch).mockReset();
  });

  it('calls backend logout via authFetch, deletes cookie, and redirects to /', async () => {
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: null });

    const { logout } = await import('../auth');
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(authFetch).toHaveBeenCalledWith('/auth/logout', { method: 'POST' });
    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'token', path: '/' })
    );
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('still deletes cookie and redirects when authFetch returns error', async () => {
    vi.mocked(authFetch).mockResolvedValue({
      ok: false,
      error: { code: 'BACKEND_ERROR', status: 500, message: 'Internal' },
    });

    const { logout } = await import('../auth');
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'token', path: '/' })
    );
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('still deletes cookie and redirects when authFetch throws', async () => {
    vi.mocked(authFetch).mockRejectedValue(new TypeError('Failed to fetch'));

    const { logout } = await import('../auth');
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'token', path: '/' })
    );
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('includes COOKIE_DOMAIN in delete when env is set', async () => {
    process.env.COOKIE_DOMAIN = '.memoraia.gg';
    vi.mocked(authFetch).mockResolvedValue({ ok: true, data: null });

    const { logout } = await import('../auth');
    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'token', path: '/', domain: '.memoraia.gg' })
    );

    delete process.env.COOKIE_DOMAIN;
  });
});
