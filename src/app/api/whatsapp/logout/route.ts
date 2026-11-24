import { NextRequest, NextResponse } from "next/server";
import { logoutWhatsApp } from "@/lib/whatsappServerService";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await logoutWhatsApp();
    return NextResponse.json({
      success: true,
      message: "WhatsApp session logged out and local credentials cleared successfully.",
    });
  } catch (error: any) {
    console.error("WhatsApp Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to log out" },
      { status: 500 }
    );
  }
}
