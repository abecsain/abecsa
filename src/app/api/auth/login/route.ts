import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

/**
 * Constant-time string comparison using SHA-256 digests to prevent timing and length side-channels.
 */
function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// In-memory sliding window rate limiter for brute-force protection
interface RateLimitRecord {
  attempts: number;
  lockUntil: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "127.0.0.1";
}

function checkRateLimit(key: string): { blocked: boolean; remainingSecs: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { blocked: false, remainingSecs: 0 };

  if (record.lockUntil > now) {
    const remainingSecs = Math.ceil((record.lockUntil - now) / 1000);
    return { blocked: true, remainingSecs };
  }

  if (record.lockUntil > 0 && record.lockUntil <= now) {
    loginAttempts.delete(key);
  }

  return { blocked: false, remainingSecs: 0 };
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  if (loginAttempts.size >= 10000) {
    for (const [k, v] of loginAttempts.entries()) {
      if (v.lockUntil > 0 && v.lockUntil <= now) loginAttempts.delete(k);
    }
    if (loginAttempts.size >= 10000) loginAttempts.clear();
  }

  const record = loginAttempts.get(key) || { attempts: 0, lockUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.lockUntil = now + 5 * 60 * 1000; // 5-minute lockout
  }

  loginAttempts.set(key, record);
}

function clearRateLimit(key: string) {
  loginAttempts.delete(key);
}

/**
 * Maps Supabase profile role to ABECSA internal system role
 */
