import { and, desc, eq, sql } from "drizzle-orm";
import type { PreparationFields } from "../api-types.js";
import type { Db } from "../db/client.js";
import { preparations } from "../db/schema.js";

export type PreparationRow = typeof preparations.$inferSelect;
export type PreparationSummaryRow = {
  id: string;
  title: string;
  hasOutcome: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const LIST_LIMIT = 200;

// Every function takes the signed-in user's id first and filters on it.
// Routes reach preparations only through this store.
export function createPreparationStore(db: Db) {
  return {
    // Newest first; titles only, never the full text
    async list(userId: number): Promise<PreparationSummaryRow[]> {
      return db
        .select({
          id: preparations.id,
          title: sql<string>`left(${preparations.want}, 80)`,
          hasOutcome: sql<boolean>`${preparations.outcome} is not null`,
          createdAt: preparations.createdAt,
          updatedAt: preparations.updatedAt,
        })
        .from(preparations)
        .where(eq(preparations.userId, userId))
        .orderBy(desc(preparations.createdAt))
        .limit(LIST_LIMIT);
    },

    async get(userId: number, id: string): Promise<PreparationRow | null> {
      const rows = await db
        .select()
        .from(preparations)
        .where(and(eq(preparations.id, id), eq(preparations.userId, userId)))
        .limit(1);
      return rows[0] ?? null;
    },

    // Same id twice keeps one row. Returns null when the id belongs to
    // someone else: the conflict update is skipped and nothing comes back.
    async save(userId: number, id: string, fields: PreparationFields): Promise<PreparationRow | null> {
      const rows = await db
        .insert(preparations)
        .values({ id, userId, ...fields })
        .onConflictDoUpdate({
          target: preparations.id,
          set: { ...fields, updatedAt: sql`now()` },
          setWhere: sql`${preparations.userId} = excluded.user_id`,
        })
        .returning();
      return rows[0] ?? null;
    },

    async remove(userId: number, id: string): Promise<boolean> {
      const rows = await db
        .delete(preparations)
        .where(and(eq(preparations.id, id), eq(preparations.userId, userId)))
        .returning({ id: preparations.id });
      return rows.length > 0;
    },
  };
}

export type PreparationStore = ReturnType<typeof createPreparationStore>;
