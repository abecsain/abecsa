import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { requestNumber: { contains: search } },
      ];
    }

    const requests = await prisma.softwareQuotationRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Fetch quotation requests error:", error);
    return NextResponse.json({ error: "Failed to fetch quotation requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      businessName,
      email,
      phone,
      city,
      businessType,
      preferredContact = "WHATSAPP",
      selectedProducts = [],
      selectedDatabaseTier,
      websiteRequirements,
      oneTimeTotal = 0,
      recurringTotal = 0,
      recurringInterval = "ANNUALLY",
      discountTotal = 0,
      taxAmount = 0,
      grandTotal = 0,
    } = body;

    if (!customerName || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and mobile phone number are required" },
        { status: 400 }
      );
    }

    const count = await prisma.softwareQuotationRequest.count();
    const requestNumber = `REQ-2026-${String(count + 101).padStart(3, "0")}`;

    const quotationRequest = await prisma.softwareQuotationRequest.create({
      data: {
        requestNumber,
        customerName: customerName.trim(),
        businessName: businessName?.trim() || null,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city?.trim() || null,
        businessType: businessType?.trim() || null,
        preferredContact,
        selectedProducts: typeof selectedProducts === "string" ? selectedProducts : JSON.stringify(selectedProducts),
        selectedDatabaseTier: selectedDatabaseTier || null,
        websiteRequirements: websiteRequirements
          ? typeof websiteRequirements === "string"
            ? websiteRequirements
            : JSON.stringify(websiteRequirements)
          : null,
        oneTimeTotal: Number(oneTimeTotal) || 0,
        recurringTotal: Number(recurringTotal) || 0,
        recurringInterval: recurringInterval || "ANNUALLY",
        discountTotal: Number(discountTotal) || 0,
        taxAmount: Number(taxAmount) || 0,
        grandTotal: Number(grandTotal) || 0,
        status: "NEW",
      },
    });

    // Also auto-record a Lead in CRM pipeline so admins and managers never miss it
    try {
      const leadCount = await prisma.crmLead.count();
      const leadNumber = `LEAD-2026-${String(leadCount + 101).padStart(3, "0")}`;

      const lead = await prisma.crmLead.create({
        data: {
          leadNumber,
          name: customerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          companyName: businessName?.trim() || `${customerName}'s Business`,
          serviceInterested: `Configurator: ${requestNumber}`,
          budgetRange: `₹${Number(grandTotal).toLocaleString("en-IN")}`,
          preferredContact,
          message: `Dynamic Solution Package Quotation Request: One-time ₹${Number(oneTimeTotal).toLocaleString("en-IN")}, Recurring ₹${Number(recurringTotal).toLocaleString("en-IN")}/${recurringInterval}`,
          status: "NEW",
          score: 85,
        },
      });

      // Notify Admins
      const adminUsers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] } },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((u) => ({
            userId: u.id,
            title: `New Quotation Request (${requestNumber})`,
            message: `${customerName} (${businessName || "Client"}) submitted an itemized package quotation request for ₹${Number(grandTotal).toLocaleString("en-IN")}.`,
            type: "INFO",
            linkUrl: "/admin/solutions",
          })),
        });
      }
    } catch (e) {
      console.warn("Lead record note:", e);
    }

    return NextResponse.json({
      success: true,
      requestNumber,
      quotationRequest,
      message: "Quotation request successfully submitted! Our software architects will share an official breakdown within 24 hours.",
    });
  } catch (error) {
    console.error("Create quotation request error:", error);
    return NextResponse.json({ error: "Failed to submit quotation request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, internalNotes, discountTotal, grandTotal } = body;

    if (!id) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (internalNotes !== undefined) updateData.internalNotes = internalNotes;
    if (discountTotal !== undefined) updateData.discountTotal = Number(discountTotal);
    if (grandTotal !== undefined) updateData.grandTotal = Number(grandTotal);

    const updated = await prisma.softwareQuotationRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error) {
    console.error("Update quotation request error:", error);
    return NextResponse.json({ error: "Failed to update quotation request" }, { status: 500 });
  }
}
