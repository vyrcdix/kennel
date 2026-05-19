import type { ApiErrorBody } from '../../shared/errors';

/** Thrown for any non-2xx HTTP response with the server's structured error body
 *  preserved. Callers (actions.ts) can `instanceof` check against this and
 *  re-throw as a typed domain error (ValidationError, SlugConflictError). */
export class ApiError extends Error {
  status: number;
  body: ApiErrorBody;
  constructor(status: number, body: ApiErrorBody) {
    super(`api ${status}: ${body.error}`);
    this.status = status;
    this.body = body;
    this.name = 'ApiError';
  }
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** Walk a JSON-parsed value and convert ISO-8601 strings to Date objects.
 *  Keeps the type contract of selectors (Date everywhere) intact. */
export const materializeDates = <T>(value: T): T => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => materializeDates(v)) as unknown as T;
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'string' && ISO_DATE_RE.test(v)) {
        out[k] = new Date(v);
      } else {
        out[k] = materializeDates(v);
      }
    }
    return out as T;
  }
  return value;
};

const request = async (
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> => {
  const res = await fetch(path, {
    method,
    headers: body != null ? { 'Content-Type': 'application/json' } : undefined,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const parsed = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, parsed as ApiErrorBody);
  }
  return parsed;
};

export const api = {
  get: async <T>(path: string): Promise<T> =>
    materializeDates((await request('GET', path)) as T),
  post: async <T>(path: string, body?: unknown): Promise<T> =>
    materializeDates((await request('POST', path, body)) as T),
  put: async <T>(path: string, body?: unknown): Promise<T> =>
    materializeDates((await request('PUT', path, body)) as T),
  patch: async <T>(path: string, body?: unknown): Promise<T> =>
    materializeDates((await request('PATCH', path, body)) as T),
  del: async (path: string): Promise<void> => {
    await request('DELETE', path);
  },
};
