import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { syncSupabaseToPrisma } from "@/lib/dbSyncService";
import { safeErrorResponse, isSafeFileUrl } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    // Ensure Supabase cloud websites are synchronized
    syncSupabaseToPrisma().catch(() => {});
    const sessionUser = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get("public") === "true";

    if (publicOnly || !sessionUser) {
      const websites = await prisma.website.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ success: true, websites });
    }

    const where: any = {};
    if (sessionUser.effectiveRole === "CUSTOMER") {
      where.userId = sessionUser.id;
    } else if (sessionUser.effectiveRole === "MANAGER") {
      where.OR = [{ managerId: sessionUser.id }, { userId: sessionUser.id }];
    } // ADMIN gets all

    const websites = await prisma.website.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, websites });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to fetch websites");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { name, url, description, category, iconUrl, plan, expiryDate, userId, managerId, status, isActive } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, error: "Website name and URL are required" }, { status: 400 });
    }

    const cleanUrl = String(url).trim();
    if (!isSafeFileUrl(cleanUrl)) {
      return NextResponse.json({ success: false, error: "Invalid or unsafe website URL" }, { status: 400 });
    }

    const website = await prisma.website.create({
      data: {
        name: String(name).trim(),
        url: cleanUrl,
        description: description ? String(description).trim() : null,
        category: category ? String(category).trim() : "General",
        iconUrl: iconUrl ? String(iconUrl).trim() : null,
        plan: plan ? String(plan).trim() : "Standard Cloud NVMe",
        status: status ? String(status).trim() : "Active",
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        userId: userId || null,
        managerId: managerId || sessionUser.id,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    // Mirror to Supabase cloud table
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from("websites").insert({
          name: website.name,
          url: website.url,
          description: website.description,
          category: website.category,
          icon_url: website.iconUrl,
          plan: website.plan,
          status: website.status,
          user_id: website.userId,
          manager_id: website.managerId,
          is_active: website.isActive,
        });
      } catch (sErr) {
        console.warn("Supabase website sync warning:", sErr);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "CREATE_WEBSITE",
        entityType: "WEBSITE",
        entityId: website.id,
        details: `Registered website ${website.name} (${website.url}) by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, website }, { status: 201 });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to create website record");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, url, description, category, iconUrl, status, plan, expiryDate, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Website ID is required" }, { status: 400 });
    }

    const website = await prisma.website.findUnique({ where: { id } });
    if (!website) {
      return NextResponse.json({ success: false, error: "Website not found" }, { status: 404 });
    }

    if (sessionUser.effectiveRole === "MANAGER" && sessionUser.actualRole !== "ADMIN") {
      if (website.managerId !== sessionUser.id) {
        return NextResponse.json({ success: false, error: "Forbidden: Managers can only update websites they manage" }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = String(name).trim();
    if (url) {
      const cleanUrl = String(url).trim();
      if (!isSafeFileUrl(cleanUrl)) {
        return NextResponse.json({ success: false, error: "Invalid URL" }, { status: 400 });
      }
      updateData.url = cleanUrl;
    }
    if (description !== undefined) updateData.description = description ? String(description).trim() : null;
    if (category) updateData.category = String(category).trim();
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl ? String(iconUrl).trim() : null;
    if (status !== undefined) updateData.status = String(status).trim();
    if (plan !== undefined) updateData.plan = String(plan).trim();
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.website.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, website: updated });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to update website");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Website ID is required" }, { status: 400 });
    }

    const website = await prisma.website.findUnique({ where: { id } });
    if (!website) {
      return NextResponse.json({ success: false, error: "Website not found" }, { status: 404 });
    }

    if (sessionUser.effectiveRole === "MANAGER" && sessionUser.actualRole !== "ADMIN") {
      if (website.managerId !== sessionUser.id) {
        return NextResponse.json({ success: false, error: "Forbidden: Managers can only delete websites they manage" }, { status: 403 });
      }
    }

    await prisma.website.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "DELETE_WEBSITE",
        entityType: "WEBSITE",
        entityId: id,
        details: `Deleted website ${website.name} by ${sessionUser.name}`,
      },
    });

    return NextResponse.json({ success: true, message: "Website deleted successfully" });
  } catch (error: any) {
    return safeErrorResponse(error, "Failed to delete website");
  }
}
