import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createSessionTokens } from "../src/auth/session.js";
import { createTestDb, sampleFields, startTestApp } from "./helpers.js";

type TestDb = Awaited<ReturnType<typeof createTestDb>>;
type TestApp = Awaited<ReturnType<typeof startTestApp>>;

// One database for the whole file; every describe signs in its own users
let testDb: TestDb;
beforeAll(async () => {
  testDb = await createTestDb();
});
afterAll(() => testDb.close());

describe("sign-in and /me", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await startTestApp(testDb.db, { ownerGoogleSub: "me-owner" });
  });
  afterAll(() => t.close());

  it("rejects an empty body", async () => {
    expect((await t.call("POST", "/auth/google", { body: {} })).status).toBe(400);
  });

  it("rejects a token Google refuses", async () => {
    expect((await t.call("POST", "/auth/google", { body: { idToken: "forged" } })).status).toBe(401);
  });

  it("issues a token that lasts about an hour", async () => {
    const result = await t.call("POST", "/auth/google", { body: { idToken: "google:me-someone" } });
    expect(result.status).toBe(200);
    const minutesLeft = (result.body.expiresAt - Date.now() / 1000) / 60;
    expect(minutesLeft).toBeGreaterThan(59);
    expect(minutesLeft).toBeLessThanOrEqual(60);
  });

  it("returns the same user id on every sign-in", async () => {
    const first = await t.call("GET", "/me", { token: await t.signIn("me-returning") });
    const second = await t.call("GET", "/me", { token: await t.signIn("me-returning") });
    expect(second.body.userId).toBe(first.body.userId);
  });

  it("tells the owner apart", async () => {
    expect((await t.call("GET", "/me", { token: await t.signIn("me-owner") })).body.isOwner).toBe(true);
    expect((await t.call("GET", "/me", { token: await t.signIn("me-someone") })).body.isOwner).toBe(false);
  });

  it("refuses missing, tampered and foreign tokens", async () => {
    const token = await t.signIn("me-someone");
    const foreign = await createSessionTokens("another-key-".repeat(4)).issue({ userId: 1, googleSub: "me-someone" });
    expect((await t.call("GET", "/me")).status).toBe(401);
    expect((await t.call("GET", "/me", { token: `${token.slice(0, -2)}xx` })).status).toBe(401);
    expect((await t.call("GET", "/me", { token: foreign.token })).status).toBe(401);
  });
});

describe("preparations belong to their author", () => {
  let t: TestApp;
  let alice: string;
  let bob: string;
  const id = randomUUID();

  beforeAll(async () => {
    t = await startTestApp(testDb.db);
    alice = await t.signIn("prep-alice");
    bob = await t.signIn("prep-bob");
    await t.call("PUT", `/preparations/${id}`, { token: alice, body: sampleFields });
  });
  afterAll(() => t.close());

  it("saves the same id twice as one row, keeping the newer text", async () => {
    const again = await t.call("PUT", `/preparations/${id}`, {
      token: alice,
      body: { ...sampleFields, outcome: "শুনেছে, পরের মাসে আবার" },
    });
    expect(again.status).toBe(200);
    expect(again.body.outcome).toBe("শুনেছে, পরের মাসে আবার");
    const list = await t.call("GET", "/preparations", { token: alice });
    expect(list.body.preparations).toHaveLength(1);
  });

  it("lists titles only, never the full text", async () => {
    const [summary] = (await t.call("GET", "/preparations", { token: alice })).body.preparations;
    expect(Object.keys(summary).sort()).toEqual(["createdAt", "hasOutcome", "id", "title", "updatedAt"]);
    expect(summary.title).toBe(sampleFields.want);
  });

  it("does not let another user overwrite it", async () => {
    const attempt = await t.call("PUT", `/preparations/${id}`, { token: bob, body: { ...sampleFields, want: "bob was here" } });
    expect(attempt.status).toBe(404);
    expect((await t.call("GET", `/preparations/${id}`, { token: alice })).body.want).toBe(sampleFields.want);
  });

  it("does not let another user read, list or delete it", async () => {
    expect((await t.call("GET", `/preparations/${id}`, { token: bob })).status).toBe(404);
    expect((await t.call("GET", "/preparations", { token: bob })).body.preparations).toHaveLength(0);
    expect((await t.call("DELETE", `/preparations/${id}`, { token: bob })).status).toBe(404);
    expect((await t.call("GET", `/preparations/${id}`, { token: alice })).status).toBe(200);
  });

  it("needs a token", async () => {
    expect((await t.call("GET", "/preparations")).status).toBe(401);
    expect((await t.call("PUT", `/preparations/${randomUUID()}`, { body: sampleFields })).status).toBe(401);
  });

  it("rejects a malformed id and over-long text", async () => {
    expect((await t.call("PUT", "/preparations/not-a-uuid", { token: alice, body: sampleFields })).status).toBe(404);
    const tooLong = { ...sampleFields, want: "ক".repeat(2001) };
    expect((await t.call("PUT", `/preparations/${randomUUID()}`, { token: alice, body: tooLong })).status).toBe(400);
  });

  it("lets the author delete it", async () => {
    const other = randomUUID();
    await t.call("PUT", `/preparations/${other}`, { token: alice, body: sampleFields });
    expect((await t.call("DELETE", `/preparations/${other}`, { token: alice })).status).toBe(204);
    expect((await t.call("GET", `/preparations/${other}`, { token: alice })).status).toBe(404);
  });
});

