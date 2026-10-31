import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import type { MetricStore } from "../data/metrics.js";
import { HttpError } from "../errors.js";

export type MetricDeps = { metrics: MetricStore };

const WebVitalBody = z.object({
  metric: z.enum(["LCP", "INP", "CLS", "FCP", "TTFB"]),
  // Milliseconds for timings, a unitless score for CLS; anything past 10 minutes is noise
  value: z.number().finite().nonnegative().max(600_000),
  rating: z.enum(["good", "needs-improvement", "poor"]),
});

export function metricsRouter(deps: MetricDeps) {
  const router = Router();

  // Open to signed-out pages too, so it gets its own limit
  const metricLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many requests" },
  });

  router.post("/metrics/web-vitals", metricLimit, async (req, res) => {
    const body = WebVitalBody.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, "Bad request");
    }
    await deps.metrics.recordWebVital(body.data);
    res.status(204).end();
  });

  return router;
}
