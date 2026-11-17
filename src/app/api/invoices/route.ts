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
      return NextResponse.json({ invoices: [] });
    }
    whereClause.customerId = sessionUser.customerProfile.id;
    whereClause.status = { not: "DRAFT" };
  } else if (customerId) {
    whereClause.customerId = customerId;
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    orderBy: { issueDate: "desc" },
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
      payments: {
        orderBy: { paymentDate: "desc" },
      },
    },
  });

  return NextResponse.json({ invoices });
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
      dueDate,
      items,
      paymentTerms,
      notes,
    } = data;

    // Resolve customer with defensive fallback
    let targetCustomerId = customerId && customerId.trim() !== "" ? customerId : null;
    if (!targetCustomerId) {
      const firstCustomer = await prisma.customerProfile.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (firstCustomer) {
        targetCustomerId = firstCustomer.id;
      } else {
        return NextResponse.json(
          { error: "No customer account found. Please register a customer first." },
          { status: 400 }
        );
      }
    }

    const targetDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 86400000);

    const rawItems = Array.isArray(items) && items.length > 0 ? items : [
      { description: "Sprint Milestone Delivery & Software Engineering", quantity: 1, unitPrice: 250000 }
    ];

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(3, "0")}`;

    let subtotal = 0;
    const computedItems = rawItems.map((it: { description: string; quantity: number; unitPrice: number }) => {
      const q = Number(it.quantity || 1);
      const u = Number(it.unitPrice || 0);
      const amt = q * u;
      subtotal += amt;
      return {
        description: it.description || "Milestone Payment",
        quantity: q,
        unitPrice: u,
        amount: amt,
      };
    });

    const taxAmount = Math.round((subtotal * 18) / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: targetCustomerId,
        projectId: projectId && projectId.trim() !== "" ? projectId : undefined,
        issueDate: new Date(),
        dueDate: targetDueDate,
        currency: "INR",
        subtotal,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        balanceAmount: totalAmount,
        status: "UNPAID",
        paymentTerms: paymentTerms || "Payment due within 15 days of issue",
        notes,
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
    if (invoice.customer?.userId) {
      await prisma.notification.create({
        data: {
          userId: invoice.customer.userId,
          title: "New Tax Invoice Issued",
          message: `Tax Invoice ${invoiceNumber} for ₹${totalAmount.toLocaleString("en-IN")} has been generated. Due date: ${targetDueDate.toLocaleDateString()}.`,
          type: "INFO",
          linkUrl: "/customer/invoices",
        },
      });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Create invoice error:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id, status, notes, paymentTerms, dueDate, amountPaid } = data;

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (dueDate) updateData.dueDate = new Date(dueDate);

    if (amountPaid !== undefined) {
      const paid = Number(amountPaid);
      updateData.amountPaid = paid;
      updateData.balanceAmount = Math.max(0, invoice.totalAmount - paid);
      if (updateData.balanceAmount === 0) {
        updateData.status = "PAID";
      } else if (paid > 0) {
        updateData.status = "PARTIALLY_PAID";
      }
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { include: { user: true } },
        items: true,
      },
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
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
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
    await prisma.payment.deleteMany({ where: { invoiceId: id } });
    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Delete invoice error:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
