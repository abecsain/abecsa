import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

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
    const body = await req.json();
    const email = body?.email ? String(body.email).toLowerCase().trim() : "";
    const password = body?.password ? String(body.password) : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
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
            // Verify password against Supabase profile
            if (rawPassword && rawPassword === password) {
              const mappedRole = mapSupabaseRole(profile.role);
              const passwordHash = await bcrypt.hash(password, 10);

              user = await prisma.user.upsert({
                where: { email: profile.email.toLowerCase().trim() },
                update: {
                  name: profile.full_name?.trim() || profile.email.split("@")[0],
                  role: mappedRole,
                  status: profile.is_locked ? "SUSPENDED" : "ACTIVE",
                  passwordHash,
                  visiblePassword: rawPassword,
                },
                create: {
                  id: profile.id || undefined,
                  email: profile.email.toLowerCase().trim(),
                  name: profile.full_name?.trim() || profile.email.split("@")[0],
                  role: mappedRole,
                  status: profile.is_locked ? "SUSPENDED" : "ACTIVE",
                  passwordHash,
                  visiblePassword: rawPassword,
                },
                include: { customerProfile: true },
              });
            }
          }
        } catch (supErr) {
          console.warn("Supabase profile fallback check failed:", supErr);
        }
      }
    }

    // 3. User must exist in the database
    if (!user) {
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

    // Fallback: check stored password in DB and upgrade to bcrypt
    if (!isMatch && user.visiblePassword && user.visiblePassword === password) {
      isMatch = true;
      try {
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: newHash },
        });
      } catch {
        // non-fatal
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials. Please verify your email and password." },
        { status: 401 }
      );
    }

    // 6. Generate signed JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

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
