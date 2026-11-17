import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "LEAVES" | "ATTENDANCE" | "WORKLOGS"

  if (type === "LEAVES") {
    const whereClause: { userId?: string } = {};
    if (sessionUser.effectiveRole === "ENGINEER") {
      whereClause.userId = sessionUser.id;
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, jobTitle: true, department: true } },
        approvedBy: { select: { name: true } },
      },
    });
    return NextResponse.json({ leaves });
  }

  if (type === "ATTENDANCE") {
    const whereClause: { userId?: string } = {};
    if (sessionUser.effectiveRole === "ENGINEER") {
      whereClause.userId = sessionUser.id;
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: 30,
      include: {
        user: { select: { name: true, jobTitle: true } },
      },
    });
    return NextResponse.json({ attendance });
  }

  if (type === "WORKLOGS") {
    const whereClause: { userId?: string } = {};
    if (sessionUser.effectiveRole === "ENGINEER") {
      whereClause.userId = sessionUser.id;
    }

    const workLogs = await prisma.workLog.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        user: { select: { name: true, role: true } },
        task: { select: { title: true } },
        project: { select: { name: true, projectId: true } },
      },
    });
    return NextResponse.json({ workLogs });
  }

  // Combined overview for HR
  const [employees, leaves, attendance, workLogs] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["ENGINEER", "MANAGER"] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        jobTitle: true,
        status: true,
        phone: true,
        hourlyRate: sessionUser.effectiveRole === "ADMIN",
      },
    }),
    prisma.leaveRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.attendance.findMany({
      orderBy: { date: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
    prisma.workLog.findMany({
      orderBy: { date: "desc" },
      take: 20,
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({ employees, leaves, attendance, workLogs });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { action } = data;

    // A. Submit Leave Request (Engineers & Staff)
    if (action === "SUBMIT_LEAVE") {
      const { leaveType, startDate, endDate, totalDays, reason } = data;
      if (!startDate || !endDate || !reason) {
        return NextResponse.json({ error: "Dates and reason required" }, { status: 400 });
      }

      const leave = await prisma.leaveRequest.create({
        data: {
          userId: sessionUser.id,
          leaveType: leaveType || "CASUAL",
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          totalDays: Number(totalDays || 1),
          reason,
          status: "PENDING",
        },
      });

      return NextResponse.json({ success: true, leave });
    }

    // B. Approve/Reject Leave (Admin & Manager)
    if (action === "DECIDE_LEAVE") {
      if (!["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const { leaveId, decision, reviewNote } = data; // decision: "APPROVED" | "REJECTED"
      const updated = await prisma.leaveRequest.update({
        where: { id: leaveId },
        data: {
          status: decision,
          approvedById: sessionUser.id,
          reviewNote,
        },
      });

      return NextResponse.json({ success: true, leave: updated });
    }

    // C. Mark Attendance Check-In / Check-Out
    if (action === "LOG_ATTENDANCE") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existing = await prisma.attendance.findFirst({
        where: {
          userId: sessionUser.id,
          date: { gte: today },
        },
      });

      if (!existing) {
        const checkIn = await prisma.attendance.create({
          data: {
            userId: sessionUser.id,
            status: "PRESENT",
            checkIn: new Date(),
          },
        });
        return NextResponse.json({ success: true, message: "Checked in successfully!", attendance: checkIn });
      } else {
        const checkOut = await prisma.attendance.update({
          where: { id: existing.id },
          data: { checkOut: new Date() },
        });
        return NextResponse.json({ success: true, message: "Checked out successfully!", attendance: checkOut });
      }
    }

    // D. Log Work Hours (Engineers)
    if (action === "LOG_WORK") {
      const { taskId, projectId, hoursSpent, description, deliverablesUrl } = data;
      if (!description || !hoursSpent) {
        return NextResponse.json({ error: "Description and hours are required" }, { status: 400 });
      }

      const log = await prisma.workLog.create({
        data: {
          userId: sessionUser.id,
          taskId,
          projectId,
          hoursSpent: Number(hoursSpent),
          description,
          deliverablesUrl,
        },
      });

      // Update task actualHours if taskId given
      if (taskId) {
        await prisma.task.update({
          where: { id: taskId },
          data: { actualHours: { increment: Number(hoursSpent) } },
        });
      }

      return NextResponse.json({ success: true, log });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("HR action error:", error);
    return NextResponse.json({ error: "Failed to process HR action" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { type, id, status, reviewNote, reason, startDate, endDate } = data;

    if (!id) {
      return NextResponse.json({ error: "Record ID is required" }, { status: 400 });
    }

    if (type === "LEAVE" || (!type && status)) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (reviewNote !== undefined) updateData.reviewNote = reviewNote;
      if (reason) updateData.reason = reason;
      if (startDate) updateData.startDate = new Date(startDate);
      if (endDate) updateData.endDate = new Date(endDate);
      updateData.approvedById = sessionUser.id;

      const updated = await prisma.leaveRequest.update({
        where: { id },
        data: updateData,
        include: { user: { select: { name: true } } },
      });
      return NextResponse.json({ success: true, record: updated });
    }

    if (type === "ATTENDANCE") {
      const updateData: any = {};
      if (status) updateData.status = status;
      const updated = await prisma.attendance.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json({ success: true, record: updated });
    }

    return NextResponse.json({ error: "Invalid record type" }, { status: 400 });
  } catch (error) {
    console.error("HR PATCH error:", error);
    return NextResponse.json({ error: "Failed to update HR record" }, { status: 500 });
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
    const type = searchParams.get("type") || "LEAVE"; // "LEAVE" | "ATTENDANCE" | "WORKLOG"

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    if (type === "LEAVE") {
      await prisma.leaveRequest.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Leave request deleted" });
    }

    if (type === "ATTENDANCE") {
      await prisma.attendance.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Attendance record deleted" });
    }

    if (type === "WORKLOG") {
      await prisma.workLog.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Work log deleted" });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("HR DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete HR record" }, { status: 500 });
  }
}
