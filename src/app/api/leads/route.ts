import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// Public Quote/Contact Form Submission
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { name, email, phone, companyName, serviceInterested, budgetRange, preferredContact, message } = data;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Generate unique Lead number
    const count = await prisma.crmLead.count();
    const leadNumber = `LEAD-2026-${String(count + 1).padStart(3, "0")}`;

    // Find default delivery manager for assignment
    const defaultManager = await prisma.user.findFirst({
      where: { role: "MANAGER", status: "ACTIVE" },
    });

    const lead = await prisma.crmLead.create({
      data: {
        leadNumber,
        name,
        email: email.toLowerCase().trim(),
        phone,
        companyName,
        serviceInterested: serviceInterested || "Custom Enterprise Software",
        budgetRange: budgetRange || "Flexible",
        preferredContact: preferredContact || "WHATSAPP",
        message,
        status: "NEW_LEAD",
        assignedManagerId: defaultManager?.id,
        source: "WEBSITE_CONTACT",
      },
    });

    // Notify all Admins & Managers
    const notifyUsers = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "MANAGER"] } },
      select: { id: true },
    });

    for (const u of notifyUsers) {
      await prisma.notification.create({
        data: {
          userId: u.id,
          title: "New Inbound Inquiry Captured",
          message: `${name} (${companyName || "Direct Client"}) requested a proposal for ${serviceInterested || "Custom Software"}.`,
          type: "INFO",
          linkUrl: "/admin/crm",
        },
      });
    }

    return NextResponse.json({
      success: true,
      leadNumber: lead.leadNumber,
      message: "Inquiry received. Our enterprise architect will contact you shortly.",
    });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit proposal request" },
      { status: 500 }
    );
  }
}

// Get Leads (Admin & Manager)
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const leads = await prisma.crmLead.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignedManager: {
        select: { id: true, name: true, email: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ leads });
}

// Update Lead Status / Conversion / Assignment (Admin & Manager)
export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, assignedManagerId, score, notes, action } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID required" }, { status: 400 });
    }

    const lead = await prisma.crmLead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Handle "CONVERT TO CUSTOMER" action!
    if (action === "CONVERT_TO_CUSTOMER") {
      const bcrypt = (await import("bcryptjs")).default;
      const defaultPassword = "Client@123";
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      // Check if user already exists
      let clientUser = await prisma.user.findUnique({
        where: { email: lead.email },
      });

      if (!clientUser) {
        clientUser = await prisma.user.create({
          data: {
            email: lead.email,
            passwordHash,
            name: lead.name,
            role: "CUSTOMER",
            phone: lead.phone,
            jobTitle: "Authorized Client Representative",
            status: "ACTIVE",
          },
        });
      }

      // Create or update CustomerProfile
      let profile = await prisma.customerProfile.findUnique({
        where: { userId: clientUser.id },
      });

      if (!profile) {
        profile = await prisma.customerProfile.create({
          data: {
            userId: clientUser.id,
            companyName: lead.companyName || `${lead.name} Enterprises`,
            assignedManagerId: lead.assignedManagerId || sessionUser.id,
            leadSource: lead.source || "WEBSITE_CONVERTED",
            status: "ACTIVE",
            notes: `Converted from Lead ${lead.leadNumber}. Initial inquiry: ${lead.message || "N/A"}`,
          },
        });
      }

      // Also create an initial Project workspace for this converted customer
      const projectCount = await prisma.project.count();
      const projectId = `PRJ-2026-${String(projectCount + 101).padStart(3, "0")}`;

      const newProject = await prisma.project.create({
        data: {
          projectId,
          name: `${lead.companyName || lead.name} - ${lead.serviceInterested || "Custom Software Project"}`,
          description: lead.message || "Initiated from converted CRM lead inquiry.",
          customerId: profile.id,
          managerId: lead.assignedManagerId || sessionUser.id,
          serviceCategory: lead.serviceInterested || "Custom Software Development",
          budget: 500000,
          status: "PLANNING",
          progress: 5,
        },
      });

      // Update lead with conversion reference
      const updatedLead = await prisma.crmLead.update({
        where: { id },
        data: {
          status: "CONVERTED",
          convertedCustomerId: profile.id,
          convertedProjectId: newProject.id,
        },
      });

      await prisma.crmActivity.create({
        data: {
          leadId: id,
          userId: sessionUser.id,
          activityType: "STATUS_CHANGE",
          notes: `Lead successfully converted to Customer profile (${lead.name}) & Project (${projectId}).`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Lead converted! Customer account created (${lead.email} / Client@123) and Project ${projectId} initialized.`,
        lead: updatedLead,
        customerId: profile.id,
        projectId: newProject.id,
      });
    }

    // Normal status update or notes or details
    const updateData: {
      status?: string;
      assignedManagerId?: string;
      score?: number;
      name?: string;
      email?: string;
      phone?: string;
      companyName?: string;
      serviceInterested?: string;
      budgetRange?: string;
    } = {};
    if (status) updateData.status = status;
    if (assignedManagerId) updateData.assignedManagerId = assignedManagerId;
    if (score !== undefined) updateData.score = Number(score);
    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.companyName !== undefined) updateData.companyName = body.companyName;
    if (body.serviceInterested !== undefined) updateData.serviceInterested = body.serviceInterested;
    if (body.budgetRange !== undefined) updateData.budgetRange = body.budgetRange;

    const updated = await prisma.crmLead.update({
      where: { id },
      data: updateData,
    });

    if (notes) {
      await prisma.crmActivity.create({
        data: {
          leadId: id,
          userId: sessionUser.id,
          activityType: "NOTE",
          notes,
        },
      });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error) {
    console.error("Lead update error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    await prisma.crmActivity.deleteMany({ where: { leadId: id } });
    await prisma.crmLead.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Delete lead error:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
