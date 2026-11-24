import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// Public POST for course, internship or student ambassador application
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, courseName, branch, message, type } = body;

    if (!name || !email || !phone || !courseName) {
      return NextResponse.json(
        { success: false, error: "Name, email, phone, and program name are required." },
        { status: 400 }
      );
    }

    const application = await prisma.courseApplication.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        courseName: courseName.trim(),
        branch: branch ? branch.trim() : null,
        message: message ? message.trim() : null,
        type: type || "Course",
        status: "Pending",
      },
    });

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/applications error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit application" }, { status: 500 });
  }
}

// GET applications (Admins & Managers)
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (type && type !== "ALL") where.type = type;

    const applications = await prisma.courseApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch applications" }, { status: 500 });
  }
}

// PATCH update status (Admins & Managers)
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID and status are required" }, { status: 400 });
    }

    const updated = await prisma.courseApplication.update({
      where: { id: Number(id) },
      data: { status },
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    console.error("PATCH /api/applications error:", error);
    return NextResponse.json({ success: false, error: "Failed to update application" }, { status: 500 });
  }
}
