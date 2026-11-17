import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
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
}
