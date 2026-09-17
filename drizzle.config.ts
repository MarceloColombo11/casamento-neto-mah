import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.NEON_DB_DATABASE_URL ??
      process.env.POSTGRES_URL ??
      "postgresql://localhost:5432/casamento_placeholder",
  },
});
