import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { applyRateLimit, safeErrorResponse } from "@/lib/security";

// GET Meta Webhook Verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const VERIFY_TOKEN = configuredToken || "abecsa_waba_verify_token_2026";

  if (mode === "subscribe") {
    if (token && token === VERIFY_TOKEN && challenge) {
      return new NextResponse(challenge, { status: 200 });
    }
    return NextResponse.json({ error: "Verification token mismatch" }, { status: 403 });
  }

  return NextResponse.json({ status: "Verified webhook endpoint ready" });
}

// POST Meta Webhook Status Event & Message Ingestion
export async function POST(req: NextRequest) {
  const rateLimitRes = applyRateLimit(req, "whatsapp_webhook", 120, 60 * 1000);
  if (rateLimitRes) return rateLimitRes;

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
