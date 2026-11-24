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

  // 2. For SQLite (both local dev and serverless/Render/Vercel):
  const tmpDbPath = path.join(os.tmpdir(), "abecsa_dev.db").replace(/\\/g, "/");
  const sourceDb = path.join(process.cwd(), "prisma", "dev.db");

  let needsCopy = true;
  try {
    if (fs.existsSync(tmpDbPath) && fs.statSync(tmpDbPath).size > 0) {
      if (fs.existsSync(sourceDb)) {
        const sourceMtime = fs.statSync(sourceDb).mtimeMs;
        const tmpMtime = fs.statSync(tmpDbPath).mtimeMs;
        needsCopy = sourceMtime > tmpMtime;
      } else {
        needsCopy = false;
      }
    }
  } catch {
    needsCopy = true;
  }

  if (needsCopy && fs.existsSync(sourceDb) && fs.statSync(sourceDb).size > 0) {
    try {
      fs.copyFileSync(sourceDb, tmpDbPath);
    } catch {
      // non-fatal
    }
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
