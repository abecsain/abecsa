import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const whereClause: {
    status?: string;
    customerId?: string;
    assignedToId?: string;
  } = {};

  if (status) whereClause.status = status;

  if (sessionUser.effectiveRole === "CUSTOMER") {
    if (!sessionUser.customerProfile) {
      return NextResponse.json({ tickets: [] });
    }
    whereClause.customerId = sessionUser.customerProfile.id;
  } else if (sessionUser.effectiveRole === "ENGINEER") {
    whereClause.assignedToId = sessionUser.id;
  }

  const tickets = await prisma.supportTicket.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        include: { user: { select: { name: true, email: true } } },
      },
      project: { select: { id: true, name: true, projectId: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: {
        where:
          sessionUser.effectiveRole === "CUSTOMER"
            ? { isInternal: false }
            : undefined,
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { subject, description, category, priority, projectId, customerId } = data;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    // Determine target customer
    let targetCustomerId = customerId;
    if (sessionUser.effectiveRole === "CUSTOMER") {
      targetCustomerId = sessionUser.customerProfile?.id;
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: "Customer profile not found" }, { status: 400 });
    }

    const count = await prisma.supportTicket.count();
    const ticketNumber = `TIK-2026-${String(count + 101).padStart(3, "0")}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerId: targetCustomerId,
        projectId,
        subject,
        description,
        category: category || "GENERAL",
        priority: priority || "MEDIUM",
        status: "OPEN",
        messages: {
          create: {
            senderId: sessionUser.id,
            message: description,
            isInternal: false,
          },
        },
      },
      include: {
        customer: { include: { user: true } },
        messages: true,
      },
    });

    // Notify support managers
    const managers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });

    for (const m of managers) {
      await prisma.notification.create({
        data: {
          userId: m.id,
          title: `New Support Ticket ${ticketNumber}`,
          message: `${ticket.customer.companyName}: ${subject}`,
          type: "WARNING",
          linkUrl: "/manager/support",
        },
      });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("Create ticket error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

// Add message or update status / assignment
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { ticketId, message, isInternal = false, status, assignedToId } = data;

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { customer: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Customer can only reply to their own tickets and cannot make internal notes
    if (sessionUser.effectiveRole === "CUSTOMER") {
      if (ticket.customerId !== sessionUser.customerProfile?.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Add message if provided
    let newMessage = null;
    if (message) {
      newMessage = await prisma.ticketMessage.create({
        data: {
          ticketId,
          senderId: sessionUser.id,
          message,
          isInternal: sessionUser.effectiveRole === "CUSTOMER" ? false : Boolean(isInternal),
        },
        include: {
          sender: { select: { id: true, name: true, role: true } },
        },
      });
    }

    // Update status or assignment if provided
    const updateData: {
      status?: string;
      assignedToId?: string;
    } = {};

    if (status) updateData.status = status;
    if (assignedToId && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      updateData.assignedToId = assignedToId;
      if (!status) updateData.status = "ASSIGNED";
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: newMessage,
    });
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
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
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    await prisma.ticketMessage.deleteMany({ where: { ticketId: id } });
    await prisma.supportTicket.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Delete ticket error:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
