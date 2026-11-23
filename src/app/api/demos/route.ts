import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { ensureSolutionsSeed } from "@/lib/solutionsSeed";

export async function GET() {
  try {
    await ensureSolutionsSeed();

    const demos = await prisma.interactiveDemo.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: "asc" },
    });

    return NextResponse.json({ success: true, demos });
  } catch (error) {
    console.error("Fetch demos error:", error);
    return NextResponse.json({ error: "Failed to fetch demos" }, { status: 500 });
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
      title,
      category,
      tagline,
      description,
      techStack,
      keyFeatures,
      previewUrl,
      imageUrl,
      metrics,
      orderIndex = 0,
    } = body;

    if (!title || !description || !previewUrl) {
      return NextResponse.json(
        { error: "Title, description, and preview live URL are required" },
        { status: 400 }
      );
    }

    const demo = await prisma.interactiveDemo.create({
      data: {
        title: title.trim(),
        category: category?.trim() || "Web Application",
        tagline: tagline?.trim() || "",
        description: description.trim(),
        techStack: typeof techStack === "string" ? techStack : JSON.stringify(techStack || ["Next.js", "React"]),
        keyFeatures: typeof keyFeatures === "string" ? keyFeatures : JSON.stringify(keyFeatures || []),
        previewUrl: previewUrl.trim(),
        imageUrl: imageUrl?.trim() || null,
        metrics: metrics?.trim() || null,
        orderIndex: Number(orderIndex) || 0,
        isActive: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "CREATE_DEMO",
          entityType: "INTERACTIVE_DEMO",
          entityId: demo.id,
          details: `Created demo "${demo.title}" (${demo.previewUrl})`,
        },
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true, demo });
  } catch (error) {
    console.error("Create demo error:", error);
    return NextResponse.json({ error: "Failed to create demo" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Demo ID is required" }, { status: 400 });
    }

    if (updateData.techStack && typeof updateData.techStack !== "string") {
      updateData.techStack = JSON.stringify(updateData.techStack);
    }
    if (updateData.keyFeatures && typeof updateData.keyFeatures !== "string") {
      updateData.keyFeatures = JSON.stringify(updateData.keyFeatures);
    }

    const updated = await prisma.interactiveDemo.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, demo: updated });
  } catch (error) {
    console.error("Update demo error:", error);
    return NextResponse.json({ error: "Failed to update demo" }, { status: 500 });
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
      return NextResponse.json({ error: "Demo ID is required" }, { status: 400 });
    }

    await prisma.interactiveDemo.delete({
      where: { id },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "DELETE_DEMO",
          entityType: "INTERACTIVE_DEMO",
          entityId: id,
          details: `Deleted interactive demo id ${id}`,
        },
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete demo error:", error);
    return NextResponse.json({ error: "Failed to delete demo" }, { status: 500 });
  }
}
