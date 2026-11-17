import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { generateSessionQRCode } from "@/lib/whatsapp";

// POST initiate or toggle pairing session
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { accountId, action, phoneNumber } = await req.json(); // action: "GENERATE_QR" | "CONFIRM_PAIR" | "DISCONNECT"

    const account = await prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accountInclude = {
      messages: {
        orderBy: { sentAt: "desc" as const },
        take: 50,
      },
    };

    if (action === "GENERATE_QR") {
      const sessionKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const qrDataUrl = await generateSessionQRCode(sessionKey);

      const updated = await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          connectionStatus: "PAIRING_QR",
          qrCode: qrDataUrl,
          phoneNumber: phoneNumber || account.phoneNumber,
          lastHeartbeat: new Date(),
        },
        include: accountInclude,
      });

      return NextResponse.json({
        success: true,
        status: "PAIRING_QR",
        qrCode: qrDataUrl,
        account: updated,
      });
    }

    if (action === "CONFIRM_PAIR") {
      const updated = await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          connectionStatus: "CONNECTED",
          qrCode: null,
          phoneNumber: phoneNumber || account.phoneNumber || "+91 98765 00000",
          lastHeartbeat: new Date(),
        },
        include: accountInclude,
      });

      return NextResponse.json({
        success: true,
        status: "CONNECTED",
        message: "WhatsApp session paired and synchronized successfully!",
        account: updated,
      });
    }

    if (action === "DISCONNECT") {
      const updated = await prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          connectionStatus: "DISCONNECTED",
          qrCode: null,
        },
        include: accountInclude,
      });

      return NextResponse.json({
        success: true,
        status: "DISCONNECTED",
        message: "WhatsApp session disconnected.",
        account: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("WhatsApp pairing error:", error);
    return NextResponse.json({ error: "Pairing action failed" }, { status: 500 });
  }
}
