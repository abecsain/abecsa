import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { safeErrorResponse, applyRateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  // Rate limit payment submissions: max 10 per minute per IP
  const rateLimitRes = applyRateLimit(req, "payment_submit", 10, 60 * 1000);
  if (rateLimitRes) return rateLimitRes;

  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { invoiceId, amount, paymentMethod, transactionReference, receiptUrl, notes } = data;

    if (!invoiceId || !amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      return NextResponse.json({ error: "Invoice ID and valid positive amount are required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const isStaff = ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole);

    // Role check: Customer can only submit payment proof for their own invoice
    if (!isStaff) {
      if (sessionUser.effectiveRole !== "CUSTOMER" || invoice.customerId !== sessionUser.customerProfile?.id) {
        return NextResponse.json({ error: "Forbidden: You cannot submit payments for this invoice" }, { status: 403 });
      }
    }

    const payAmount = Number(amount);

    if (isStaff) {
      // Staff-verified payment recording
      const newPaid = invoice.amountPaid + payAmount;
      const newBalance = Math.max(0, invoice.totalAmount - newPaid);

      let newStatus = "PARTIALLY_PAID";
      if (newBalance <= 0) {
        newStatus = "PAID";
      }

      // Create verified payment record
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
          notes: notes || `Payment recorded and verified by ${sessionUser.name}`,
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
          details: `Staff ${sessionUser.name} recorded ₹${payAmount.toLocaleString("en-IN")} on ${invoice.invoiceNumber}. New Status: ${newStatus}`,
        },
      });

      return NextResponse.json({
        success: true,
        payment,
        invoice: updatedInvoice,
      });
    } else {
      // Customer payment proof submission: PENDING VERIFICATION
      // Does NOT zero out the balance until verified by staff!
      const payment = await prisma.payment.create({
        data: {
          invoiceId,
          customerId: invoice.customerId,
          amount: payAmount,
          paymentDate: new Date(),
          paymentMethod: paymentMethod || "ONLINE_TRANSFER",
          transactionReference: transactionReference || "PENDING-SUBMISSION",
          receiptUrl,
          status: "PENDING_VERIFICATION",
          verifiedById: null,
          notes: notes || `Submitted by client ${sessionUser.name}. Awaiting staff reconciliation.`,
        },
      });

      // Notify Admins & Managers for reconciliation
      const managers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] } },
        select: { id: true },
      });

      for (const m of managers) {
        await prisma.notification.create({
          data: {
            userId: m.id,
            title: `Payment Proof Submitted: ${invoice.invoiceNumber}`,
            message: `${sessionUser.name} submitted payment proof of ₹${payAmount.toLocaleString("en-IN")}. Ref: ${transactionReference || "N/A"}.`,
            type: "INFO",
            linkUrl: "/admin/invoices",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Payment proof submitted successfully. Your payment will be verified by our finance team shortly.",
        payment,
        invoice,
      });
    }
  } catch (error) {
    return safeErrorResponse(error, "Failed to record payment");
  }
}
