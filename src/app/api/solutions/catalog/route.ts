import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ensureSolutionsSeed } from "@/lib/solutionsSeed";

export async function GET(req: NextRequest) {
  try {
    const prodCount = await prisma.catalogProduct.count();
    if (prodCount === 0) {
      await ensureSolutionsSeed();
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const productWhere: any = { isActive: true };
    if (category && category !== "ALL") {
      productWhere.category = category;
    }
    if (search) {
      productWhere.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [products, packages, databasePlans, estimatorRule] = await Promise.all([
      prisma.catalogProduct.findMany({
        where: productWhere,
        orderBy: [{ isFeatured: "desc" }, { orderIndex: "asc" }],
      }),
      prisma.catalogPackage.findMany({
        where: { isActive: true },
        orderBy: [{ isFeatured: "desc" }, { orderIndex: "asc" }],
      }),
      prisma.databaseStoragePlan.findMany({
        where: { isActive: true },
        orderBy: { sizeGb: "asc" },
      }),
      prisma.storageEstimatorRule.findUnique({
        where: { id: "default-rule" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      packages,
      databasePlans,
      estimatorRule,
    });
  } catch (error) {
    console.error("Fetch catalog error:", error);
    return NextResponse.json({ error: "Failed to fetch catalog" }, { status: 500 });
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
      code,
      name,
      category,
      shortDescription,
      fullDescription,
      icon,
      imageUrl,
      basePrice = 0,
      recurringPrice = 0,
      recurringInterval = "MONTHLY",
      isPriceOnRequest = false,
      keyFeatures = [],
      configurableAddons = [],
      suitableFor,
      recommendedDatabaseTier,
      deploymentOptions,
      pricingModel = "ONE_TIME",
      sharedModuleIds = [],
      compatibleProductIds = [],
      isFeatured = false,
      orderIndex = 0,
    } = body;

    if (!code || !name || !category || !shortDescription) {
      return NextResponse.json(
        { error: "Product Code, Name, Category, and Short Description are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "-");

    const existing = await prisma.catalogProduct.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json({ error: "A product with this code already exists" }, { status: 409 });
    }

    const product = await prisma.catalogProduct.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        category,
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription?.trim() || null,
        icon: icon?.trim() || "Layers",
        imageUrl: imageUrl?.trim() || null,
        basePrice: Number(basePrice) || 0,
        recurringPrice: Number(recurringPrice) || 0,
        recurringInterval: recurringInterval || "MONTHLY",
        isPriceOnRequest: Boolean(isPriceOnRequest),
        keyFeatures: typeof keyFeatures === "string" ? keyFeatures : JSON.stringify(keyFeatures),
        configurableAddons: typeof configurableAddons === "string" ? configurableAddons : JSON.stringify(configurableAddons),
        suitableFor: suitableFor?.trim() || null,
        recommendedDatabaseTier: recommendedDatabaseTier || "5 GB",
        deploymentOptions: deploymentOptions || "Cloud SaaS",
        pricingModel: pricingModel || "ONE_TIME",
        sharedModuleIds: typeof sharedModuleIds === "string" ? sharedModuleIds : JSON.stringify(sharedModuleIds),
        compatibleProductIds: typeof compatibleProductIds === "string" ? compatibleProductIds : JSON.stringify(compatibleProductIds),
        isFeatured: Boolean(isFeatured),
        orderIndex: Number(orderIndex) || 0,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Create catalog product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
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
    const { id, ...data } = body;

    if (!id && !data.code) {
      return NextResponse.json({ error: "Product ID or Code is required" }, { status: 400 });
    }

    if (data.keyFeatures && typeof data.keyFeatures !== "string") {
      data.keyFeatures = JSON.stringify(data.keyFeatures);
    }
    if (data.configurableAddons && typeof data.configurableAddons !== "string") {
      data.configurableAddons = JSON.stringify(data.configurableAddons);
    }
    if (data.sharedModuleIds && typeof data.sharedModuleIds !== "string") {
      data.sharedModuleIds = JSON.stringify(data.sharedModuleIds);
    }
    if (data.compatibleProductIds && typeof data.compatibleProductIds !== "string") {
      data.compatibleProductIds = JSON.stringify(data.compatibleProductIds);
    }

    if (data.basePrice !== undefined) data.basePrice = Number(data.basePrice) || 0;
    if (data.recurringPrice !== undefined) data.recurringPrice = Number(data.recurringPrice) || 0;
    if (data.orderIndex !== undefined) data.orderIndex = Number(data.orderIndex) || 0;
    if (data.isPriceOnRequest !== undefined) data.isPriceOnRequest = Boolean(data.isPriceOnRequest);
    if (data.isFeatured !== undefined) data.isFeatured = Boolean(data.isFeatured);
    if (data.code) {
      data.code = String(data.code).trim().toUpperCase().replace(/\s+/g, "-");
    }

    let target = null;
    if (id) {
      target = await prisma.catalogProduct.findUnique({ where: { id } });
    }
    if (!target && data.code) {
      target = await prisma.catalogProduct.findUnique({ where: { code: data.code } });
    }
    if (!target) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.catalogProduct.update({
      where: { id: target.id },
      data,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Update catalog product error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
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
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.catalogProduct.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
