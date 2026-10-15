import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check .env.local.");
}

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

export const db =
  globalForPostgres.postgresPool ??
  new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = db;
}