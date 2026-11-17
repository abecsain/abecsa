import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const [
      customersCount,
      leadsCount,
      projects,
      invoices,
      payments,
      employeesCount,
      recentAuditLogs,
      recentTickets,
    ] = await Promise.all([
      prisma.customerProfile.count(),
      prisma.crmLead.count({ where: { status: { not: "CONVERTED" } } }),
      prisma.project.findMany({
        select: {
          id: true,
          status: true,
          priority: true,
          progress: true,
          budget: true,
          deliveryDate: true,
          serviceCategory: true,
        },
      }),
      prisma.invoice.findMany({
        select: {
          id: true,
          totalAmount: true,
          amountPaid: true,
          balanceAmount: true,
          status: true,
          issueDate: true,
        },
      }),
      prisma.payment.findMany({
        where: { status: "VERIFIED" },
        orderBy: { paymentDate: "desc" },
        take: 10,
        include: {
          customer: { select: { companyName: true } },
          invoice: { select: { invoiceNumber: true } },
        },
      }),
      prisma.user.count({ where: { role: { in: ["ENGINEER", "MANAGER"] }, status: "ACTIVE" } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true, role: true } } },
      }),
      prisma.supportTicket.findMany({
        where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { companyName: true } } },
      }),
    ]);

    // Financial Metrics
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
    const pendingPayments = invoices.reduce((acc, inv) => acc + inv.balanceAmount, 0);
    const totalInvoiced = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    // Project Metrics
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) =>
      ["IN_PROGRESS", "UNDER_REVIEW", "TESTING", "APPROVED"].includes(p.status)
    ).length;
    const completedProjects = projects.filter((p) => p.status === "COMPLETED").length;
    const overdueProjects = projects.filter(
      (p) => p.deliveryDate && new Date(p.deliveryDate) < new Date() && p.status !== "COMPLETED"
    ).length;

    // Status distributions
    const statusDistribution = projects.reduce((acc: Record<string, number>, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    // Service category breakdown
    const serviceDistribution = projects.reduce((acc: Record<string, number>, p) => {
      acc[p.serviceCategory] = (acc[p.serviceCategory] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      metrics: {
        totalRevenue,
        pendingPayments,
        totalInvoiced,
        customersCount,
        leadsCount,
        totalProjects,
        activeProjects,
        completedProjects,
        overdueProjects,
        employeesCount,
      },
      statusDistribution,
      serviceDistribution,
      recentPayments: payments,
      recentAuditLogs,
      recentTickets,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Failed to compute analytics" }, { status: 500 });
  }
}
