import { NextRequest, NextResponse } from "next/server";
import { getWhatsAppServiceStatus, initWhatsAppSocket } from "@/lib/whatsappServerService";

export async function GET(req: NextRequest) {
  try {
    let serviceStatus = getWhatsAppServiceStatus();

    // If socket is not running, spin it up to generate QR
    if (serviceStatus.status === "DISCONNECTED") {
      await initWhatsAppSocket({ forceNew: true });
      serviceStatus = getWhatsAppServiceStatus();
    }

    return NextResponse.json({
      success: true,
      status: serviceStatus.status,
      qr: serviceStatus.qr,
      pairingCode: serviceStatus.pairingCode,
      phone: serviceStatus.phone,
    });
  } catch (error: any) {
    console.error("WhatsApp QR API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
