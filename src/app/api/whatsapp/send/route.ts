import { NextRequest, NextResponse } from "next/server";
import {
  sendWhatsAppMessage,
  formatPOSInvoiceMessage,
  formatPaymentReminderMessage,
} from "@/lib/whatsappServerService";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER", "ENGINEER"].includes(sessionUser.effectiveRole)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Staff credentials required to dispatch messages" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      phone,
      message,
      imageBase64,
      pdfBase64,
      fileName,
      dedupeKey,
      invoiceData,
      isReminder,
    } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Recipient phone number is required" },
        { status: 400 }
      );
    }

    let finalMessage = message;

    // If invoice data is provided, format structured POS bill or reminder
    if (invoiceData) {
      if (isReminder) {
        finalMessage = formatPaymentReminderMessage(invoiceData);
      } else {
        finalMessage = formatPOSInvoiceMessage(invoiceData);
      }
    }

    if (!finalMessage) {
      return NextResponse.json(
        { success: false, error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    // Send through server service
    const result = await sendWhatsAppMessage({
      phone: formattedPhone,
      message: finalMessage,
      imageBase64,
      pdfBase64,
      fileName: fileName || "Invoice.pdf",
      dedupeKey: dedupeKey || (invoiceData ? `inv_${invoiceData.invoiceNumber}` : null),
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: "Message dispatched automatically via WhatsApp Baileys engine!",
      });
    }

    // Offline / Disconnected Fallback: return 1-click wa.me URL
    return NextResponse.json({
      success: false,
      fallbackUrl:
        result.fallbackUrl ||
        `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`,
      error: result.error || "WhatsApp engine is offline. Use the 1-click manual fallback.",
    });
  } catch (error: any) {
    console.error("WhatsApp Send API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to dispatch message" },
      { status: 500 }
    );
  }
}
