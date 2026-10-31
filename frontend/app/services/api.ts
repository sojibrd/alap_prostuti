// Browser-side calls to the backend. The types come from the backend itself
// (type-only import, so no server code reaches the bundle).
import type {
  ErrorResponse,
  MeResponse,
  Preparation,
  PreparationListResponse,
  PreparationRequest,
  SignInResponse,
} from "../../../backend/src/api-types";
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
const RETRY_DELAY_MS = 2_000;

type RequestOptions = { method?: string; token?: string; body?: unknown };

async function send<T>(path: string, opts: RequestOptions): Promise<T> {
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

// A dropped connection or a gateway error while the server wakes gets one more
// try after a short pause. Every call here is safe to repeat: saves carry
// their own id.
function isWorthRetrying(err: unknown): boolean {
  return err instanceof TypeError || (err instanceof ApiError && [502, 503, 504].includes(err.status));
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(path, opts);
  } catch (err) {
    if (!isWorthRetrying(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return send<T>(path, opts);
  }
}

export function isSignedOutError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export const api = {
  signIn: (idToken: string) => request<SignInResponse>("/auth/google", { method: "POST", body: { idToken } }),
  me: (token: string) => request<MeResponse>("/me", { token }),
  deleteAccount: (token: string) => request<void>("/me", { method: "DELETE", token }),
  list: (token: string) => request<PreparationListResponse>("/preparations", { token }),
  get: (token: string, id: string) => request<Preparation>(`/preparations/${id}`, { token }),
  save: (token: string, id: string, fields: PreparationRequest) =>
    request<Preparation>(`/preparations/${id}`, { method: "PUT", token, body: fields }),
  remove: (token: string, id: string) => request<void>(`/preparations/${id}`, { method: "DELETE", token }),
};
