import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, role, title, message, type = "INFO", linkUrl } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    if (userId) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          linkUrl: linkUrl || null,
        },
      });
      return NextResponse.json({ success: true, count: 1, notification });
    }

    // Role broadcast or All broadcast
    const userFilter: any = {};
    if (role && role !== "ALL") {
      userFilter.role = role;
    }

    const targetUsers = await prisma.user.findMany({
      where: userFilter,
      select: { id: true },
    });

    if (targetUsers.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No recipients found" });
    }

    await prisma.notification.createMany({
      data: targetUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type,
        linkUrl: linkUrl || null,
      })),
    });

    return NextResponse.json({ success: true, count: targetUsers.length });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (id) {
    await prisma.notification.update({
      where: { id, userId: sessionUser.id },
      data: { isRead: true },
    });
  } else {
    // Mark all as read
    await prisma.notification.updateMany({
      where: { userId: sessionUser.id },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
