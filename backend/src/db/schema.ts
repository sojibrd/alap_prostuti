import { sql } from "drizzle-orm";
import { bigint, check, doublePrecision, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Google's `sub` is the stable identity; we store no email or name
export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  googleSub: text("google_sub").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The id is made in the browser (UUIDv7), so a retried save lands on the same row
export const preparations = pgTable(
  "preparations",
  {
    id: uuid("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    want: text("want").notNull().default(""),
    openingLine: text("opening_line").notNull().default(""),
    theirReply: text("their_reply").notNull().default(""),
    myReply: text("my_reply").notNull().default(""),
    outcome: text("outcome"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Covers the foreign key and the "my preparations, newest first" list
    index("preparations_user_id_created_at_idx").on(t.userId, t.createdAt.desc()),
    check(
      "preparations_text_length",
      sql`char_length(${t.want}) <= 2000 and char_length(${t.openingLine}) <= 2000 and char_length(${t.theirReply}) <= 2000 and char_length(${t.myReply}) <= 2000 and char_length(${t.outcome}) <= 2000`,
    ),
  ],
);

// Anonymous by design: no user id, only the measurement
export const webVitals = pgTable(
  "web_vitals",
  {
    id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    metric: text("metric").notNull(),
    value: doublePrecision("value").notNull(),
    rating: text("rating").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("web_vitals_metric", sql`${t.metric} in ('LCP', 'INP', 'CLS', 'FCP', 'TTFB')`),
    check("web_vitals_rating", sql`${t.rating} in ('good', 'needs-improvement', 'poor')`),
  ],
);
