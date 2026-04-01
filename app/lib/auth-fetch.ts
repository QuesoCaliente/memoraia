import 'server-only';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL!;

export type AuthError =
  | { code: 'NO_TOKEN' }
  | { code: 'UNAUTHORIZED'; status: 401 }
  | { code: 'FORBIDDEN'; status: 403 }
  | { code: 'BACKEND_ERROR'; status: number; message: string }
  | { code: 'NETWORK_ERROR'; cause: Error };

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthError };

export async function authFetch<T>(
  path: string,
  options?: RequestInit
): Promise<AuthResult<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return { ok: false, error: { code: 'NO_TOKEN' } };
  }

  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      return { ok: false, error: { code: 'UNAUTHORIZED', status: 401 } };
    }

    if (res.status === 403) {
      return { ok: false, error: { code: 'FORBIDDEN', status: 403 } };
    }

    if (!res.ok) {
      const message = await res.text().catch(() => 'Unknown error');
      return {
        ok: false,
        error: { code: 'BACKEND_ERROR', status: res.status, message },
      };
    }

    const data: T = await res.json();
    return { ok: true, data };
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        cause: cause instanceof Error ? cause : new Error(String(cause)),
      },
    };
  }
}
