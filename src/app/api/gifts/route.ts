import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const whereClause: any = {};
    if (sessionUser.effectiveRole === "MANAGER") {
      whereClause.createdById = sessionUser.id;
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { prizeTitle: { contains: search } },
        { couponCode: { contains: search } },
        { customerName: { contains: search } },
      ];
    }

    const gifts = await prisma.scratchGift.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, gifts });
  } catch (error) {
    console.error("Fetch gifts error:", error);
    return NextResponse.json({ error: "Failed to fetch gifts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      title,
      prizeTitle,
      prizeDescription,
      couponCode,
      customerName,
      customerPhone,
      buttonText = "Claim Gift on WhatsApp",
      redirectionType = "WHATSAPP", // "WHATSAPP" or "CUSTOM_URL"
      customUrl,
      whatsappMessage,
      expiresAt,
    } = body;

    if (!title || !prizeTitle) {
      return NextResponse.json(
        { error: "Gift Title and Prize Title are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const randomHex = crypto.randomBytes(4).toString("hex");
    const slug = `gift-${Date.now().toString(36)}-${randomHex}`;

    // Auto-generate coupon code if not provided
    const finalCoupon =
      couponCode?.trim() ||
      `ABECSA-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // Default WhatsApp message if not customized
    const defaultWaMsg =
      whatsappMessage?.trim() ||
      `Hello ABECSA Team! 🎉 I just scratched and unlocked my surprise gift: *${prizeTitle.trim()}*.\n\nMy Coupon Code is: *${finalCoupon}*\nRecipient: ${
        customerName?.trim() || "Valued Client"
      }\n\nPlease help me redeem this gift for my account!`;

    const gift = await prisma.scratchGift.create({
      data: {
        slug,
        title: title.trim(),
        prizeTitle: prizeTitle.trim(),
        prizeDescription: prizeDescription?.trim() || null,
        couponCode: finalCoupon,
        customerName: customerName?.trim() || null,
        customerPhone: customerPhone?.trim() || null,
        buttonText: buttonText?.trim() || "Claim Gift on WhatsApp",
        redirectionType: redirectionType === "CUSTOM_URL" ? "CUSTOM_URL" : "WHATSAPP",
        customUrl: customUrl?.trim() || null,
        whatsappMessage: defaultWaMsg,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: sessionUser.id,
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "CREATE_SCRATCH_GIFT",
          entityType: "SCRATCH_GIFT",
          entityId: gift.id,
          details: `Created scratch card gift "${gift.title}" (${gift.prizeTitle}) with slug ${gift.slug}`,
        },
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, gift });
  } catch (error) {
    console.error("Create scratch gift error:", error);
    return NextResponse.json({ error: "Failed to create scratch gift" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Gift ID is required" }, { status: 400 });
    }

    const gift = await prisma.scratchGift.findUnique({
      where: { id },
    });

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    if (sessionUser.effectiveRole === "MANAGER" && gift.createdById !== sessionUser.id) {
      return NextResponse.json({ error: "Unauthorized to delete this gift" }, { status: 403 });
    }

    await prisma.scratchGift.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete scratch gift error:", error);
    return NextResponse.json({ error: "Failed to delete scratch gift" }, { status: 500 });
  }
}
