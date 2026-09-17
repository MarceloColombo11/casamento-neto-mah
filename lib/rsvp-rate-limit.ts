const RATE_LIMIT_WINDOW_MS = 60_000;

const rateLimitMap = new Map<string, number[]>();

export function isRsvpRateLimited(
  ip: string,
  bucket: "write" | "suggest" = "write",
): boolean {
  const max = bucket === "write" ? 5 : 30;
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= max) {
    return true;
  }
  recent.push(now);
  rateLimitMap.set(key, recent);
  return false;
}
