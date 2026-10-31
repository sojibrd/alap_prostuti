import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import type { MeResponse, SignInResponse } from "../api-types.js";
import type { VerifyGoogleIdToken } from "../auth/google.js";
import { requireAuth, sessionOf } from "../auth/middleware.js";
import type { SessionTokens } from "../auth/session.js";
import type { UserStore } from "../data/users.js";
import { HttpError } from "../errors.js";

export type AuthDeps = {
  verifyGoogleIdToken: VerifyGoogleIdToken;
  tokens: SessionTokens;
  users: UserStore;
  ownerGoogleSub: string | undefined;
};

const SignInBody = z.object({ idToken: z.string().min(1).max(4096) });

export function authRouter(deps: AuthDeps) {
  const router = Router();
  const auth = requireAuth(deps.tokens);

  // Sign-in is the one unauthenticated write; keep guessing and floods slow
  const signInLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests" },
  });

  router.post("/auth/google", signInLimit, async (req, res) => {
    const body = SignInBody.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, "Bad request");
    }
    let googleSub: string;
    try {
      googleSub = await deps.verifyGoogleIdToken(body.data.idToken);
    } catch {
      throw new HttpError(401, "Google sign-in failed");
    }
    const userId = await deps.users.findOrCreateUserId(googleSub);
    const response: SignInResponse = await deps.tokens.issue({ userId, googleSub });
    res.json(response);
  });

  router.get("/me", auth, (_req, res) => {
    const session = sessionOf(res);
    const response: MeResponse = {
      userId: session.userId,
      googleSub: session.googleSub,
      isOwner: deps.ownerGoogleSub !== undefined && session.googleSub === deps.ownerGoogleSub,
    };
    res.json(response);
  });

  // Deletes the account and, through the foreign key, every preparation
  router.delete("/me", auth, async (_req, res) => {
    await deps.users.deleteUser(sessionOf(res).userId);
    res.status(204).end();
  });

  return router;
}
