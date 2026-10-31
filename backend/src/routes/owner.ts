import { Router } from "express";
import type { OwnerStatsResponse } from "../api-types.js";
import { requireAuth, sessionOf } from "../auth/middleware.js";
import type { SessionTokens } from "../auth/session.js";
import type { OwnerStore } from "../data/owner.js";
import { HttpError } from "../errors.js";

export type OwnerDeps = {
  tokens: SessionTokens;
  owner: OwnerStore;
  ownerGoogleSub: string | undefined;
};

export function ownerRouter(deps: OwnerDeps) {
  const router = Router();

  // Closed for everyone until OWNER_GOOGLE_SUB is set
  router.get("/owner/stats", requireAuth(deps.tokens), async (_req, res) => {
    const { googleSub } = sessionOf(res);
    if (deps.ownerGoogleSub === undefined || googleSub !== deps.ownerGoogleSub) {
      throw new HttpError(403, "Owner only");
    }
    const response: OwnerStatsResponse = { users: await deps.owner.countsPerUser() };
    res.json(response);
  });

  return router;
}
