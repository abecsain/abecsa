import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

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
    console.error("GET /api/exams error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
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

    const exam = await prisma.exam.create({
      data: {
        name: name.trim(),
        googleFormUrl: googleFormUrl.trim(),
        startTime: new Date(startTime),
        durationMinutes: Number(durationMinutes),
        createdBy: sessionUser.id,
      },
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/exams error:", error);
    return NextResponse.json({ success: false, error: "Failed to create exam" }, { status: 500 });
  }
}
