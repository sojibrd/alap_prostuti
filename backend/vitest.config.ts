import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Starting PGlite (Postgres in WASM) takes a few seconds
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
