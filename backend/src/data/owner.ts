import { eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { preparations, users } from "../db/schema.js";

export type UserCounts = { userId: number; total: number; last7Days: number; last30Days: number };

// The one query that reads across users. Owner only, and it returns counts:
// it must never select a text column.
export function createOwnerStore(db: Db) {
  return {
    async countsPerUser(): Promise<UserCounts[]> {
      return db
        .select({
          userId: users.id,
          total: sql<number>`count(${preparations.id})`.mapWith(Number),
          last7Days:
            sql<number>`count(${preparations.id}) filter (where ${preparations.createdAt} > now() - interval '7 days')`.mapWith(
              Number,
            ),
          last30Days:
            sql<number>`count(${preparations.id}) filter (where ${preparations.createdAt} > now() - interval '30 days')`.mapWith(
              Number,
            ),
        })
        .from(users)
        .leftJoin(preparations, eq(preparations.userId, users.id))
        .groupBy(users.id)
        .orderBy(users.id);
    },
  };
}

export type OwnerStore = ReturnType<typeof createOwnerStore>;
