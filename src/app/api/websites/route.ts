import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
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
    if (sessionUser.role === "CUSTOMER") {
      where.userId = sessionUser.id;
    } else if (sessionUser.role === "MANAGER") {
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
    console.error("GET /api/websites error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch websites" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { name, url, description, category, iconUrl, plan, expiryDate, userId, managerId, status, isActive } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, error: "Website name and URL are required" }, { status: 400 });
    }

    const website = await prisma.website.create({
      data: {
        name: name.trim(),
        url: url.trim(),
        description: description || null,
        category: category || "General",
        iconUrl: iconUrl || null,
        plan: plan || "Standard Cloud NVMe",
        status: status || "Active",
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

    return NextResponse.json({ success: true, website }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/websites error:", error);
    return NextResponse.json({ success: false, error: "Failed to create website record" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, plan, expiryDate, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Website ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (plan !== undefined) updateData.plan = plan;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.website.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, website: updated });
  } catch (error: any) {
    console.error("PATCH /api/websites error:", error);
    return NextResponse.json({ success: false, error: "Failed to update website" }, { status: 500 });
  }
}
