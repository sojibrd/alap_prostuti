// Neon's URLs say sslmode=require, which pg treats as verify-full today but
// will weaken to libpq's meaning in its next major. Pin the strict check.
export function withVerifyFull(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