function mapSupabaseRole(role?: string): "ADMIN" | "MANAGER" | "ENGINEER" | "CUSTOMER" {
  const normalized = (role || "").toLowerCase().trim();
  if (normalized === "admin") return "ADMIN";
  if (normalized === "marketing_manager" || normalized === "manager") return "MANAGER";
  if (normalized === "engineer" || normalized === "developer") return "ENGINEER";
  return "CUSTOMER";
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    const email = body?.email ? String(body.email).toLowerCase().trim() : "";
    const password = body?.password ? String(body.password) : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (email.length > 254 || password.length > 256) {
      return NextResponse.json(
        { error: "Invalid input length" },
        { status: 400 }
      );
    }

    // Rate limit check
    const ipLimit = checkRateLimit(clientIp);
    const emailLimit = checkRateLimit(`acc_${email}`);
    if (ipLimit.blocked || emailLimit.blocked) {
      const remaining = Math.max(ipLimit.remainingSecs, emailLimit.remainingSecs);
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Account/IP temporarily locked. Please try again in ${Math.ceil(
            remaining / 60
          )} minute(s).`,
        },
        { status: 429 }
      );
    }

    let user: any = null;

    // 1. Attempt lookup in local/staged database
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { customerProfile: true },
      });
    } catch (dbErr) {
      console.warn("Database query during login:", dbErr);
    }

    // 2. If not found in Prisma, check live Supabase profiles table
    if (!user) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .ilike("email", email)
            .maybeSingle();

          if (!error && profile) {
            const rawPassword = profile.visible_password || "";
            // Verify password against Supabase profile using constant-time comparison
            if (rawPassword && safeEqual(rawPassword, password)) {
              const mappedRole = mapSupabaseRole(profile.role);
              const passwordHash = await bcrypt.hash(password, 12);

              try {
                user = await prisma.user.upsert({
                  where: { email: profile.email.toLowerCase().trim() },
                  update: {
                    name: profile.full_name?.trim() || profile.email.split("@")[0],
                    role: mappedRole,
                    status: profile.is_locked ? "SUSPENDED" : "ACTIVE",
                    passwordHash,
                    visiblePassword: null,
                  },
                  create: {
                    id: profile.id || undefined,
                    email: profile.email.toLowerCase().trim(),
                    name: profile.full_name?.trim() || profile.email.split("@")[0],
                    role: mappedRole,
                    status: profile.is_locked ? "SUSPENDED" : "ACTIVE",
                    passwordHash,
                    visiblePassword: null,
                  },
                  include: { customerProfile: true },
                });
              } catch (upsertErr) {
                // If local SQLite/Prisma upsert fails in read-only/serverless, still allow verified Supabase user
                console.warn("Prisma user upsert warning during Supabase login:", upsertErr);
                user = {
                  id: profile.id,
                  email: profile.email.toLowerCase().trim(),
                  name: profile.full_name?.trim() || profile.email.split("@")[0],
                  role: mappedRole,
                  status: profile.is_locked ? "SUSPENDED" : "ACTIVE",
                  isLocked: Boolean(profile.is_locked),
                  passwordHash,
                  customerProfile: null,
                };
              }
            }
          }
        } catch (supErr) {
          console.warn("Supabase profile fallback check failed:", supErr);
        }
      }
    }

    // 3. User must exist in the database
    if (!user) {
      recordFailedAttempt(clientIp);
      recordFailedAttempt(`acc_${email}`);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // 4. Verify account active status
    if (user.status !== "ACTIVE" || user.isLocked) {
      return NextResponse.json(
        { error: "Account is suspended or locked. Please contact your system administrator." },
        { status: 403 }
      );
    }

    // 5. Verify credentials against bcrypt hash or DB password
    let isMatch = false;
    try {
      isMatch = await comparePassword(password, user.passwordHash);
    } catch {
      isMatch = false;
    }

    // Fallback 1: check legacy stored password in DB using constant-time comparison and upgrade to bcrypt
    if (!isMatch && user.visiblePassword && safeEqual(user.visiblePassword, password)) {
      isMatch = true;
      try {
        const newHash = await bcrypt.hash(password, 12);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash, visiblePassword: null },
        });
      } catch {
        // non-fatal
      }
    }

    // Fallback 2: verify live against Supabase profiles table using constant-time comparison
    if (!isMatch) {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("visible_password")
            .ilike("email", email)
            .maybeSingle();

          if (profile?.visible_password && safeEqual(profile.visible_password, password)) {
            isMatch = true;
            const newHash = await bcrypt.hash(password, 12);
            await prisma.user.update({
              where: { id: user.id },
              data: { passwordHash: newHash, visiblePassword: null },
            });
          }
        } catch {
          // non-fatal
        }
      }
    }

    if (!isMatch) {
      recordFailedAttempt(clientIp);
      recordFailedAttempt(`acc_${email}`);
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // Successful authentication: clear rate limits
    clearRateLimit(clientIp);
    clearRateLimit(`acc_${email}`);

    // 6. Generate signed JWT token
    let token: string;
    try {
      token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      });
    } catch (tokenErr: any) {
      console.error("Token signing error during login:", tokenErr?.message || tokenErr);
      return NextResponse.json(
        { error: "Authentication service is not configured. Please contact administrator." },
        { status: 503 }
      );
    }

    // 7. Record audit log (non-fatal)
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_LOGIN",
          entityType: "USER",
          entityId: user.id,
          details: `Successful login by ${user.name} (${user.role})`,
        },
      });
    } catch {
      // non-fatal
    }

    // 8. Update user visitor session (non-fatal)
    const visitorToken = req.headers.get("x-visitor-token") || `vis_usr_${user.id.substring(0, 8)}`;
    try {
      await prisma.visitorSession.upsert({
        where: { visitorToken },
        update: {
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || undefined,
          loginCount: { increment: 1 },
          lastActiveAt: new Date(),
        },
        create: {
          visitorToken,
          userId: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          landingPage: "/login",
          loginCount: 1,
          pageViewCount: 1,
          deviceType: "Desktop",
          lastActiveAt: new Date(),
        },
      });
    } catch {
      // non-fatal
    }

    // 9. Target redirect URL based on verified role
    let redirectUrl = "/customer";
    if (user.role === "ADMIN") redirectUrl = "/admin";
    else if (user.role === "MANAGER") redirectUrl = "/manager";
    else if (user.role === "ENGINEER") redirectUrl = "/engineer";

    const response = NextResponse.json({
      success: true,
      redirectUrl,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        customerProfile: user.customerProfile,
      },
    });

    // 10. Set secure HTTP-only cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during login" },
      { status: 500 }
    );
  }
}
