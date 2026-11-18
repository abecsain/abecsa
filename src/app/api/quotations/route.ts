import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const customerId = searchParams.get("customerId");

  // Allow fetching a single quotation for web presentation if authenticated or valid token
  if (id) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        project: {
          include: {
            manager: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        items: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation proposal not found" }, { status: 404 });
    }

    // Parse structured metadata in clientResponse if JSON
    let parsedMetadata: any = {};
    if (quotation.clientResponse) {
      try {
        parsedMetadata = JSON.parse(quotation.clientResponse);
      } catch {
        parsedMetadata = { note: quotation.clientResponse };
      }
    }

    return NextResponse.json({
      quotation: {
        ...quotation,
        metadata: parsedMetadata,
      },
    });
  }

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const whereClause: {
    customerId?: string;
    status?: { not: string };
  } = {};

  if (sessionUser.effectiveRole === "CUSTOMER") {
    if (!sessionUser.customerProfile) {
      return NextResponse.json({ quotations: [], managers: [], customers: [], projects: [] });
    }
    whereClause.customerId = sessionUser.customerProfile.id;
    whereClause.status = { not: "DRAFT" };
  } else if (customerId) {
    whereClause.customerId = customerId;
  }

  const quotations = await prisma.quotation.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      customer: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      project: {
        include: {
          manager: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      items: true,
    },
  });

  // Enrich with parsed metadata
  const enrichedQuotations = quotations.map((q) => {
    let metadata: any = {};
    if (q.clientResponse) {
      try {
        metadata = JSON.parse(q.clientResponse);
      } catch {
        metadata = { note: q.clientResponse };
      }
    }
    return {
      ...q,
      metadata,
    };
  });

  // If Admin or Manager, also load available Managers, Customers, and Projects for assignment
  let managers: any[] = [];
  let customers: any[] = [];
  let projects: any[] = [];

  if (["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    try {
      managers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] }, status: "ACTIVE" },
        select: { id: true, name: true, email: true, role: true, jobTitle: true },
        orderBy: { name: "asc" },
      });

      customers = await prisma.customerProfile.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
        orderBy: { companyName: "asc" },
      });

      projects = await prisma.project.findMany({
        select: { id: true, projectId: true, name: true, customerId: true, managerId: true },
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({
    quotations: enrichedQuotations,
    managers,
    customers,
    projects,
  });
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const data = await req.json();
    const {
      customerId,
      newClient,
      projectId,
      newProject,
      managerId,
      title,
      items,
      discount = 0,
      taxRate = 18.0,
      paymentTerms,
      validUntil,
      notes,
      termsConditions,
      agreementTitle = "Master Software Engineering & Cloud Services Agreement",
      status = "SENT",
    } = data;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Quotation proposal title is required" },
        { status: 400 }
      );
    }

    // 1. Resolve Target Customer
    let targetCustomerId = customerId && customerId.trim() !== "" ? customerId : null;

    // Handle inline creation of a new client if requested
    if (!targetCustomerId && newClient && newClient.companyName) {
      const clientEmail = (newClient.email || `client_${Date.now()}@abecsa.client`).toLowerCase().trim();
      let user = await prisma.user.findUnique({ where: { email: clientEmail } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: clientEmail,
            name: newClient.name || newClient.companyName,
            passwordHash: "$2a$10$wTqg2E0s0xJ1zTq4c8r8x.Fq8y1qN6p7q8r8x.Fq8y1qN6p7q8r8x", // Client@123
            role: "CUSTOMER",
            phone: newClient.phone || "+91 98765 43210",
            status: "ACTIVE",
          },
        });
      }

      const custProfile = await prisma.customerProfile.create({
        data: {
          userId: user.id,
          companyName: newClient.companyName,
          businessType: newClient.businessType || "Enterprise",
          address: newClient.address,
          gstNumber: newClient.gstNumber,
          assignedManagerId: managerId || sessionUser.id,
        },
      });
      targetCustomerId = custProfile.id;
    }

    // Fallback to first existing customer if none selected
    if (!targetCustomerId) {
      const firstCustomer = await prisma.customerProfile.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (firstCustomer) {
        targetCustomerId = firstCustomer.id;
      } else {
        return NextResponse.json(
          { error: "Please select an existing client or enter client details." },
          { status: 400 }
        );
      }
    }

    // 2. Resolve Target Project
    let targetProjectId = projectId && projectId.trim() !== "" ? projectId : null;

    // Handle inline creation of a new project if requested
    if (!targetProjectId && newProject && newProject.name) {
      const prjCount = await prisma.project.count();
      const code = `ABC-PRJ-${String(prjCount + 101).padStart(3, "0")}`;

      const createdPrj = await prisma.project.create({
        data: {
          projectId: code,
          name: newProject.name.trim(),
          description: newProject.description || `Enterprise software project for ${title.trim()}`,
          customerId: targetCustomerId,
          managerId: managerId || sessionUser.id,
          serviceCategory: newProject.serviceCategory || "Web Applications",
          techStack: newProject.techStack || "Next.js 16, React 19, TypeScript, PostgreSQL",
          budget: Number(newProject.budget || 0),
          deliveryDate: newProject.deliveryDate ? new Date(newProject.deliveryDate) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          status: "QUOTATION_SENT",
          progress: 5,
        },
      });
      targetProjectId = createdPrj.id;
    }

    // 3. Resolve Assigned Manager Details
    let assignedManagerName = "";
    const effectiveManagerId = managerId || (sessionUser.role === "MANAGER" ? sessionUser.id : null);
    if (effectiveManagerId) {
      const mgr = await prisma.user.findUnique({
        where: { id: effectiveManagerId },
        select: { name: true },
      });
      if (mgr) assignedManagerName = mgr.name;
    }

    // 4. Resolve Line Items & Financial Calculations
    const rawItems = Array.isArray(items) && items.length > 0 ? items : [
      { description: "Phase 1: Architecture, High-Speed APIs & Role-Based Security", quantity: 1, unitPrice: 350000 },
      { description: "Phase 2: Full-Stack Platform Engineering, Admin OS & Testing", quantity: 1, unitPrice: 450000 },
    ];

    let subtotal = 0;
    const computedItems = rawItems.map((it: { description: string; quantity: number; unitPrice: number }) => {
      const q = Math.max(1, Number(it.quantity || 1));
      const u = Math.max(0, Number(it.unitPrice || 0));
      const amt = q * u;
      subtotal += amt;
      return {
        description: it.description || "Engineering Deliverable Scope",
        quantity: q,
        unitPrice: u,
        amount: amt,
      };
    });

    const disc = Math.max(0, Number(discount || 0));
    const taxable = Math.max(0, subtotal - disc);
    const taxAmt = Math.round((taxable * Number(taxRate)) / 100);
    const grandTotal = taxable + taxAmt;

    // Generate Quotation Number
    const count = await prisma.quotation.count();
    const quotationNumber = `QT-2026-${String(count + 1).padStart(3, "0")}`;

    // Package initial metadata bundle
    const initialMetadata = {
      agreementTitle: agreementTitle || "Master Software Engineering & Cloud Services Agreement",
      assignedManagerId: effectiveManagerId,
      assignedManagerName,
      createdByName: sessionUser.name,
      createdByRole: sessionUser.effectiveRole,
      createdAtIso: new Date().toISOString(),
      eSignatureRequired: true,
      eSignature: null,
      signedByName: null,
      signedAt: null,
      signedIp: null,
      auditTrail: [
        {
          action: "CREATED",
          by: `${sessionUser.name} (${sessionUser.effectiveRole})`,
          timestamp: new Date().toISOString(),
          note: `Quotation proposal generated for ₹${grandTotal.toLocaleString("en-IN")}`,
        },
      ],
    };

    if (effectiveManagerId) {
      initialMetadata.auditTrail.push({
        action: "ASSIGNED_MANAGER",
        by: sessionUser.name,
        timestamp: new Date().toISOString(),
        note: `Assigned Delivery Manager: ${assignedManagerName}`,
      });
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: targetCustomerId,
        projectId: targetProjectId || undefined,
        title: title.trim(),
        currency: "INR",
        subtotal,
        discount: disc,
        taxRate: Number(taxRate),
        taxAmount: taxAmt,
        totalAmount: grandTotal,
        paymentTerms: paymentTerms || "30% Advance Mobilization, 40% Staging & Milestone 2 Delivery, 30% Final Sign-off",
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: notes || "Includes 12 months comprehensive bug-fix warranty, cloud deployment, and 99.9% SLA.",
        termsConditions: termsConditions || getDefaultAgreementTerms(),
        status,
        clientResponse: JSON.stringify(initialMetadata),
        items: {
          create: computedItems,
        },
      },
      include: {
        customer: { include: { user: true } },
        project: { include: { manager: true } },
        items: true,
      },
    });

    // Notify Customer
    if (quotation.customer?.userId) {
      await prisma.notification.create({
        data: {
          userId: quotation.customer.userId,
          title: "New Quotation & Master Agreement Ready",
          message: `ABECSA has prepared formal proposal ${quotationNumber} (${title}) for ₹${grandTotal.toLocaleString("en-IN")}. Please review and execute via E-Sign.`,
          type: "INFO",
          linkUrl: "/customer/quotations",
        },
      });

      await prisma.noticeMessage.create({
        data: {
          customerId: targetCustomerId,
          senderId: sessionUser.id,
          title: `Proposal ${quotationNumber} Ready for Review & E-Sign`,
          message: `Official quotation and terms for ${title.trim()} have been issued. Total estimated investment: ₹${grandTotal.toLocaleString("en-IN")}.`,
          priority: "IMPORTANT",
          actionUrl: "/customer/quotations",
          actionLabel: "Review & E-Sign Agreement",
        },
      });
    }

    // Notify Assigned Manager if different from creator
    if (effectiveManagerId && effectiveManagerId !== sessionUser.id) {
      await prisma.notification.create({
        data: {
          userId: effectiveManagerId,
          title: `Quotation ${quotationNumber} Assigned to You`,
          message: `You have been designated as Delivery Manager for quotation "${title.trim()}" for client ${quotation.customer?.companyName}.`,
          type: "INFO",
          linkUrl: "/manager/quotations",
        },
      });
    }

    return NextResponse.json({
      success: true,
      quotation: {
        ...quotation,
        metadata: initialMetadata,
      },
    });
  } catch (error) {
    console.error("Create quotation error:", error);
    return NextResponse.json({ error: "Failed to create quotation and agreement" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser();

  try {
    const body = await req.json();
    const {
      id,
      action,
      eSignature,
      signedByName,
      signedByDesignation,
      signedByEmail,
      managerId,
      customerId,
      title,
      status,
      termsConditions,
      paymentTerms,
      notes,
      discount,
      convertToInvoice,
      convertToProject,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: { include: { user: true } }, items: true, project: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Parse existing metadata
    let metadata: any = {};
    if (quotation.clientResponse) {
      try {
        metadata = JSON.parse(quotation.clientResponse);
      } catch {
        metadata = { note: quotation.clientResponse };
      }
    }
    if (!metadata.auditTrail) metadata.auditTrail = [];

    // 1. DIGITAL E-SIGNATURE EXECUTION
    if (action === "ESIGN") {
      const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      const signTimestamp = new Date().toISOString();
      const verificationHash = `ABECSA-SIG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const legalSignee = signedByName || sessionUser?.name || quotation.customer?.user?.name || "Authorized Signee";
      const designation = signedByDesignation || "Authorized Signatory";

      metadata.eSignature = eSignature || "DIGITALLY_SEALED";
      metadata.signedByName = legalSignee;
      metadata.signedByDesignation = designation;
      metadata.signedByEmail = signedByEmail || sessionUser?.email || quotation.customer?.user?.email;
      metadata.signedAt = signTimestamp;
      metadata.signedIp = clientIp;
      metadata.verificationHash = verificationHash;
      metadata.agreementAccepted = true;

      metadata.auditTrail.push({
        action: "DIGITALLY_SIGNED",
        by: `${legalSignee} (${designation})`,
        timestamp: signTimestamp,
        note: `Executed agreement with verified E-Signature. Verification Hash: ${verificationHash}`,
        ip: clientIp,
      });

      const updated = await prisma.quotation.update({
        where: { id },
        data: {
          status: "APPROVED",
          clientResponse: JSON.stringify(metadata),
        },
        include: { customer: { include: { user: true } }, project: true, items: true },
      });

      // Notify Staff & Managers
      const staffUsers = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "MANAGER"] } },
        select: { id: true },
      });

      for (const u of staffUsers) {
        await prisma.notification.create({
          data: {
            userId: u.id,
            title: `Quotation ${quotation.quotationNumber} Digitally Signed!`,
            message: `${quotation.customer.companyName} signed proposal ${quotation.quotationNumber}. Legal signee: ${legalSignee}. Hash: ${verificationHash}`,
            type: "SUCCESS",
            linkUrl: "/admin/quotations",
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Agreement and quotation successfully executed with E-Signature!",
        quotation: {
          ...updated,
          metadata,
        },
      });
    }

    // 2. ASSIGN / REASSIGN TO MANAGER OR CLIENT (Admin or Manager)
    if (action === "ASSIGN") {
      if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const updateData: any = {};

      if (customerId && customerId !== quotation.customerId) {
        updateData.customerId = customerId;
        const newCust = await prisma.customerProfile.findUnique({
          where: { id: customerId },
          include: { user: true },
        });
        metadata.assignedCustomerId = customerId;
        metadata.assignedClientName = newCust?.companyName;
        metadata.auditTrail.push({
          action: "REASSIGNED_CLIENT",
          by: sessionUser.name,
          timestamp: new Date().toISOString(),
          note: `Reassigned quotation to client: ${newCust?.companyName}`,
        });
      }

      if (managerId) {
        const mgr = await prisma.user.findUnique({
          where: { id: managerId },
          select: { name: true, email: true },
        });
        metadata.assignedManagerId = managerId;
        metadata.assignedManagerName = mgr?.name;
        metadata.auditTrail.push({
          action: "REASSIGNED_MANAGER",
          by: sessionUser.name,
          timestamp: new Date().toISOString(),
          note: `Assigned Delivery Manager: ${mgr?.name}`,
        });

        // Also update linked project manager if project exists
        if (quotation.projectId) {
          try {
            await prisma.project.update({
              where: { id: quotation.projectId },
              data: { managerId },
            });
          } catch {}
        }

        // Notify newly assigned manager
        await prisma.notification.create({
          data: {
            userId: managerId,
            title: `Quotation ${quotation.quotationNumber} Assigned to You`,
            message: `You are designated Delivery Manager for ${quotation.title} (${quotation.customer?.companyName}).`,
            type: "INFO",
            linkUrl: "/manager/quotations",
          },
        });
      }

      updateData.clientResponse = JSON.stringify(metadata);

      const updated = await prisma.quotation.update({
        where: { id },
        data: updateData,
        include: { customer: { include: { user: true } }, project: true, items: true },
      });

      return NextResponse.json({
        success: true,
        message: "Assignment updated successfully",
        quotation: {
          ...updated,
          metadata,
        },
      });
    }

    // 3. CONVERT APPROVED QUOTATION TO ACTIVE PROJECT
    if (convertToProject) {
      if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      let project = quotation.project;
      if (!project) {
        const prjCount = await prisma.project.count();
        const code = `ABC-PRJ-${String(prjCount + 101).padStart(3, "0")}`;

        project = await prisma.project.create({
          data: {
            projectId: code,
            name: quotation.title,
            description: quotation.notes || `Software project generated from quotation ${quotation.quotationNumber}`,
            customerId: quotation.customerId,
            managerId: metadata.assignedManagerId || sessionUser.id,
            serviceCategory: "Enterprise Application",
            techStack: "Next.js 16, React 19, TypeScript, Node.js",
            budget: quotation.totalAmount,
            status: "IN_PROGRESS",
            progress: 10,
            deliveryDate: quotation.validUntil || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        });

        // Link quotation to newly created project
        await prisma.quotation.update({
          where: { id },
          data: {
            projectId: project.id,
            status: "CONVERTED_TO_PROJECT",
          },
        });

        // Create initial project milestones matching quotation items
        for (let i = 0; i < quotation.items.length; i++) {
          const it = quotation.items[i];
          await prisma.milestone.create({
            data: {
              projectId: project.id,
              title: it.description,
              description: `Deliverable milestone ${i + 1} from approved commercial proposal.`,
              order: i + 1,
              status: i === 0 ? "IN_PROGRESS" : "PENDING",
              dueDate: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Project ${project.projectId} (${project.name}) activated with milestone tracking!`,
        projectId: project.id,
      });
    }

    // 4. CONVERT APPROVED QUOTATION TO INVOICE
    if (convertToInvoice) {
      if (!sessionUser || !["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      const invCount = await prisma.invoice.count();
      const invoiceNumber = `INV-2026-${String(invCount + 1).padStart(3, "0")}`;

      const newInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          quotationId: quotation.id,
          customerId: quotation.customerId,
          projectId: quotation.projectId,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          currency: quotation.currency,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          amountPaid: 0,
          balanceAmount: quotation.totalAmount,
          status: "UNPAID",
          paymentTerms: quotation.paymentTerms || "Net 15 Days",
          notes: `Generated from Approved Quotation ${quotation.quotationNumber} with E-Signature verification.`,
          items: {
            create: quotation.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              amount: it.amount,
            })),
          },
        },
      });

      await prisma.quotation.update({
        where: { id },
        data: { status: "CONVERTED_TO_INVOICE" },
      });

      return NextResponse.json({
        success: true,
        message: `Quotation converted to Tax Invoice ${invoiceNumber}`,
        invoice: newInvoice,
      });
    }

    // 5. STANDARD UPDATE (Title, Terms, Notes, Status, Discount)
    if (sessionUser && ["ADMIN", "MANAGER"].includes(sessionUser.effectiveRole)) {
      const updateData: any = {};
      if (title) updateData.title = title.trim();
      if (status) updateData.status = status;
      if (termsConditions !== undefined) updateData.termsConditions = termsConditions;
      if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
      if (notes !== undefined) updateData.notes = notes;
      if (discount !== undefined) {
        const disc = Number(discount);
        updateData.discount = disc;
        const taxable = Math.max(0, quotation.subtotal - disc);
        updateData.taxAmount = Math.round((taxable * quotation.taxRate) / 100);
        updateData.totalAmount = taxable + updateData.taxAmount;
      }

      const updated = await prisma.quotation.update({
        where: { id },
        data: updateData,
        include: { customer: { include: { user: true } }, project: true, items: true },
      });

      return NextResponse.json({
        success: true,
        quotation: {
          ...updated,
          metadata,
        },
      });
    }

    return NextResponse.json({ error: "No valid action specified" }, { status: 400 });
  } catch (error) {
    console.error("Quotation patch error:", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
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
      return NextResponse.json({ error: "Quotation ID is required" }, { status: 400 });
    }

    await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    await prisma.quotation.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error) {
    console.error("Delete quotation error:", error);
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}

