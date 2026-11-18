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

  // 2. For SQLite (both local dev and serverless/Vercel):
  // We stage the active SQLite database in os.tmpdir() so that:
  // - On Vercel: it runs in the writable /tmp filesystem without EROFS errors
  // - In local Next.js dev: it lives OUTSIDE the watched project workspace.
  //   This completely prevents Turbopack from detecting dev.db changes and triggering
  //   an infinite hot-reload / page flickering loop!
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
    const sourceDb = path.join(process.cwd(), "prisma", "dev.db");
    try {
      if (fs.existsSync(sourceDb) && fs.statSync(sourceDb).size > 0) {
        fs.copyFileSync(sourceDb, tmpDbPath);
      }
    } catch {
      // non-fatal
    }
  }

  return `file:${tmpDbPath}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
