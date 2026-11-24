import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const all = searchParams.get("all") === "true";

    const sessionUser = await getSessionUser();
    const isAdmin = sessionUser?.role === "ADMIN";

    const where: any = {};
    if (!isAdmin && !all) {
      where.isActive = true;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }

    const apps = await prisma.app.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, apps });
  } catch (error: any) {
    console.error("GET /api/apps error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch apps" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, version, category, iconUrl, apkUrl, apkFilename, isActive } = body;

    if (!name || !apkUrl) {
      return NextResponse.json({ success: false, error: "App Name and APK URL are required." }, { status: 400 });
    }

    const newApp = await prisma.app.create({
      data: {
        name,
        description: description || null,
        version: version || "1.0",
        category: category || "General",
        iconUrl: iconUrl || null,
        apkUrl,
        apkFilename: apkFilename || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    return NextResponse.json({ success: true, app: newApp }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/apps error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create app" }, { status: 500 });
  }
}
