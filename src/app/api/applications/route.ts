import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { applyRateLimit, safeErrorResponse } from "@/lib/security";
import { isValidEmail } from "@/lib/validation";

// Public POST for course, internship or student ambassador application
export async function POST(req: NextRequest) {
  // Rate limit: max 6 application submissions per minute per IP
  const rateLimitRes = applyRateLimit(req, "course_application", 6, 60 * 1000);
  if (rateLimitRes) return rateLimitRes;

  try {
    const body = await req.json();
    const { name, email, phone, courseName, branch, message, type } = body;

    if (!name || !email || !phone || !courseName) {
      return NextResponse.json(
        { success: false, error: "Name, email, phone, and program name are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address format." },
        { status: 400 }
      );
    }

    const application = await prisma.courseApplication.create({
      data: {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone).trim(),
        courseName: String(courseName).trim(),
        branch: branch ? String(branch).trim() : null,
        message: message ? String(message).trim() : null,
        type: type ? String(type).trim() : "Course",
        status: "Pending",
      },
    });

    // Mirror to Supabase cloud table
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from("course_applications").insert({
          name: application.name,
          email: application.email,
          phone: application.phone,
          course_name: application.courseName,
          branch: application.branch,
          message: application.message,
          type: application.type,
          status: application.status,
        });
      } catch (sErr) {
        console.warn("Supabase course_application sync warning:", sErr);
      }
    }

    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to submit application");
  }
}

// GET applications (Admins & Managers)
export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
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
    return safeErrorResponse(error, "Failed to fetch applications");
  }
}

// PATCH update status (Admins & Managers)
export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "ID and status are required" }, { status: 400 });
    }

    const numId = Number(id);
    if (isNaN(numId)) {
      return NextResponse.json({ success: false, error: "Invalid application ID format" }, { status: 400 });
    }

    const updated = await prisma.courseApplication.update({
      where: { id: numId },
      data: { status: String(status) },
    });

    return NextResponse.json({ success: true, application: updated });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to update application");
  }
}

// DELETE application (Admins only)
export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized access: Admin role required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ success: false, error: "Valid Application ID is required" }, { status: 400 });
    }

    const existing = await prisma.courseApplication.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Application not found" }, { status: 404 });
    }

    await prisma.courseApplication.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Application deleted successfully" });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to delete application");
  }
}
