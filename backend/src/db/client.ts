import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
import pg from "pg";
import * as schema from "./schema.js";
import { withVerifyFull } from "./url.js";

// Takes the pooled URL (host ends in -pooler). Never use named prepared
// statements through it: the pooler shares connections between requests.
export function createDb(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: withVerifyFull(databaseUrl), max: 5, idleTimeoutMillis: 30_000 });
  return { db: drizzle({ client: pool, schema }), pool };
}

// Any Postgres driver: node-postgres in the app, PGlite in the tests.
// The driver's query-result type differs per driver, hence `any`.
export type Db = PgDatabase<any, typeof schema>;
