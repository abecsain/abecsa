import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // Admin can query any user's assets, customers only query their own
    let userId = sessionUser.id;
    if (sessionUser.role === "ADMIN" && targetUserId) {
      userId = targetUserId;
    }

    const assets = await prisma.userAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error("GET /api/vault/assets error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user assets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, type, value, targetUserId } = body;

    if (!name || !type || !value) {
      return NextResponse.json({ success: false, error: "Name, type, and value are required." }, { status: 400 });
    }

    const validTypes = ["License", "Certificate", "Image", "Key", "Document"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, error: `Invalid type. Allowed: ${validTypes.join(", ")}` }, { status: 400 });
    }

    let ownerId = sessionUser.id;
    if (sessionUser.role === "ADMIN" && targetUserId) {
      ownerId = targetUserId;
    }

    const asset = await prisma.userAsset.create({
      data: {
        userId: ownerId,
        name: name.trim(),
        type,
        value: value.trim(),
      },
    });

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/vault/assets error:", error);
    return NextResponse.json({ success: false, error: "Failed to create asset" }, { status: 500 });
  }
}
