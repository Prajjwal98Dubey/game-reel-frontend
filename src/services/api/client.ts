import type { z } from 'zod';

import { env } from '@/config/env';
import { GuestResponseSchema, type GuestRequest } from '@/shared';
import { hasValidToken, useSessionStore } from '@/stores/session';

import { ApiError, ContractError } from './errors';

type Method = 'GET' | 'POST';

const REQUEST_TIMEOUT_MS = 15_000;

type RequestOptions<S extends z.ZodType | undefined> = {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | null | undefined>;
  /** Response schema. Omit for endpoints with no body (e.g. 202 Accepted). */
  schema?: S;
  /** Public endpoints skip the auth header. */
  auth?: boolean;
  signal?: AbortSignal;
};

type Result<S> = S extends z.ZodType ? z.infer<S> : void;

function buildUrl(path: string, query?: RequestOptions<undefined>['query']): string {
  const url = `${env.apiUrl}${path}`;
  if (!query) return url;
  const params = Object.entries(query)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${url}?${params.join('&')}` : url;
}

let pendingAuth: Promise<string> | null = null;

/** Creates or resumes the guest player and stores its token. Concurrent callers share one request. */
export function ensureToken(force = false): Promise<string> {
  const session = useSessionStore.getState();
  if (!force && hasValidToken(session) && session.token) return Promise.resolve(session.token);
  if (!pendingAuth) {
    const body: GuestRequest = { deviceId: session.deviceId };
    pendingAuth = send('/v1/players/guest', { method: 'POST', body, schema: GuestResponseSchema, auth: false })
      .then((res) => {
        useSessionStore.getState().setSession({
          playerId: res.playerId,
          token: res.token,
          expiresInSec: res.expiresIn,
        });
        return res.token;
      })
      .finally(() => {
        pendingAuth = null;
      });
  }
  return pendingAuth;
}

async function send<S extends z.ZodType | undefined>(
  path: string,
  opts: RequestOptions<S>,
  token?: string,
): Promise<Result<S>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-App-Version': env.appVersion,
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  // A stalled connection must fail (and be retried) rather than hang the screen forever.
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const abort = () => timeout.abort();
  if (opts.signal?.aborted) abort();
  else opts.signal?.addEventListener('abort', abort);
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: timeout.signal,
    });
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener('abort', abort);
  }
  if (!res.ok) throw await ApiError.fromResponse(res);
  if (!opts.schema) return undefined as Result<S>;

  const json: unknown = await res.json();
  const parsed = opts.schema.safeParse(json);
  if (!parsed.success) throw new ContractError(path, parsed.error.message);
  return parsed.data as Result<S>;
}

/**
 * The one door to the API: adds base URL, auth and app version headers, and parses every
 * response with its zod schema. A 401 refreshes the guest token once and retries.
 */
export async function request<S extends z.ZodType | undefined = undefined>(
  path: string,
  opts: RequestOptions<S> = {},
): Promise<Result<S>> {
  if (opts.auth === false) return send(path, opts);
  const token = await ensureToken();
  try {
    return await send(path, opts, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      useSessionStore.getState().clearToken();
      return send(path, opts, await ensureToken(true));
    }
    throw err;
  }
}
