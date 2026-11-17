import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { dispatchWhatsAppMessage, substituteTemplateVariables } from "@/lib/whatsapp";

// GET WhatsApp account status, templates, and message history
export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "COMPANY_CENTRAL" | "MANAGER_PERSONAL"

  const targetType = type || (sessionUser.effectiveRole === "ADMIN" ? "COMPANY_CENTRAL" : "MANAGER_PERSONAL");

  // Locate or initialize WhatsApp account
  let account = await prisma.whatsAppAccount.findFirst({
    where:
      targetType === "MANAGER_PERSONAL"
        ? { accountType: "MANAGER_PERSONAL", userId: sessionUser.id }
        : { accountType: "COMPANY_CENTRAL" },
    include: {
      messages: {
        orderBy: { sentAt: "desc" },
        take: 50,
      },
    },
  });

  if (!account) {
    account = await prisma.whatsAppAccount.create({
      data: {
        accountType: targetType,
        userId: targetType === "MANAGER_PERSONAL" ? sessionUser.id : undefined,
        phoneNumber: targetType === "COMPANY_CENTRAL" ? "+91 98765 43210" : sessionUser.phone || "+91 98765 43211",
        connectionStatus: "CONNECTED",
        lastHeartbeat: new Date(),
      },
      include: {
        messages: true,
      },
    });
  } else if (account.connectionStatus !== "CONNECTED" || account.qrCode !== null) {
    account = await prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: {
        connectionStatus: "CONNECTED",
        qrCode: null,
        lastHeartbeat: new Date(),
      },
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 50,
        },
      },
    });
  }

  // Fetch approved templates
  const templates = await prisma.whatsAppTemplate.findMany({
    orderBy: { templateName: "asc" },
  });

  // Fetch customer phone directory for fast recipient lookup
  const customers = await prisma.customerProfile.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      companyName: true,
      user: { select: { name: true, phone: true, email: true } },
      projects: { select: { id: true, name: true, projectId: true } },
    },
  });

  return NextResponse.json({
    account,
    templates,
    customers,
  });
}

// POST dispatch WhatsApp message
export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      accountId,
      recipientPhone,
      recipientName,
      customerId,
      messageType = "CUSTOM_TEXT",
      templateName,
      variables,
      content,
      mediaUrl,
    } = data;

    if (!recipientPhone) {
      return NextResponse.json({ error: "Recipient phone number is required" }, { status: 400 });
    }

    let finalContent = content;

    // If template selected, process variable replacement
    if (templateName) {
      const template = await prisma.whatsAppTemplate.findUnique({
        where: { templateName },
      });

      if (template) {
        finalContent = substituteTemplateVariables(template.bodyText, variables || {});
      }
    }

    if (!finalContent) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    // Verify target account
    let targetAccountId = accountId;
    if (!targetAccountId) {
      let defaultAccount = await prisma.whatsAppAccount.findFirst({
        where:
          sessionUser.effectiveRole === "ADMIN"
            ? { accountType: "COMPANY_CENTRAL" }
            : { accountType: "MANAGER_PERSONAL", userId: sessionUser.id },
      });
      if (!defaultAccount) {
        defaultAccount = await prisma.whatsAppAccount.create({
          data: {
            accountType: sessionUser.effectiveRole === "ADMIN" ? "COMPANY_CENTRAL" : "MANAGER_PERSONAL",
            userId: sessionUser.effectiveRole === "MANAGER" ? sessionUser.id : undefined,
            phoneNumber: sessionUser.phone || "+91 98765 00000",
            connectionStatus: "CONNECTED",
            lastHeartbeat: new Date(),
          },
        });
      }
      targetAccountId = defaultAccount.id;
    }

    if (!targetAccountId) {
      return NextResponse.json({ error: "No active WhatsApp account found" }, { status: 400 });
    }

    const message = await dispatchWhatsAppMessage({
      accountId: targetAccountId,
      senderId: sessionUser.id,
      recipientPhone,
      recipientName,
      customerId,
      messageType,
      templateName,
      content: finalContent,
      mediaUrl,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: sessionUser.id,
        action: "SEND_WHATSAPP",
        entityType: "WHATSAPP_MESSAGE",
        entityId: message.id,
        details: `Dispatched WhatsApp to ${recipientPhone} (${recipientName || "Direct"}). Status: ${message.status}`,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("Dispatch WhatsApp error:", error);
    return NextResponse.json({ error: "Failed to dispatch WhatsApp message" }, { status: 500 });
  }
}

// PATCH update WhatsApp account settings (phone number, etc.)
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { accountId, phoneNumber } = await req.json();
    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const updated = await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        phoneNumber: phoneNumber || undefined,
        lastHeartbeat: new Date(),
      },
      include: {
        messages: {
          orderBy: { sentAt: "desc" },
          take: 50,
        },
      },
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    console.error("Update WhatsApp account error:", error);
    return NextResponse.json({ error: "Failed to update WhatsApp account" }, { status: 500 });
  }
}
