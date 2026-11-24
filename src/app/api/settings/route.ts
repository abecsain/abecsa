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
        email: "Abecsa.in@gmail.com",
        phone: "+91 94078 99216",
        whatsappNumber: "+91 94078 99216",
        address: "Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100",
        website: "https://abecsa.in",
        gstNumber: "",
        currency: "INR",
        defaultTaxRate: 18.0,
      },
    });
  } else if (settings.email === "contact@abecsa.in" || settings.phone === "+91 98765 43210" || settings.gstNumber === "29AABCA1234F1Z8") {
    settings = await prisma.companySettings.update({
      where: { id: "abecsa-settings" },
      data: {
        email: "Abecsa.in@gmail.com",
        phone: "+91 94078 99216",
        whatsappNumber: "+91 94078 99216",
        gstNumber: "",
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
