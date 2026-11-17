import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { customerProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Account is suspended or inactive. Please contact your administrator." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "USER",
        entityId: user.id,
        details: `Successful login by ${user.name} (${user.role})`,
      },
    });

    // Update user login count & visitor session
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

    // Determine target redirect url based on role
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

    // Set secure cookie
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
