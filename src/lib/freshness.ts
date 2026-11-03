export type Freshness = "live" | "aging" | "stale";

/**
 * Server data is considered live until `staleSeconds`. The client keeps the
 * age fresh between polls and applies the same rule so a dropped connection
 * cannot leave an old pin looking live.
 */
export function classifyFreshness(
  ageSeconds: number,
  staleSeconds: number
): Freshness {
  if (ageSeconds > staleSeconds) return "stale";
  if (ageSeconds > staleSeconds * 0.6) return "aging";
  return "live";
}

export function ageSecondsFrom(
  lastLocationAt: string,
  nowMs = Date.now()
): number | null {
  const timestamp = new Date(lastLocationAt).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return Math.max(0, Math.floor((nowMs - timestamp) / 1000));
}

export function estimateAgeSeconds(
  serverAgeSeconds: number,
  fetchedAtMs: number,
  nowMs = Date.now()
): number {
  const elapsed = Math.max(0, Math.floor((nowMs - fetchedAtMs) / 1000));
  return Math.max(0, serverAgeSeconds + elapsed);
}
