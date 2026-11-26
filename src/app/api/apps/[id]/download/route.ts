import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { incrementAppDownloadCount } from "@/lib/supabase";
import { applyRateLimit, safeErrorResponse } from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limit: max 20 download increments per minute per IP
  const rateLimitRes = applyRateLimit(req, "app_download", 20, 60 * 1000);
  if (rateLimitRes) return rateLimitRes;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing App ID" }, { status: 400 });
    }

    // Try Supabase RPC first if configured
    await incrementAppDownloadCount(id);

    // Also update in Prisma DB for local or dual synchronization
    const app = await prisma.app.update({
      where: { id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      downloadUrl: app.apkUrl,
      downloadCount: app.downloadCount,
    });
  } catch (error: any) {
    console.error("POST /api/apps/[id]/download error:", error);
    return NextResponse.json({ success: false, error: "Failed to process download" }, { status: 500 });
  }
}
