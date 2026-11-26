import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import os from "os";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function resolveDatabaseUrl(): string {
  // 1. If remote database URL provided (e.g. Postgres, MySQL, Neon, Turso), use it directly
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("file:")) {
    return process.env.DATABASE_URL;
  }

  const sourceDb = path.join(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");

  // 2. In local development or persistent environment, write directly to prisma/dev.db
  if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return `file:${sourceDb}`;
  }

  // 3. For serverless read-only runtime (Vercel Lambda):
  const tmpDbPath = path.join(os.tmpdir(), "abecsa_dev.db").replace(/\\/g, "/");
  try {
    if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDb)) {
      fs.copyFileSync(sourceDb, tmpDbPath);
    }
  } catch {
    // non-fatal
  }

  return fs.existsSync(tmpDbPath) ? `file:${tmpDbPath}` : `file:${sourceDb}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
