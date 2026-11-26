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
  } = {};

  if (sessionUser.effectiveRole === "CUSTOMER") {
    if (!sessionUser.customerProfile) {
      return NextResponse.json({ notices: [] });
    }
    whereClause.customerId = sessionUser.customerProfile.id;
  } else if (customerId) {
    whereClause.customerId = customerId;
  }

  const notices = await prisma.noticeMessage.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, role: true } },
      customer: { select: { id: true, companyName: true } },
    },
  });

  return NextResponse.json({ notices });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { customerId, title, message, priority, actionUrl, actionLabel } = data;

    if (!customerId || !title || !message) {
      return NextResponse.json(
        { error: "Target customer, title, and message are required" },
        { status: 400 }
      );
    }

    const notice = await prisma.noticeMessage.create({
      data: {
        customerId,
        senderId: sessionUser.id,
        title,
        message,
        priority: priority || "NORMAL",
        actionUrl,
        actionLabel,
        isRead: false,
      },
      include: {
        customer: { include: { user: true } },
      },
    });

    // Notify customer
    if (notice.customer?.userId) {
      await prisma.notification.create({
        data: {
          userId: notice.customer.userId,
          title: `Important Update from ${sessionUser.name}`,
          message: title,
          type: priority === "URGENT" ? "ALERT" : "INFO",
          linkUrl: "/customer/notices",
        },
      });
    }

    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error("Post notice error:", error);
    return NextResponse.json({ error: "Failed to post notice message" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { id, title, message, priority, actionUrl, actionLabel, isRead } = data;
    if (!id) return NextResponse.json({ error: "Notice ID required" }, { status: 400 });

    const existingNotice = await prisma.noticeMessage.findUnique({
      where: { id },
    });

    if (!existingNotice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    // IDOR protection: Customer can only mark their own notices as read
    if (sessionUser.effectiveRole === "CUSTOMER") {
      if (!sessionUser.customerProfile || existingNotice.customerId !== sessionUser.customerProfile.id) {
        return NextResponse.json({ error: "Forbidden: You cannot modify notices belonging to other clients" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (isRead !== undefined) {
      updateData.isRead = Boolean(isRead);
      if (isRead) updateData.readAt = new Date();
    }
    if (title && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.title = title.trim();
    if (message && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.message = message.trim();
    if (priority && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.priority = priority;
    if (actionUrl !== undefined && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.actionUrl = actionUrl;
    if (actionLabel !== undefined && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) updateData.actionLabel = actionLabel;

    const notice = await prisma.noticeMessage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, notice });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notice" }, { status: 500 });
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
      return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
    }

    const notice = await prisma.noticeMessage.findUnique({ where: { id } });
    if (!notice) {
      return NextResponse.json({ error: "Notice not found" }, { status: 404 });
    }

    await prisma.noticeMessage.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Notice deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete notice" }, { status: 500 });
  }
}
