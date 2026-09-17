import {
  createHash,
  createHmac,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_SESSION_MAX_AGE = 28_800;
const PENDING_TTL_SECONDS = 10 * 60;

function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) return null;
  return secret;
}

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function encodeToken(payload: unknown, secret: string): string {
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${payloadB64}.${sign(payloadB64, secret)}`;
}

function decodeToken<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const secret = getSessionSecret();
  if (!secret) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payloadB64, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

export function createSessionToken(nowMs = Date.now()): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Sessão não configurada.");
  }
  const iat = Math.floor(nowMs / 1000);
  return encodeToken({ iat, exp: iat + ADMIN_SESSION_MAX_AGE }, secret);
}

export function verifySessionToken(
  token: string | undefined | null,
  nowMs = Date.now(),
): boolean {
  const payload = decodeToken<{ iat?: number; exp?: number }>(token);
  if (!payload) return false;
  const now = Math.floor(nowMs / 1000);
  return (
    typeof payload.iat === "number" &&
    typeof payload.exp === "number" &&
    payload.exp >= now
  );
}

export function createPendingMediaToken(driveName: string): string {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Sessão não configurada.");
  }
  const exp = Math.floor(Date.now() / 1000) + PENDING_TTL_SECONDS;
  return encodeToken({ n: driveName, exp }, secret);
}

export function readPendingMediaName(
  token: string | undefined | null,
): string | null {
  const payload = decodeToken<{ n?: string; exp?: number }>(token);
  if (!payload || typeof payload.n !== "string" || typeof payload.exp !== "number") {
    return null;
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (!/^site-content-[0-9a-f-]{36}$/i.test(payload.n)) return null;
  return payload.n;
}

export function hashClientIp(ip: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  return createHash("sha256").update(`${ip}:${secret}`).digest("hex");
}

function timingSafeStringEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function verifyAdminPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts[0] !== "scrypt" || parts.length !== 6) return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![N, r, p].every((n) => Number.isFinite(n) && n > 0)) return false;
  try {
    const salt = Buffer.from(parts[4], "base64");
    const expected = Buffer.from(parts[5], "base64");
    if (salt.length === 0 || expected.length === 0) return false;
    const actual = scryptSync(password, salt, expected.length, {
      N,
      r,
      p,
      maxmem: 64 * 1024 * 1024,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function credentialsMatch(identifier: string, password: string): boolean {
  const user = process.env.ADMIN_USERNAME ?? "";
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (!user || !hash) return false;
  const userOk = timingSafeStringEqual(identifier, user);
  const passOk = verifyAdminPassword(password, hash);
  return userOk && passOk;
}

export function adminAuthConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_USERNAME?.trim() &&
      process.env.ADMIN_PASSWORD_HASH?.trim() &&
      getSessionSecret(),
  );
}
