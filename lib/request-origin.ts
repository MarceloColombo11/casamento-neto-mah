export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown";
}

export function resolveRequestOrigin(request: Request): string {
  const fromHeader = request.headers.get("origin");
  if (fromHeader) return fromHeader;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) return siteUrl;

  const host = request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export function isAllowedOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const allowedHosts = [
    "localhost",
    "127.0.0.1",
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean);

  const url = origin || referer;
  if (!url) return true;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return allowedHosts.some(
      (h) => h && (host === h || host.endsWith(`.${h}`)),
    );
  } catch {
    return false;
  }
}
