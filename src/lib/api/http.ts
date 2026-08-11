/**
 * The single place the app talks to the network.
 *
 * Backend contract (Madhukar Doc API, OpenAPI 3.0):
 *   base URL   https://madhukar-backend.onrender.com/api/v1
 *   success    { ok: true, data: ... }
 *   error      { ok: false, message, statusCode, timestamp, path, method }
 *   auth       Authorization: Bearer <JWT>, refreshed via /auth/refresh-token
 */

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://madhukar-backend.onrender.com/api/v1";

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
const REFRESH_KEY = "lakshya72.refreshToken";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(token: string, refreshToken?: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
    if (refreshToken) window.localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

type QueryValue = string | number | boolean | undefined | null | string[];

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
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
  /** Internal: prevents an infinite refresh loop. */
  _retried?: boolean;
}

/**
 * Refresh is shared: if several requests 401 at once they await one refresh
 * rather than each firing their own and invalidating the others' tokens.
 */
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  refreshInFlight ??= (async () => {
    try {
      const res = await fetch(buildUrl("/auth/refresh-token"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const payload = await res.json();
      const data = payload?.data ?? payload;
      if (!data?.token) return false;
      tokenStore.set(data.token, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, headers, _retried, ...rest } = options;
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

  // Expired access token — refresh once, then replay the original request
  if (response.status === 401 && !_retried && tokenStore.getRefresh()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, { ...options, _retried: true });

    /*
      Refresh failed, so the session is genuinely over. Clear it and send the
      user to sign in once — otherwise every in-flight query 401s in turn and
      the screen fills with errors that all mean the same thing.
    */
    tokenStore.clear();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.localStorage.removeItem("lakshya72.user");
      window.location.replace("/login?expired=1");
    }
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.ok === false) {
    /*
      Validation failures arrive as a generic message with the useful part in
      `errors` / `details`. Fold those into the message so the UI can show what
      actually went wrong rather than "Validation failed".
    */
    const detail = payload?.errors ?? payload?.details ?? payload?.error;
    const detailText = Array.isArray(detail)
      ? detail
          .map((d: unknown) =>
            typeof d === "string"
              ? d
              : [(d as { field?: string; path?: string }).field ??
                   (d as { path?: string }).path,
                 (d as { message?: string }).message]
                  .filter(Boolean)
                  .join(": "),
          )
          .filter(Boolean)
          .join(" · ")
      : typeof detail === "string"
        ? detail
        : detail && typeof detail === "object"
          ? Object.entries(detail as Record<string, unknown>)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
              .join(" · ")
          : "";

    const base = payload?.message ?? `Request failed (${response.status})`;
    throw new ApiRequestError(
      detailText ? `${base} — ${detailText}` : base,
      payload?.statusCode ?? response.status,
      detail,
    );
  }

  // Success envelope is { ok: true, data: ... }
  return (payload && typeof payload === "object" && "data" in payload
    ? payload.data
    : payload) as T;
}

export const http = {
  get: <T>(path: string, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Simulates network latency so loading states are exercised in dev. */
export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