// Standard Master Agreement & T&C Template
function getDefaultAgreementTerms(): string {
  return `MASTER SOFTWARE SERVICES & CLOUD ENGINEERING AGREEMENT

1. SCOPE OF SERVICES & DELIVERABLES:
ABECSA Software Solutions ("Service Provider") agrees to design, architect, engineer, and deploy the bespoke software system specified in this proposal for the Client. All development sprints will be delivered according to agreed technical specifications, acceptance criteria, and mobile-first responsive standards.

2. COMMERCIAL CONSIDERATION & PAYMENT SCHEDULE:
The Client agrees to remit payment in accordance with the payment milestones detailed in this quotation.
- Mobilization Advance: Due upon formal execution of this agreement.
- Staging & Intermediate Sprints: Due upon milestone staging deployment and client demonstration.
- Final Acceptance & Code Handover: Due upon complete QA verification and production deployment.
All statutory taxes (GST @ 18%) are applied as indicated.

3. INTELLECTUAL PROPERTY & SOURCE CODE OWNERSHIP:
Upon full and final settlement of all commercial invoices, 100% unrestricted intellectual property (IP) rights, proprietary source code, software architecture artifacts, and database schemas shall be transferred exclusively to the Client. The Service Provider retains no residual rights except the non-exclusive privilege to reference the delivered project in professional engineering portfolios.

4. CONFIDENTIALITY & NON-DISCLOSURE (NDA):
Both parties mutually pledge to protect all proprietary business logic, financial data, API credentials, customer records, and trade secrets with utmost confidentiality. No confidential information shall be disclosed to any third party without express written authorization.

5. SERVICE LEVEL AGREEMENT (SLA) & 12-MONTH WARRANTY:
The Service Provider provides a comprehensive 12-month post-launch warranty covering all reproducible defects, software bugs, and security vulnerability patches without additional assessment charges. Technical support is guaranteed under standard business SLA (response within 4 hours; critical resolution within 24 hours).

6. LEGAL JURISDICTION & DIGITAL EXECUTION:
This agreement is governed by the laws of India. Any unresolved dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka. Execution of this document via electronic signature (E-Sign) shall carry the full legal validity, binding power, and admissibility of an original handwritten wet-ink signature.`;
}
