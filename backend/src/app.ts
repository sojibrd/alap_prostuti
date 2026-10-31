import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import type { VerifyGoogleIdToken } from "./auth/google.js";
import type { SessionTokens } from "./auth/session.js";
import type { MetricStore } from "./data/metrics.js";
import type { OwnerStore } from "./data/owner.js";
import type { PreparationStore } from "./data/preparations.js";
import type { UserStore } from "./data/users.js";
import { HttpError } from "./errors.js";
import { authRouter } from "./routes/auth.js";
import { metricsRouter } from "./routes/metrics.js";
import { ownerRouter } from "./routes/owner.js";
import { preparationsRouter } from "./routes/preparations.js";

export type AppDeps = {
  // Comma-separated origins allowed to call the API
  allowedOrigin: string;
  ownerGoogleSub: string | undefined;
  verifyGoogleIdToken: VerifyGoogleIdToken;
  tokens: SessionTokens;
  users: UserStore;
  preparations: PreparationStore;
  owner: OwnerStore;
  metrics: MetricStore;
};

export function createApp(deps: AppDeps) {
  const app = express();
  const allowedOrigins = deps.allowedOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Render puts one proxy in front; the rate limiters need the real client IP
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "PUT", "DELETE", "POST"],
      allowedHeaders: ["Authorization", "Content-Type"],
      maxAge: 600,
    }),
  );
  // Five fields of up to 2000 Bangla characters (3 bytes each) is ~30 KB
  app.use(express.json({ limit: "48kb" }));

  // Must not touch the database, so health checks don't keep Neon awake
  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(authRouter(deps));
  app.use(preparationsRouter(deps));
  app.use(ownerRouter(deps));
  app.use(metricsRouter(deps));

  app.use((_req, _res, next) => {
    next(new HttpError(404, "Not found"));
  });

  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    // body-parser sets a 4xx status for malformed or oversized JSON
    const status = typeof err?.status === "number" && err.status >= 400 && err.status < 500 ? err.status : 500;
    if (status === 500) {
      // Log the error only, never the request body: it holds private text
      console.error(err);
    }
    res.status(status).json({ error: status === 500 ? "Internal server error" : "Bad request" });
  };
  app.use(errorHandler);

  return app;
}
