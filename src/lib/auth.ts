import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "abecsa-enterprise-jwt-super-secret-key-2026";
const COOKIE_NAME = "abecsa_session";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  impersonatedRole?: string; // For Admin View-As switcher
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        customerProfile: true,
      },
    });

    if (!user || user.status !== "ACTIVE") return null;

    if (user.role === "ADMIN" || user.email === "admin@abecsa.in") {
      user.name = "Abecsa Admin";
      user.jobTitle = "Administrator";
    }

    // Attach effective role (supports verified Admin impersonation)
    const effectiveRole = (user.role === "ADMIN" && payload.impersonatedRole)
      ? payload.impersonatedRole
      : user.role;

    return {
      ...user,
      effectiveRole,
      actualRole: user.role,
      isImpersonating: user.role === "ADMIN" && !!payload.impersonatedRole && payload.impersonatedRole !== "ADMIN",
    };
  } catch (error: any) {
    if (error && typeof error === "object" && (error.digest || error.message?.includes("cookies"))) {
      throw error;
    }
    console.error("Auth session error:", error);
    return null;
  }
}

export { COOKIE_NAME };
