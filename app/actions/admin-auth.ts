"use server";

import { and, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  adminAuthConfigured,
  clearAdminSessionCookie,
  credentialsMatch,
  hashClientIp,
  setAdminSessionCookie,
} from "@/lib/admin-auth";
import { getDb } from "@/lib/db/client";
import { adminLoginAttempts } from "@/lib/db/schema";

const GENERIC_ERROR =
  "Não foi possível entrar. Confira os dados e tente de novo.";
const RATE_ERROR =
  "Não foi possível entrar. Confira os dados e tente de novo. Tente novamente em alguns minutos.";

export type LoginState = { error?: string } | null;

function clientIpFromHeaders(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for");
  const realIp = headerList.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() ?? realIp ?? "unknown";
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!adminAuthConfigured()) {
    console.error("[admin-auth]", { success: false, reason: "not_configured" });
    return { error: GENERIC_ERROR };
  }

  const db = getDb();
  if (!db) {
    console.error("[admin-auth]", { success: false, reason: "no_database" });
    return { error: GENERIC_ERROR };
  }

  const ipHash = hashClientIp(clientIpFromHeaders(await headers()));
  if (!ipHash) {
    return { error: GENERIC_ERROR };
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await db
    .delete(adminLoginAttempts)
    .where(lt(adminLoginAttempts.attemptedAt, dayAgo));

  const recentFails = await db
    .select({ id: adminLoginAttempts.id })
    .from(adminLoginAttempts)
    .where(
      and(
        eq(adminLoginAttempts.ipHash, ipHash),
        eq(adminLoginAttempts.success, false),
        gt(adminLoginAttempts.attemptedAt, cutoff),
      ),
    );

  const blocked = recentFails.length >= 5;
  const matched = !blocked && credentialsMatch(identifier, password);

  await db.insert(adminLoginAttempts).values({
    ipHash,
    success: matched,
  });

  console.info("[admin-auth]", { ip_hash: ipHash, success: matched });

  if (blocked) {
    return { error: RATE_ERROR };
  }
  if (!matched) {
    return { error: GENERIC_ERROR };
  }

  await setAdminSessionCookie();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await clearAdminSessionCookie();
  redirect("/admin/login");
}
