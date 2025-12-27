/*
  Minimal fetch client with:
  - base URL from NEXT_PUBLIC_API_URL
  - bearer auth
  - automatic refresh on 401 (once)
  - JSON + FormData support
*/

export class ApiError extends Error {
  status: number;
  details?: any;
  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const LS_ACCESS = 'colonygo:accessToken';
const LS_REFRESH = 'colonygo:refreshToken';

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
}

export function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null as string | null, refreshToken: null as string | null };
  return {
    accessToken: window.localStorage.getItem(LS_ACCESS),
    refreshToken: window.localStorage.getItem(LS_REFRESH),
  };
}

export function setTokens(accessToken: string | null, refreshToken: string | null) {
  if (typeof window === 'undefined') return;
  if (accessToken) window.localStorage.setItem(LS_ACCESS, accessToken);
  else window.localStorage.removeItem(LS_ACCESS);
  if (refreshToken) window.localStorage.setItem(LS_REFRESH, refreshToken);
  else window.localStorage.removeItem(LS_REFRESH);
}

type FetchOpts = RequestInit & {
  auth?: boolean;
  retryOnAuthFail?: boolean;
};

async function parseMaybeJson(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export async function apiFetch<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  const auth = opts.auth !== false;
  const retry = opts.retryOnAuthFail !== false;

  const headers = new Headers(opts.headers || undefined);
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  if (!isForm && !headers.has('Content-Type') && opts.body && typeof opts.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const { accessToken } = getTokens();
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  if (res.status === 401 && auth && retry) {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      try {
        const refreshed = await apiFetch<{ accessToken: string; refreshToken: string }>(
          '/auth/refresh',
          {
            method: 'POST',
            auth: false,
            retryOnAuthFail: false,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          }
        );
        setTokens(refreshed.accessToken, refreshed.refreshToken);
        return apiFetch<T>(path, { ...opts, retryOnAuthFail: false });
      } catch {
        // fallthrough
      }
    }
  }

  if (!res.ok) {
    const body = await parseMaybeJson(res).catch(() => undefined);
    const msg = (body && (body.message || body.error)) ? String(body.message || body.error) : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, body);
  }

  return (await parseMaybeJson(res)) as T;
}

export const api = {
  get: <T = any>(path: string, opts: FetchOpts = {}) => apiFetch<T>(path, { ...opts, method: 'GET' }),
  post: <T = any>(path: string, body?: any, opts: FetchOpts = {}) =>
    apiFetch<T>(path, {
      ...opts,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
      headers: body instanceof FormData ? opts.headers : { 'Content-Type': 'application/json', ...(opts.headers as any) },
    }),
  patch: <T = any>(path: string, body?: any, opts: FetchOpts = {}) =>
    apiFetch<T>(path, {
      ...opts,
      method: 'PATCH',
      body: JSON.stringify(body ?? {}),
      headers: { 'Content-Type': 'application/json', ...(opts.headers as any) },
    }),
  delete: <T = any>(path: string, opts: FetchOpts = {}) => apiFetch<T>(path, { ...opts, method: 'DELETE' }),
};
