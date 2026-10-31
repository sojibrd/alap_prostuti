import { defineConfig } from "drizzle-kit";
import { withVerifyFull } from "./src/db/url.ts";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env (e.g. CI): use the real environment
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations need the direct connection, not the pooler
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ? withVerifyFull(process.env.DATABASE_URL_UNPOOLED) : "",
  },
  strict: true,
});
