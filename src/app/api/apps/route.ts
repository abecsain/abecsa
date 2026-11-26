import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { syncSupabaseToPrisma } from "@/lib/dbSyncService";
import { safeErrorResponse, isSafeFileUrl } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    syncSupabaseToPrisma().catch(() => {});
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const all = searchParams.get("all") === "true";

    const sessionUser = await getSessionUser();
    const isAdmin = sessionUser?.effectiveRole === "ADMIN";

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
    return safeErrorResponse(error, "Failed to fetch apps");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, version, category, iconUrl, apkUrl, apkFilename, isActive } = body;

    if (!name || !apkUrl) {
      return NextResponse.json({ success: false, error: "App Name and APK URL are required." }, { status: 400 });
    }

    const cleanApkUrl = String(apkUrl).trim();
    if (!isSafeFileUrl(cleanApkUrl)) {
      return NextResponse.json({ success: false, error: "Invalid or unsafe APK file URL" }, { status: 400 });
    }

    const newApp = await prisma.app.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        version: version ? String(version).trim() : "1.0",
        category: category ? String(category).trim() : "General",
        iconUrl: iconUrl ? String(iconUrl).trim() : null,
        apkUrl: cleanApkUrl,
        apkFilename: apkFilename ? String(apkFilename).trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    // Mirror to Supabase cloud table
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from("apps").upsert({
          id: newApp.id,
          name: newApp.name,
          description: newApp.description,
          version: newApp.version,
          category: newApp.category,
          icon_url: newApp.iconUrl,
          apk_url: newApp.apkUrl,
          apk_filename: newApp.apkFilename,
          download_count: 0,
          is_active: newApp.isActive,
        });
      } catch (sErr) {
        console.warn("Supabase app sync warning:", sErr);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "CREATE_APP",
        entityType: "APP",
        entityId: newApp.id,
        details: `Created app ${newApp.name} (v${newApp.version}) by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, app: newApp }, { status: 201 });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to create app");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, version, category, iconUrl, apkUrl, apkFilename, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "App ID is required" }, { status: 400 });
    }

    const existing = await prisma.app.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "App not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (version) updateData.version = String(version).trim();
    if (category) updateData.category = String(category).trim();
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl ? String(iconUrl).trim() : null;
    if (apkUrl) {
      const cleanUrl = String(apkUrl).trim();
      if (!isSafeFileUrl(cleanUrl)) {
        return NextResponse.json({ success: false, error: "Invalid APK URL" }, { status: 400 });
      }
      updateData.apkUrl = cleanUrl;
    }
    if (apkFilename !== undefined) updateData.apkFilename = apkFilename ? String(apkFilename).trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.app.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, app: updated });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to update app");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "App ID is required" }, { status: 400 });
    }

    const app = await prisma.app.findUnique({ where: { id } });
    if (!app) {
      return NextResponse.json({ success: false, error: "App not found" }, { status: 404 });
    }

    await prisma.app.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "DELETE_APP",
        entityType: "APP",
        entityId: id,
        details: `Deleted app ${app.name} by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "App deleted successfully" });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to delete app");
  }
}
