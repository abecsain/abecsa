import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const packages = await prisma.catalogPackage.findMany({
      orderBy: [{ isFeatured: "desc" }, { orderIndex: "asc" }],
    });
    return NextResponse.json({ success: true, packages });
  } catch (error) {
    console.error("Fetch packages error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      slug,
      name,
      category = "SOFTWARE",
      tagline,
      description,
      badge,
      basePrice = 0,
      recurringPrice = 0,
      recurringInterval = "ANNUALLY",
      discountAmount = 0,
      includedProductCodes = [],
      includedFeatures = [],
      databaseTier = "5 GB",
      userLimit,
      productLimit,
      supportTier,
      isFeatured = false,
      orderIndex = 0,
    } = body;

    if (!slug || !name) {
      return NextResponse.json({ error: "Package slug and name are required" }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");

    const existing = await prisma.catalogPackage.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return NextResponse.json({ error: "A package with this slug already exists" }, { status: 409 });
    }

    const pkg = await prisma.catalogPackage.create({
      data: {
        slug: cleanSlug,
        name: name.trim(),
        category,
        tagline: tagline?.trim() || null,
        description: description?.trim() || null,
        badge: badge?.trim() || null,
        basePrice: Number(basePrice) || 0,
        recurringPrice: Number(recurringPrice) || 0,
        recurringInterval: recurringInterval || "ANNUALLY",
        discountAmount: Number(discountAmount) || 0,
        includedProductCodes: typeof includedProductCodes === "string" ? includedProductCodes : JSON.stringify(includedProductCodes),
        includedFeatures: typeof includedFeatures === "string" ? includedFeatures : JSON.stringify(includedFeatures),
        databaseTier: databaseTier || "5 GB",
        userLimit: userLimit?.trim() || null,
        productLimit: productLimit?.trim() || null,
        supportTier: supportTier?.trim() || null,
        isFeatured: Boolean(isFeatured),
        orderIndex: Number(orderIndex) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    console.error("Create package error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    if (data.includedProductCodes && typeof data.includedProductCodes !== "string") {
      data.includedProductCodes = JSON.stringify(data.includedProductCodes);
    }
    if (data.includedFeatures && typeof data.includedFeatures !== "string") {
      data.includedFeatures = JSON.stringify(data.includedFeatures);
    }

    if (data.basePrice !== undefined) data.basePrice = Number(data.basePrice);
    if (data.recurringPrice !== undefined) data.recurringPrice = Number(data.recurringPrice);
    if (data.discountAmount !== undefined) data.discountAmount = Number(data.discountAmount);
    if (data.orderIndex !== undefined) data.orderIndex = Number(data.orderIndex);

    const updated = await prisma.catalogPackage.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, package: updated });
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    await prisma.catalogPackage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete package error:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
