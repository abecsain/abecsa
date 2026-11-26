import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { safeErrorResponse } from "@/lib/security";
import { isValidEmail } from "@/lib/validation";

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
    const rawData = await req.json();

    // Mass assignment prevention: Only allow safe configurable keys
    const allowedKeys = [
      "companyName",
      "tagline",
      "logoUrl",
      "email",
      "phone",
      "whatsappNumber",
      "address",
      "website",
      "gstNumber",
      "currency",
      "defaultTaxRate",
    ];

    const cleanData: any = {};
    for (const key of allowedKeys) {
      if (rawData[key] !== undefined) {
        cleanData[key] = rawData[key];
      }
    }

    if (cleanData.email && !isValidEmail(cleanData.email)) {
      return NextResponse.json({ error: "Invalid company email address format" }, { status: 400 });
    }

    if (cleanData.defaultTaxRate !== undefined) {
      cleanData.defaultTaxRate = Number(cleanData.defaultTaxRate) || 0;
    }

    const updated = await prisma.companySettings.upsert({
      where: { id: "abecsa-settings" },
      update: cleanData,
      create: {
        id: "abecsa-settings",
        ...cleanData,
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
    return safeErrorResponse(error, "Failed to update settings");
  }
}
