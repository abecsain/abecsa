import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      visitorToken,
      path = "/",
      pageTitle,
      referrer,
      name,
      email,
      phone,
      isLoginAction,
    } = data;

    if (!visitorToken) {
      return NextResponse.json({ error: "visitorToken is required" }, { status: 400 });
    }

    // Extract headers
    const userAgent = req.headers.get("user-agent") || "Unknown";
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const deviceType = isMobile ? "Mobile" : "Desktop";

    // Check if session user is authenticated
    const sessionUser = await getSessionUser();

    // Locate or create visitor session
    let session = await prisma.visitorSession.findUnique({
      where: { visitorToken },
    });

    if (session) {
      session = await prisma.visitorSession.update({
        where: { id: session.id },
        data: {
          userId: sessionUser?.id || session.userId || undefined,
          name: name || sessionUser?.name || session.name || undefined,
          email: email || sessionUser?.email || session.email || undefined,
          phone: phone || sessionUser?.phone || session.phone || undefined,
          pageViewCount: { increment: 1 },
          loginCount: isLoginAction ? { increment: 1 } : session.loginCount,
          lastActiveAt: new Date(),
          ipAddress: ipAddress || session.ipAddress,
          userAgent: userAgent || session.userAgent,
          deviceType: deviceType || session.deviceType,
        },
      });
    } else {
      session = await prisma.visitorSession.create({
        data: {
          visitorToken,
          userId: sessionUser?.id,
          name: name || sessionUser?.name,
          email: email || sessionUser?.email,
          phone: phone || sessionUser?.phone,
          landingPage: path,
          referrer,
          ipAddress,
          userAgent,
          deviceType,
          pageViewCount: 1,
          loginCount: isLoginAction ? 1 : 0,
          lastActiveAt: new Date(),
        },
      });
    }

    // Record page view breadcrumb
    await prisma.pageView.create({
      data: {
        sessionId: session.id,
        path,
        pageTitle,
        referrer,
      },
    });

    // If phone or email was captured and lead not in CRM, automatically provision a CRM lead!
    if (phone || email) {
      const existingLead = await prisma.crmLead.findFirst({
        where: {
          OR: [
            phone ? { phone } : {},
            email ? { email } : {},
          ].filter((c) => Object.keys(c).length > 0),
        },
      });

      if (!existingLead && (phone || email)) {
        await prisma.crmLead.create({
          data: {
            leadNumber: `LEAD-VIS-${Math.floor(1000 + Math.random() * 9000)}`,
            name: name || session.name || "Website Visitor",
            email: email || session.email || "visitor@web.in",
            phone: phone || session.phone,
            companyName: "Direct Web Visitor",
            serviceInterested: path.includes("shop")
              ? "Software Shop Purchase"
              : path.includes("domains")
              ? "Domain Registration"
              : "Website Consultation",
            source: "WEBSITE_VISITOR_TRACKER",
            status: "NEW_LEAD",
            message: `Captured from ${path} on ${deviceType} (${ipAddress}). Total pages viewed: ${session.pageViewCount}.`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      visitorToken: session.visitorToken,
    });
  } catch (error: any) {
    console.error("Tracker API error:", error);
    return NextResponse.json({ error: "Failed to record visitor log" }, { status: 500 });
  }
}

// GET visitor sessions & user logs for Admin
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || sessionUser.effectiveRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "ALL" | "LEADS_ONLY" | "USERS_ONLY"

    let where: any = {};
    if (filter === "LEADS_ONLY") {
      where = {
        OR: [{ phone: { not: null } }, { email: { not: null } }],
      };
    } else if (filter === "USERS_ONLY") {
      where = {
        userId: { not: null },
      };
    }

    const sessions = await prisma.visitorSession.findMany({
      where,
      orderBy: { lastActiveAt: "desc" },
      take: 100,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            jobTitle: true,
          },
        },
        pageViews: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    });

    // Also compute overall stats
    const totalSessions = await prisma.visitorSession.count();
    const totalPageViews = await prisma.pageView.count();
    const totalCapturedLeads = await prisma.visitorSession.count({
      where: {
        OR: [{ phone: { not: null } }, { email: { not: null } }],
      },
    });
    const totalLogins = await prisma.auditLog.count({
      where: { action: "USER_LOGIN" },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions,
        totalPageViews,
        totalCapturedLeads,
        totalLogins,
      },
      sessions,
    });
  } catch (error: any) {
    console.error("Fetch visitor logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
