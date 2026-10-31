// Browser-side calls to the backend. The types come from the backend itself
// (type-only import, so no server code reaches the bundle).
import type { ErrorResponse, MeResponse, SignInResponse } from "../../../backend/src/api-types";
import { SITE } from "../site";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// A sleeping free-tier server can take up to a minute to answer the first call
const TIMEOUT_MS = 90_000;

async function request<T>(path: string, opts: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(SITE.apiBase + path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      message = ((await response.json()) as ErrorResponse).error;
    } catch {
      // Not JSON; keep the status line
    }
    throw new ApiError(response.status, message);
  }
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  signIn: (idToken: string) => request<SignInResponse>("/auth/google", { method: "POST", body: { idToken } }),
  me: (token: string) => request<MeResponse>("/me", { token }),
};
