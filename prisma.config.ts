import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env (if present) first, then override with .env.local if available.
config({ path: ".env", override: false });
config({ path: ".env.local", override: true });

const FALLBACK_DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public";

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set; using placeholder connection string for Prisma client generation."
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: FALLBACK_DATABASE_URL,
  },
});
