import { Router } from "express";
import { z } from "zod";
import type { Preparation, PreparationListResponse } from "../api-types.js";
import { requireAuth, sessionOf } from "../auth/middleware.js";
import type { SessionTokens } from "../auth/session.js";
import type { PreparationRow, PreparationStore } from "../data/preparations.js";
import { HttpError, pgErrorCode } from "../errors.js";

export type PreparationDeps = {
  tokens: SessionTokens;
  preparations: PreparationStore;
};

const Text = z.string().max(2000);
const PreparationBody = z.object({
  want: Text.default(""),
  openingLine: Text.default(""),
  theirReply: Text.default(""),
  myReply: Text.default(""),
  outcome: Text.nullable().default(null),
});

// A malformed id is treated like an unknown one
function parseId(raw: unknown): string {
  const id = z.uuid().safeParse(raw);
  if (!id.success) {
    throw new HttpError(404, "Not found");
  }
  return id.data;
}

function toPreparation(row: PreparationRow): Preparation {
  return {
    id: row.id,
    want: row.want,
    openingLine: row.openingLine,
    theirReply: row.theirReply,
    myReply: row.myReply,
    outcome: row.outcome,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function preparationsRouter(deps: PreparationDeps) {
  const router = Router();
  const auth = requireAuth(deps.tokens);

  router.get("/preparations", auth, async (_req, res) => {
    const rows = await deps.preparations.list(sessionOf(res).userId);
    const response: PreparationListResponse = {
      preparations: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
    res.json(response);
  });

  router.get("/preparations/:id", auth, async (req, res) => {
    const row = await deps.preparations.get(sessionOf(res).userId, parseId(req.params.id));
    if (!row) {
      throw new HttpError(404, "Not found");
    }
    res.json(toPreparation(row));
  });

  // Create or replace. The browser makes the id, so a retry after a timeout
  // lands on the same row instead of making a second one.
  router.put("/preparations/:id", auth, async (req, res) => {
    const id = parseId(req.params.id);
    const body = PreparationBody.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, "Bad request");
    }
    let row: PreparationRow | null;
    try {
      row = await deps.preparations.save(sessionOf(res).userId, id, body.data);
    } catch (err) {
      // The account was deleted while this token was still valid
      if (pgErrorCode(err) === "23503") {
        throw new HttpError(401, "Sign in required");
      }
      throw err;
    }
    // Someone else's id: answer as if it didn't exist
    if (!row) {
      throw new HttpError(404, "Not found");
    }
    res.json(toPreparation(row));
  });

  router.delete("/preparations/:id", auth, async (req, res) => {
    const removed = await deps.preparations.remove(sessionOf(res).userId, parseId(req.params.id));
    if (!removed) {
      throw new HttpError(404, "Not found");
    }
    res.status(204).end();
  });

  return router;
}
