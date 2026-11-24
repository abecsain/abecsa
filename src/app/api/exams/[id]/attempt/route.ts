import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Please log in to start or submit an exam" }, { status: 401 });
    }

    const { id: examId } = await params;
    const body = await req.json();
    const { action, violationReason } = body; // action: 'start' | 'flag' | 'complete'

    if (action === "start") {
      const attempt = await prisma.examAttempt.upsert({
        where: {
          userId_examId: {
            userId: sessionUser.id,
            examId,
          },
        },
        create: {
          userId: sessionUser.id,
          examId,
          status: "started",
          startedAt: new Date(),
        },
        update: {},
      });
      return NextResponse.json({ success: true, attempt });
    }

    if (action === "flag") {
      const attempt = await prisma.examAttempt.update({
        where: {
          userId_examId: {
            userId: sessionUser.id,
            examId,
          },
        },
        data: {
          status: "flagged",
          violationReason: violationReason || "Tab switch or screen unfocus detected",
        },
      });
      return NextResponse.json({ success: true, attempt });
    }

    if (action === "complete") {
      const attempt = await prisma.examAttempt.update({
        where: {
          userId_examId: {
            userId: sessionUser.id,
            examId,
          },
        },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, attempt });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/exams/[id]/attempt error:", error);
    return NextResponse.json({ success: false, error: "Failed to record exam attempt" }, { status: 500 });
  }
}
