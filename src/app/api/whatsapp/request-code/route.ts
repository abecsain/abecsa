import { NextRequest, NextResponse } from "next/server";
import { initWhatsAppSocket, getWhatsAppServiceStatus } from "@/lib/whatsappServerService";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "10-digit mobile number is required" },
        { status: 400 }
      );
    }

    const cleanNumber = phone.replace(/\D/g, "");
    if (cleanNumber.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit mobile number" },
        { status: 400 }
      );
    }

    // Initialize socket with pairing code request
    await initWhatsAppSocket({ phoneForPairing: cleanNumber, forceNew: true });

    // Wait up to 4.5 seconds for pairing code to generate
    let attempts = 0;
    while (attempts < 9) {
      const current = getWhatsAppServiceStatus();
      if (current.pairingCode) {
        return NextResponse.json({
          success: true,
          status: "WAITING_FOR_PAIRING",
          pairingCode: current.pairingCode,
          phone: cleanNumber,
          message: "Enter this 8-digit code on WhatsApp (Linked Devices > Link with phone number instead)",
        });
      }
      await new Promise((r) => setTimeout(r, 500));
      attempts++;
    }

    const latest = getWhatsAppServiceStatus();
    return NextResponse.json({
      success: true,
      status: latest.status,
      pairingCode: latest.pairingCode,
      phone: cleanNumber,
      message: "Pairing code request initiated. Check WhatsApp notification.",
    });
  } catch (error: any) {
    console.error("WhatsApp Request Code API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate pairing code" },
      { status: 500 }
    );
  }
}
