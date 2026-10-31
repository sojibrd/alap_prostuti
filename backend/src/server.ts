import { createApp } from "./app.js";
import { createGoogleVerifier } from "./auth/google.js";
import { createSessionTokens } from "./auth/session.js";
import { createMetricStore } from "./data/metrics.js";
import { createOwnerStore } from "./data/owner.js";
import { createPreparationStore } from "./data/preparations.js";
import { createUserStore } from "./data/users.js";
import { createDb } from "./db/client.js";
import { loadEnv } from "./env.js";

const env = loadEnv();
const { db, pool } = createDb(env.DATABASE_URL);

const app = createApp({
  allowedOrigin: env.ALLOWED_ORIGIN,
  ownerGoogleSub: env.OWNER_GOOGLE_SUB,
  verifyGoogleIdToken: createGoogleVerifier(env.GOOGLE_CLIENT_ID),
  tokens: createSessionTokens(env.JWT_SECRET),
  users: createUserStore(db),
  preparations: createPreparationStore(db),
  owner: createOwnerStore(db),
  metrics: createMetricStore(db),
});

const server = app.listen(env.PORT, () => {
  console.log(`alap-prostuti backend listening on ${env.PORT}`);
});

// Platforms send SIGTERM on deploy and shutdown; finish open requests first
process.on("SIGTERM", () => {
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
});
