import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const gift = await prisma.scratchGift.findUnique({
      where: { slug },
      include: {
        createdBy: {
          select: { name: true, jobTitle: true },
        },
      },
    });

    if (!gift) {
      return NextResponse.json({ error: "Gift scratch card not found" }, { status: 404 });
    }

    // Fetch company settings for WhatsApp number
    const companySettings = await prisma.companySettings.findUnique({
      where: { id: "abecsa-settings" },
      select: {
        companyName: true,
        whatsappNumber: true,
        phone: true,
        logoUrl: true,
      },
    });

    const companyPhone =
      companySettings?.whatsappNumber || companySettings?.phone || "919876543210";
    const cleanCompanyPhone = companyPhone.replace(/\D/g, "");

    const isExpired = gift.expiresAt ? new Date(gift.expiresAt) < new Date() : false;

    return NextResponse.json({
      success: true,
      gift: {
        id: gift.id,
        slug: gift.slug,
        title: gift.title,
        prizeTitle: gift.prizeTitle,
        prizeDescription: gift.prizeDescription,
        couponCode: gift.couponCode,
        customerName: gift.customerName,
        customerPhone: gift.customerPhone,
        buttonText: gift.buttonText || "Claim Gift on WhatsApp",
        redirectionType: gift.redirectionType,
        customUrl: gift.customUrl,
        whatsappMessage: gift.whatsappMessage,
        isScratched: gift.isScratched,
        isClaimed: gift.isClaimed,
        expiresAt: gift.expiresAt,
        isExpired,
        senderName: gift.createdBy?.name || "ABECSA Team",
        companyName: companySettings?.companyName || "ABECSA Software Solutions",
        companyPhone: cleanCompanyPhone,
        createdAt: gift.createdAt,
      },
    });
  } catch (error) {
    console.error("Get gift slug error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const { action } = body; // "SCRATCH" or "CLAIM"

    const gift = await prisma.scratchGift.findUnique({
      where: { slug },
    });

    if (!gift) {
      return NextResponse.json({ error: "Gift not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (action === "SCRATCH") {
      updateData.isScratched = true;
      if (!gift.scratchedAt) updateData.scratchedAt = new Date();
    } else if (action === "CLAIM") {
      updateData.isClaimed = true;
      if (!gift.claimedAt) updateData.claimedAt = new Date();
    }

    const updated = await prisma.scratchGift.update({
      where: { slug },
      data: updateData,
    });

    return NextResponse.json({ success: true, gift: updated });
  } catch (error) {
    console.error("Patch gift slug error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
