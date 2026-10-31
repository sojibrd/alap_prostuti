// Shared with the frontend, which imports this file directly. Types only:
// nothing here may pull in server code.

export type ErrorResponse = { error: string };

export type SignInRequest = { idToken: string };
// expiresAt is in seconds since the epoch
export type SignInResponse = { token: string; expiresAt: number };

export type MeResponse = { userId: number; googleSub: string; isOwner: boolean };

// Each field holds at most 2000 characters
export type PreparationFields = {
  want: string;
  openingLine: string;
  theirReply: string;
  myReply: string;
  // The one line written after the conversation; null until then
  outcome: string | null;
};

// PUT /preparations/:id with a UUID made in the browser (v7 preferred)
export type PreparationRequest = PreparationFields;

// Timestamps are ISO 8601 strings
export type Preparation = PreparationFields & { id: string; createdAt: string; updatedAt: string };

export type PreparationSummary = {
  id: string;
  // The first 80 characters of `want`
  title: string;
  hasOutcome: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PreparationListResponse = { preparations: PreparationSummary[] };

// Owner only: counts per user, never any text
export type OwnerStatsResponse = {
  users: { userId: number; total: number; last7Days: number; last30Days: number }[];
};

export type WebVitalRequest = {
  metric: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
};
