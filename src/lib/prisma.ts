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

  // 2. On Vercel / AWS Lambda / Serverless environments, /var/task is read-only.
  // Stage SQLite database into /tmp so that read-locks and write operations succeed without EROFS errors.
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.VERCEL_ENV) ||
    process.env.NODE_ENV === "production";

  if (isServerless) {
    const tmpDbPath = path.join(os.tmpdir(), "abecsa_dev.db").replace(/\\/g, "/");

    let needsCopy = true;
    try {
      if (fs.existsSync(tmpDbPath) && fs.statSync(tmpDbPath).size > 0) {
        needsCopy = false;
      }
    } catch {
      needsCopy = true;
    }

    if (needsCopy) {
      const candidates = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.resolve("./prisma/dev.db"),
        path.resolve("./dev.db"),
      ];

      for (const candidate of candidates) {
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
            fs.copyFileSync(candidate, tmpDbPath);
            break;
          }
        } catch {
          // try next candidate
        }
      }
    }

    return `file:${tmpDbPath}`;
  }

  // 3. Local development: use absolute path to prisma/dev.db to avoid working-directory discrepancies
  const localPrismaDb = path.resolve(process.cwd(), "prisma", "dev.db").replace(/\\/g, "/");
  if (fs.existsSync(localPrismaDb)) {
    return `file:${localPrismaDb}`;
  }

  return process.env.DATABASE_URL || "file:./dev.db";
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
