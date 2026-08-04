/**
 * The single place the app talks to the network.
 *
 * While NEXT_PUBLIC_USE_MOCK_API is "true", services short-circuit to the
 * mock layer and this file is never called. When the swagger lands, flip the
 * env var and fill in `API_BASE_URL` — no component changes required.
 */

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const TOKEN_KEY = "lakshya72.token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

type QueryValue = string | number | boolean | undefined | null | string[];

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(
    path.startsWith("/") ? `${API_BASE_URL}${path}` : path,
    API_BASE_URL,
  );
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, v));
      else url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  query?: Record<string, QueryValue>;
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, headers, ...rest } = options;
  const token = tokenStore.get();

  const response = await fetch(buildUrl(path, query), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiRequestError(
      payload?.message ?? `Request failed (${response.status})`,
      response.status,
      payload?.errors,
    );
  }

  // CONFIRM: backend may return the resource directly rather than
  // wrapping it in { success, data }. Unwrap defensively for now.
  return (payload && typeof payload === "object" && "data" in payload
    ? payload.data
    : payload) as T;
}

export const http = {
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Simulates network latency so loading states are exercised in dev. */
export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
