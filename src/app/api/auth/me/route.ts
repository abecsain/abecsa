import { NextResponse } from "next/server";
import { getSessionUser, signToken, COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      effectiveRole: user.effectiveRole,
      actualRole: user.actualRole,
      isImpersonating: user.isImpersonating,
      customerProfile: user.customerProfile,
      department: user.department,
      jobTitle: user.jobTitle,
    },
  });

  // Rolling 7-day session renewal: refresh cookie on active profile check
  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.actualRole,
    name: user.name,
    impersonatedRole: user.effectiveRole !== user.actualRole ? user.effectiveRole : undefined,
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days rolling expiration
    path: "/",
  });

  return response;
}
