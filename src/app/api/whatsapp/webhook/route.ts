import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET Meta Webhook Verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "abecsa_waba_verify_token_2026";

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "Verified webhook endpoint ready" });
}

// POST Meta Webhook Status Event & Message Ingestion
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle Meta status updates (sent, delivered, read)
    if (body.entry && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const statuses = change.value?.statuses;
            if (Array.isArray(statuses)) {
              for (const s of statuses) {
                const messageId = s.id;
                const status = s.status?.toUpperCase(); // SENT, DELIVERED, READ, FAILED

                if (messageId && status) {
                  await prisma.whatsAppMessage.updateMany({
                    where: { messageId },
                    data: {
                      status,
                      deliveredAt: status === "DELIVERED" ? new Date() : undefined,
                      readAt: status === "READ" ? new Date() : undefined,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "EVENT_RECEIVED" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json({ status: "ERROR" }, { status: 500 });
  }
}
