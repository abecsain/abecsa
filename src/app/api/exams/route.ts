import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { safeErrorResponse, isSafeFileUrl } from "@/lib/security";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return NextResponse.json({ success: true, exams });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to fetch exams");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { name, googleFormUrl, startTime, durationMinutes } = body;

    if (!name || !googleFormUrl || !startTime || !durationMinutes) {
      return NextResponse.json(
        { success: false, error: "Name, Google Form URL, Start Time, and Duration are required." },
        { status: 400 }
      );
    }

    const cleanUrl = String(googleFormUrl).trim();
    if (!isSafeFileUrl(cleanUrl)) {
      return NextResponse.json({ success: false, error: "Invalid form URL" }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        name: String(name).trim(),
        googleFormUrl: cleanUrl,
        startTime: new Date(startTime),
        durationMinutes: Number(durationMinutes),
        createdBy: sessionUser.id,
      },
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to create exam");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, googleFormUrl, startTime, durationMinutes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Exam ID is required" }, { status: 400 });
    }

    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (googleFormUrl) {
      const cleanUrl = String(googleFormUrl).trim();
      if (!isSafeFileUrl(cleanUrl)) {
        return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
      }
      updateData.googleFormUrl = cleanUrl;
    }
    if (startTime) updateData.startTime = new Date(startTime);
    if (durationMinutes !== undefined) updateData.durationMinutes = Number(durationMinutes);

    const updated = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, exam: updated });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to update exam");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Exam ID is required" }, { status: 400 });
    }

    const existing = await prisma.exam.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Exam not found" }, { status: 404 });
    }

    await prisma.examAttempt.deleteMany({ where: { examId: id } });
    await prisma.exam.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Exam deleted successfully" });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to delete exam");
  }
}
