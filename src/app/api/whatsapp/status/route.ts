import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppServiceStatus, initWhatsAppSocket } from "@/lib/whatsappServerService";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let serviceStatus = getWhatsAppServiceStatus();

    // If service was disconnected or freshly booted, check if there is a saved DB session
    if (serviceStatus.status === "DISCONNECTED") {
      const account = await prisma.whatsAppAccount.findFirst({
        where: { accountType: "COMPANY_CENTRAL" },
      });

      if (account?.sessionBundle) {
        // Auto-warm the socket in the background to restore session
        initWhatsAppSocket().catch((err) =>
          console.warn("[WhatsApp Status] Auto-warm note:", err.message)
        );
        serviceStatus = getWhatsAppServiceStatus();
      }
    }

    return NextResponse.json({
      success: true,
      ...serviceStatus,
    });
  } catch (error: any) {
    console.error("WhatsApp Status API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch status" },
      { status: 500 }
    );
  }
}
