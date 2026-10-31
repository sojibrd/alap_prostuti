export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Postgres error code from a pg error, or from the driver error Drizzle wraps it in
export function pgErrorCode(err: unknown): string | undefined {
  const candidates = [err, (err as { cause?: unknown } | null)?.cause];
  for (const candidate of candidates) {
    const code = (candidate as { code?: unknown } | null)?.code;
    if (typeof code === "string") {
      return code;
    }
  }
  return undefined;
}
