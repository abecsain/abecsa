import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  let settings = await prisma.companySettings.findUnique({
    where: { id: "abecsa-settings" },
  });

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        id: "abecsa-settings",
        companyName: "ABECSA Software Solutions",
        tagline: "Enterprise Digital & Software Engineering",
        logoUrl: "/logo.png",
        email: "contact@abecsa.in",
        phone: "+91 98765 43210",
        address: "Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100",
        website: "https://abecsa.in",
        gstNumber: "29AABCA1234F1Z8",
        currency: "INR",
        defaultTaxRate: 18.0,
      },
    });
  }

  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Only Admin can update settings" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const updated = await prisma.companySettings.upsert({
      where: { id: "abecsa-settings" },
      update: data,
      create: {
        id: "abecsa-settings",
        ...data,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "UPDATE_SETTINGS",
        entityType: "SETTINGS",
        details: `Company configuration updated by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
