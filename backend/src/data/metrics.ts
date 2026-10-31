import type { WebVitalRequest } from "../api-types.js";
import type { Db } from "../db/client.js";
import { webVitals } from "../db/schema.js";

// Anonymous: no user id is ever stored with a measurement
export function createMetricStore(db: Db) {
  return {
    async recordWebVital(vital: WebVitalRequest): Promise<void> {
      await db.insert(webVitals).values(vital);
    },
  };
}

export type MetricStore = ReturnType<typeof createMetricStore>;
