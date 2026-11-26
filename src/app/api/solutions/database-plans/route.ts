import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const [plans, estimatorRule] = await Promise.all([
      prisma.databaseStoragePlan.findMany({
        orderBy: { sizeGb: "asc" },
      }),
      prisma.storageEstimatorRule.findUnique({
        where: { id: "default-rule" },
      }),
    ]);

    return NextResponse.json({ success: true, plans, estimatorRule });
  } catch (error) {
    console.error("Fetch database plans error:", error);
    return NextResponse.json({ error: "Failed to fetch database plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const isAdminOrManager = sessionUser && (
    sessionUser.role === "ADMIN" || 
    sessionUser.effectiveRole === "ADMIN" || 
    sessionUser.role === "MANAGER" || 
    sessionUser.effectiveRole === "MANAGER"
  );
  if (!isAdminOrManager) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      sizeGb,
      label,
      monthlyPrice = 0,
      annualPrice = 0,
      storageType = "Managed PostgreSQL / NVMe SSD",
      recommendedBusinessSize,
      backupInfo = "Automated Daily Cloud Backups + Point-in-Time Recovery",
      orderIndex = 0,
    } = body;

    if (!sizeGb || !label) {
      return NextResponse.json({ error: "Size (GB) and Label are required" }, { status: 400 });
    }

    const plan = await prisma.databaseStoragePlan.create({
      data: {
        sizeGb: Number(sizeGb),
        label: label.trim(),
        monthlyPrice: Number(monthlyPrice) || 0,
        annualPrice: Number(annualPrice) || 0,
        storageType: storageType.trim(),
        recommendedBusinessSize: recommendedBusinessSize?.trim() || null,
        backupInfo: backupInfo.trim(),
        orderIndex: Number(orderIndex) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Create database plan error:", error);
    return NextResponse.json({ error: "Failed to create database plan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const isAdminOrManager = sessionUser && (
    sessionUser.role === "ADMIN" || 
    sessionUser.effectiveRole === "ADMIN" || 
    sessionUser.role === "MANAGER" || 
    sessionUser.effectiveRole === "MANAGER"
  );
  if (!isAdminOrManager) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, id, ...data } = body;

    // Updating Estimator Rule
    if (type === "ESTIMATOR_RULE") {
      const updatedRule = await prisma.storageEstimatorRule.upsert({
        where: { id: "default-rule" },
        update: data,
        create: {
          id: "default-rule",
          ...data,
        },
      });
      return NextResponse.json({ success: true, estimatorRule: updatedRule });
    }

    // Updating Storage Plan
    if (!id && data.sizeGb === undefined) {
      return NextResponse.json({ error: "Plan ID or Size is required" }, { status: 400 });
    }

    if (data.sizeGb !== undefined) data.sizeGb = Number(data.sizeGb);
    if (data.monthlyPrice !== undefined) data.monthlyPrice = Number(data.monthlyPrice);
    if (data.annualPrice !== undefined) data.annualPrice = Number(data.annualPrice);

    let target = null;
    if (id) {
      target = await prisma.databaseStoragePlan.findUnique({ where: { id } });
    }
    if (!target && data.sizeGb !== undefined) {
      target = await prisma.databaseStoragePlan.findUnique({ where: { sizeGb: data.sizeGb } });
    }
    if (!target) {
      return NextResponse.json({ error: "Storage plan not found" }, { status: 404 });
    }

    const updated = await prisma.databaseStoragePlan.update({
      where: { id: target.id },
      data,
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error) {
    console.error("Update database plan error:", error);
    return NextResponse.json({ error: "Failed to update database plan" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const isAdminOrManager = sessionUser && (
    sessionUser.role === "ADMIN" || 
    sessionUser.effectiveRole === "ADMIN" || 
    sessionUser.role === "MANAGER" || 
    sessionUser.effectiveRole === "MANAGER"
  );
  if (!isAdminOrManager) {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    await prisma.databaseStoragePlan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete database plan error:", error);
    return NextResponse.json({ error: "Failed to delete database plan" }, { status: 500 });
  }
}
