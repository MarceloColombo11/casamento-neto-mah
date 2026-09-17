import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null = null;

export function getDatabaseUrl(): string | undefined {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.NEON_DB_DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim();
  return url || undefined;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

export function getDb(): Database | null {
  const url = getDatabaseUrl();
  if (!url) return null;
  if (!cached) {
    cached = drizzle(neon(url), { schema });
  }
  return cached;
}

export function requireDb(): Database {
  const db = getDb();
  if (!db) {
    throw new Error("Não foi possível salvar. Tente de novo em instantes.");
  }
  return db;
}
