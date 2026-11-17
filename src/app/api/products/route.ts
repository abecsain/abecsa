import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// GET all active software products (or all for admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const includeInactive = searchParams.get("all") === "true";

    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }

    const products = await prisma.softwareProduct.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST create software product (Admin only)
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      code,
      name,
      category,
      description,
      price,
      billingType = "ONE_TIME",
      badge,
      features,
      demoUrl,
      techStack,
      whatsappPhone = "+91 98765 43210",
    } = data;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Software package name is required" }, { status: 400 });
    }

    const count = await prisma.softwareProduct.count();
    const productCode = (code && code.trim()) || `SW-${String(count + 101).padStart(3, "0")}`;
    const parsedPrice = parseFloat(String(price || 0)) || 0;

    const product = await prisma.softwareProduct.create({
      data: {
        code: productCode,
        name: name.trim(),
        category: category || "Enterprise Software",
        description: description || "Enterprise grade software package with complete deployment and SLA support.",
        price: parsedPrice,
        billingType: billingType || "ONE_TIME",
        badge: badge || "New Release",
        features: Array.isArray(features) ? JSON.stringify(features) : (features || "[]"),
        demoUrl: demoUrl || "/demos",
        techStack: techStack || "Next.js, TypeScript, PostgreSQL",
        whatsappPhone: whatsappPhone || "+91 98765 43210",
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "CREATE_PRODUCT",
        entityType: "SOFTWARE_PRODUCT",
        entityId: product.id,
        details: `Created software store package: ${product.name} (${product.code})`,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}

// PATCH update software product
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const { id, name, category, description, price, badge, features, demoUrl, techStack, whatsappPhone, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(String(price));
    if (badge !== undefined) updateData.badge = badge;
    if (features !== undefined) {
      updateData.features = Array.isArray(features) ? JSON.stringify(features) : features;
    }
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl;
    if (techStack !== undefined) updateData.techStack = techStack;
    if (whatsappPhone !== undefined) updateData.whatsappPhone = whatsappPhone;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.softwareProduct.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}

// DELETE software product
export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.softwareProduct.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
  }
}
