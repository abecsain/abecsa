import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const whereClause: {
    customerId?: string;
    status?: { not: string };
  } = {};

  if (sessionUser.effectiveRole === "CUSTOMER") {
    if (!sessionUser.customerProfile) {
      return NextResponse.json({ quotations: [] });
    }
    whereClause.customerId = sessionUser.customerProfile.id;
    // Don't show internal drafts to customer
    whereClause.status = { not: "DRAFT" };
  } else if (customerId) {
    whereClause.customerId = customerId;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
      project: {
        select: { id: true, projectId: true, name: true },
      },
      items: true,
    },
  });

  return NextResponse.json({ quotations });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      customerId,
      projectId,
      title,
      items,
      discount = 0,
      taxRate = 18.0,
      paymentTerms,
      validUntil,
      notes,
      termsConditions,
      status = "SENT",
    } = data;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Quotation proposal title is required" },
        { status: 400 }
      );
    }

    // Resolve target customer
    let targetCustomerId = customerId && customerId.trim() !== "" ? customerId : null;
    if (!targetCustomerId) {
      const firstCustomer = await prisma.customerProfile.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (firstCustomer) {
        targetCustomerId = firstCustomer.id;
      } else {
        return NextResponse.json(
          { error: "No client profile found. Please register a customer first." },
          { status: 400 }
        );
      }
    }

    // Resolve items with fallback
    const rawItems = Array.isArray(items) && items.length > 0 ? items : [
      { description: "Software Architecture, Engineering & API Integration", quantity: 1, unitPrice: 250000 }
    ];

    // Generate Quotation Number
    const count = await prisma.quotation.count();
    const quotationNumber = `QT-2026-${String(count + 1).padStart(3, "0")}`;

    // Calculate financials
    let subtotal = 0;
    const computedItems = rawItems.map((it: { description: string; quantity: number; unitPrice: number }) => {
      const q = Number(it.quantity || 1);
      const u = Number(it.unitPrice || 0);
      const amt = q * u;
      subtotal += amt;
      return {
        description: it.description || "Engineering Deliverable",
        quantity: q,
        unitPrice: u,
        amount: amt,
      };
    });

    const disc = Number(discount || 0);
    const taxable = Math.max(0, subtotal - disc);
    const taxAmt = Math.round((taxable * Number(taxRate)) / 100);
    const grandTotal = taxable + taxAmt;

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: targetCustomerId,
        projectId: projectId && projectId.trim() !== "" ? projectId : undefined,
        title: title.trim(),
        currency: "INR",
        subtotal,
        discount: disc,
        taxRate: Number(taxRate),
        taxAmount: taxAmt,
        totalAmount: grandTotal,
        paymentTerms,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes,
        termsConditions,
        status,
        items: {
          create: computedItems,
        },
      },
      include: {
        customer: { include: { user: true } },
        items: true,
      },
    });

    // Notify customer
    if (quotation.customer?.userId) {
      await prisma.notification.create({
        data: {
          userId: quotation.customer.userId,
          title: "New Quotation Shared with You",
          message: `ABECSA has prepared formal quotation ${quotationNumber} (${title}) for ₹${grandTotal.toLocaleString("en-IN")}.`,
          type: "INFO",
          linkUrl: "/customer/quotations",
        },
      });
    }

    // Push notice to customer notice board
    await prisma.noticeMessage.create({
      data: {
        customerId: targetCustomerId,
        senderId: sessionUser.id,
        title: `Official Quotation ${quotationNumber} Ready for Review`,
        message: `Please review and approve the proposal for ${title.trim()}. Total estimated investment: ₹${grandTotal.toLocaleString("en-IN")}.`,
        priority: "IMPORTANT",
        actionUrl: "/customer/quotations",
        actionLabel: "Review & Sign Quotation",
      },
    });

    return NextResponse.json({ success: true, quotation });
  } catch (error) {
    console.error("Create quotation error:", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}

// Client Approval / Revision / Conversion
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, action, clientResponse, convertToInvoice } = body;

    if (!id) {
      return NextResponse.json({ error: "Quotation ID required" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true, project: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // CUSTOMER APPROVAL / REJECTION:
    if (action === "APPROVE" || action === "REJECT") {
      if (sessionUser.effectiveRole === "CUSTOMER" && quotation.customerId !== sessionUser.customerProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const updatedStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
      const updated = await prisma.quotation.update({
        where: { id },
        data: {
          status: updatedStatus,
          clientResponse: clientResponse || (action === "APPROVE" ? "Approved by client via customer portal." : "Revision requested by client."),
        },
      });

      // Notify managers and admin
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] } },
        select: { id: true },
      });

      for (const u of staffUsers) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            title: `Quotation ${quotation.quotationNumber} ${updatedStatus}`,
            message: `Customer ${quotation.customer.companyName} marked quotation ${quotation.quotationNumber} as ${updatedStatus}.`,
            type: action === "APPROVE" ? "SUCCESS" : "WARNING",
            linkUrl: "/admin/quotations",
          },
        });
      }

      return NextResponse.json({ success: true, quotation: updated });
    }

    // CONVERT APPROVED QUOTATION TO INVOICE (Admin or Manager)
    if (convertToInvoice) {
      if (!["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const invCount = await prisma.invoice.count();
      const invoiceNumber = `INV-2026-${String(invCount + 1).padStart(3, "0")}`;

      const newInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          projectId: quotation.projectId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
          currency: quotation.currency,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          amountPaid: 0,
          balanceAmount: quotation.totalAmount,
          status: "UNPAID",
          paymentTerms: quotation.paymentTerms || "Net 15 Days",
          notes: `Generated from Approved Quotation ${quotation.quotationNumber}`,
          items: {
            create: quotation.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              amount: it.amount,
            })),
          },
        },
      });

      await prisma.quotation.update({
        where: { id },
        data: { status: "CONVERTED_TO_INVOICE" },
      });

      return NextResponse.json({
        success: true,
        message: `Quotation converted to Invoice ${invoiceNumber}`,
        invoice: newInvoice,
      });
    }

    // Direct update quotation fields (title, discount, notes, terms, status)
    if (["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      const updateData: any = {};
      if (body.title) updateData.title = body.title.trim();
      if (body.status) updateData.status = body.status;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.paymentTerms !== undefined) updateData.paymentTerms = body.paymentTerms;
      if (body.validUntil) updateData.validUntil = new Date(body.validUntil);
      if (body.discount !== undefined) {
        const disc = Number(body.discount);
        updateData.discount = disc;
        const taxable = Math.max(0, quotation.subtotal - disc);
        updateData.taxAmount = Math.round((taxable * quotation.taxRate) / 100);
        updateData.totalAmount = taxable + updateData.taxAmount;
      }

      const updated = await prisma.quotation.update({
        where: { id },
        data: updateData,
        include: { customer: { include: { user: true } }, items: true },
      });

      return NextResponse.json({ success: true, quotation: updated });
    }

    return NextResponse.json({ error: "No valid action specified" }, { status: 400 });
  } catch (error) {
    console.error("Quotation action error:", error);
    return NextResponse.json({ error: "Failed to process quotation" }, { status: 500 });
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
      return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 });
    }

    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("Delete quotation error:", error);
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}
