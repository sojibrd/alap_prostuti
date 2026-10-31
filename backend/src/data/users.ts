import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { users } from "../db/schema.js";

export function createUserStore(db: Db) {
  return {
    // The sign-in lookup: the only query that runs before we know the user id.
    // ON CONFLICT DO NOTHING needs no UPDATE grant, which app_user doesn't have.
    async findOrCreateUserId(googleSub: string): Promise<number> {
      const inserted = await db
        .insert(users)
        .values({ googleSub })
        .onConflictDoNothing({ target: users.googleSub })
        .returning({ id: users.id });
      if (inserted[0]) {
        return inserted[0].id;
      }
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.googleSub, googleSub)).limit(1);
      if (!existing[0]) {
        throw new Error("User row missing after sign-in conflict");
      }
      return existing[0].id;
    },

    // The foreign key cascades, so this removes every preparation too
    async deleteUser(userId: number): Promise<void> {
      await db.delete(users).where(eq(users.id, userId));
    },
  };
}

export type UserStore = ReturnType<typeof createUserStore>;
