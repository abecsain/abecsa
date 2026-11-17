import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { invoiceId, amount, paymentMethod, transactionReference, receiptUrl, notes } = data;

    if (!invoiceId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invoice ID and valid amount are required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Role check: Customer can submit payment receipt for their own invoice; staff can record payment
    if (sessionUser.effectiveRole === "CUSTOMER" && invoice.customerId !== sessionUser.customerProfile?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payAmount = Number(amount);
    const newPaid = invoice.amountPaid + payAmount;
    const newBalance = Math.max(0, invoice.totalAmount - newPaid);

    let newStatus = "PARTIALLY_PAID";
    if (newBalance <= 0) {
      newStatus = "PAID";
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        customerId: invoice.customerId,
        amount: payAmount,
        paymentDate: new Date(),
        paymentMethod: paymentMethod || "BANK_TRANSFER",
        transactionReference: transactionReference || "MANUAL-REC",
        receiptUrl,
        status: "VERIFIED",
        verifiedById: sessionUser.id,
        notes: notes || `Payment recorded by ${sessionUser.name}`,
      },
    });

    // Update invoice balance and status
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newPaid,
        balanceAmount: newBalance,
        status: newStatus,
      },
      include: { payments: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "RECORD_PAYMENT",
        entityType: "PAYMENT",
        entityId: payment.id,
        details: `Recorded ₹${payAmount.toLocaleString("en-IN")} on ${invoice.invoiceNumber}. New Status: ${newStatus}`,
      },
    });

    return NextResponse.json({
      success: true,
      payment,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
