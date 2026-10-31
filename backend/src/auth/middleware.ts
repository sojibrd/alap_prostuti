import type { RequestHandler, Response } from "express";
import { HttpError } from "../errors.js";
import type { Session, SessionTokens } from "./session.js";

export function requireAuth(tokens: SessionTokens): RequestHandler {
  return async (req, res, next) => {
    const [scheme, token] = (req.get("authorization") ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
      next(new HttpError(401, "Sign in required"));
      return;
    }
    try {
      res.locals.session = await tokens.verify(token);
      next();
    } catch {
      next(new HttpError(401, "Sign in required"));
    }
  };
}

// Only valid after requireAuth has run on the route
export function sessionOf(res: Response): Session {
  const session = res.locals.session as Session | undefined;
  if (!session) {
    throw new HttpError(401, "Sign in required");
  }
  return session;
}
