import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();

  // Strict security check: ONLY actual ADMIN can switch views
  if (!sessionUser || sessionUser.actualRole !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Only Super Administrators can switch operational perspectives" },
      { status: 403 }
    );
  }

  const { targetRole } = await req.json();
  const validRoles = ["ADMIN", "MANAGER", "ENGINEER", "CUSTOMER"];

  if (!validRoles.includes(targetRole)) {
    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  }

  // Issue new session token with verified impersonation attribute
  const token = signToken({
    userId: sessionUser.id,
    email: sessionUser.email,
    role: sessionUser.actualRole,
    name: sessionUser.name,
    impersonatedRole: targetRole,
  });

  let redirectUrl = "/admin";
  if (targetRole === "MANAGER") redirectUrl = "/manager";
  else if (targetRole === "ENGINEER") redirectUrl = "/engineer";
  else if (targetRole === "CUSTOMER") redirectUrl = "/customer";

  const response = NextResponse.json({
    success: true,
    effectiveRole: targetRole,
    redirectUrl,
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
