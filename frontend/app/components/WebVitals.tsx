"use client";

import { useReportWebVitals } from "next/web-vitals";
import { SITE } from "../site";

const REPORTED = new Set(["LCP", "INP", "CLS", "FCP", "TTFB"]);
const ENDPOINT = `${SITE.apiBase}/metrics/web-vitals`;

// Defined once, outside the component: the Next.js docs warn that a new
// callback reference re-reports the metrics already sent
function report(metric: { name: string; value: number; rating?: string }) {
  // Only real users of a production build; local runs would skew the numbers
  if (process.env.NODE_ENV !== "production" || !REPORTED.has(metric.name)) return;
  const body = JSON.stringify({ metric: metric.name, value: metric.value, rating: metric.rating });
  // sendBeacon survives the page closing, when CLS and INP are final.
  // text/plain lets it reach the API's origin without a CORS preflight.
  const sent = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "text/plain" }));
  if (!sent) {
    fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {
      // A lost measurement is fine; never disturb the page for it
    });
  }
}

export function WebVitals() {
  useReportWebVitals(report);
  return null;
}