describe("account deletion", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await startTestApp(testDb.db);
  });
  afterAll(() => t.close());

  it("removes the account with every preparation, and the old token stops writing", async () => {
    const token = await t.signIn("del-leaving");
    const id = randomUUID();
    await t.call("PUT", `/preparations/${id}`, { token, body: sampleFields });

    expect((await t.call("DELETE", "/me", { token })).status).toBe(204);
    expect((await t.call("GET", `/preparations/${id}`, { token })).status).toBe(404);
    expect((await t.call("PUT", `/preparations/${randomUUID()}`, { token, body: sampleFields })).status).toBe(401);

    // Signing in again starts a fresh, empty account
    const fresh = await t.signIn("del-leaving");
    expect((await t.call("GET", "/preparations", { token: fresh })).body.preparations).toHaveLength(0);
  });
});

describe("owner stats", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await startTestApp(testDb.db, { ownerGoogleSub: "stats-owner" });
  });
  afterAll(() => t.close());

  it("shows the owner counts per user and nothing else", async () => {
    const writer = await t.signIn("stats-writer");
    const writerId = (await t.call("GET", "/me", { token: writer })).body.userId;
    await t.call("PUT", `/preparations/${randomUUID()}`, { token: writer, body: sampleFields });

    const stats = await t.call("GET", "/owner/stats", { token: await t.signIn("stats-owner") });
    expect(stats.status).toBe(200);
    for (const row of stats.body.users) {
      expect(Object.keys(row).sort()).toEqual(["last30Days", "last7Days", "total", "userId"]);
    }
    expect(stats.body.users.find((row: { userId: number }) => row.userId === writerId)).toEqual({
      userId: writerId,
      total: 1,
      last7Days: 1,
      last30Days: 1,
    });
  });

  it("is closed to everyone else", async () => {
    expect((await t.call("GET", "/owner/stats", { token: await t.signIn("stats-writer") })).status).toBe(403);
  });

  it("is closed to everyone while no owner is set", async () => {
    const noOwner = await startTestApp(testDb.db);
    try {
      expect((await noOwner.call("GET", "/owner/stats", { token: await noOwner.signIn("stats-owner") })).status).toBe(403);
    } finally {
      noOwner.close();
    }
  });
});

describe("web vitals", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await startTestApp(testDb.db);
  });
  afterAll(() => t.close());

  it("accepts a known metric without sign-in and rejects an unknown one", async () => {
    expect((await t.call("POST", "/metrics/web-vitals", { body: { metric: "LCP", value: 1234.5, rating: "good" } })).status).toBe(204);
    expect((await t.call("POST", "/metrics/web-vitals", { body: { metric: "FID", value: 1, rating: "good" } })).status).toBe(400);
  });

  it("accepts the text/plain body a sendBeacon sends, and rejects broken text", async () => {
    expect(await t.postText("/metrics/web-vitals", JSON.stringify({ metric: "CLS", value: 0.02, rating: "good" }))).toBe(204);
    expect(await t.postText("/metrics/web-vitals", "not json")).toBe(400);
  });
});

describe("sign-in rate limit", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await startTestApp(testDb.db);
  });
  afterAll(() => t.close());

  it("allows 20 sign-ins per 15 minutes from one address, then a JSON 429", async () => {
    for (let i = 0; i < 20; i++) {
      expect((await t.call("POST", "/auth/google", { body: { idToken: `google:limit-${i}` } })).status).toBe(200);
    }
    const blocked = await t.call("POST", "/auth/google", { body: { idToken: "google:limit-one-more" } });
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: "Too many requests" });
  });
});
