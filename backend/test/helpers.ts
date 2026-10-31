import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { createApp } from "../src/app.js";
import { createSessionTokens } from "../src/auth/session.js";
import { createMetricStore } from "../src/data/metrics.js";
import { createOwnerStore } from "../src/data/owner.js";
import { createPreparationStore } from "../src/data/preparations.js";
import { createUserStore } from "../src/data/users.js";
import type { Db } from "../src/db/client.js";
import * as schema from "../src/db/schema.js";

export const TEST_JWT_SECRET = "test-secret-".repeat(4);

export type CallResult = { status: number; body: any };

// A real Postgres (PGlite, in memory) with the repo's migrations. It takes a
// few seconds to start, so a test file makes one and shares it.
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  return { db: db as Db, close: () => client.close() };
}

// The real app on a random port; cheap, so each describe gets its own (and so
// its own rate limiters). Only Google is faked: an idToken "google:<sub>" signs
// in as <sub>, anything else is rejected the way a bad Google token is.
export async function startTestApp(db: Db, options: { ownerGoogleSub?: string } = {}) {
  const app = createApp({
    allowedOrigin: "http://localhost:3000",
    ownerGoogleSub: options.ownerGoogleSub,
    verifyGoogleIdToken: async (idToken) => {
      if (!idToken.startsWith("google:")) {
        throw new Error("rejected");
      }
      return idToken.slice("google:".length);
    },
    tokens: createSessionTokens(TEST_JWT_SECRET),
    users: createUserStore(db),
    preparations: createPreparationStore(db),
    owner: createOwnerStore(db),
    metrics: createMetricStore(db),
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}): Promise<CallResult> {
    const headers: Record<string, string> = {};
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";
    const response = await fetch(base + path, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  async function signIn(googleSub: string): Promise<string> {
    const result = await call("POST", "/auth/google", { body: { idToken: `google:${googleSub}` } });
    if (result.status !== 200) {
      throw new Error(`sign-in failed with ${result.status}`);
    }
    return result.body.token;
  }

  function close() {
    server.closeAllConnections();
    server.close();
  }

  return { call, signIn, close };
}

export const sampleFields = {
  want: "বেতন বাড়ানোর কথা বলব",
  openingLine: "আপনার সাথে একটু কথা ছিল",
  theirReply: "এখন সম্ভব না",
  myReply: "কবে সম্ভব হবে?",
  outcome: null,
};
