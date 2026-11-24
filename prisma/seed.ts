import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { syncSupabaseProductionData } from "../src/lib/supabaseSync";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ABECSA database...");

  // 1. Company Settings (Production)
  await prisma.companySettings.upsert({
    where: { id: "abecsa-settings" },
    update: {
      companyName: "ABECSA Software Solutions",
      tagline: "Enterprise Digital & Software Engineering",
      logoUrl: "/logo.png",
      email: "Abecsa.in@gmail.com",
      phone: "+91 94078 99216",
      address: "Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100",
      website: "https://abecsa.in",
      currency: "INR",
      currencySymbol: "₹",
      defaultTaxRate: 18.0,
      invoicePrefix: "INV-2026-",
      quotationPrefix: "QT-2026-",
      whatsappNumber: "+91 94078 99216",
      isConfigured: true,
    },
    create: {
      id: "abecsa-settings",
      companyName: "ABECSA Software Solutions",
      tagline: "Enterprise Digital & Software Engineering",
      logoUrl: "/logo.png",
      email: "Abecsa.in@gmail.com",
      phone: "+91 94078 99216",
      address: "Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100",
      website: "https://abecsa.in",
      currency: "INR",
      currencySymbol: "₹",
      defaultTaxRate: 18.0,
      invoicePrefix: "INV-2026-",
      quotationPrefix: "QT-2026-",
      whatsappNumber: "+91 94078 99216",
      isConfigured: true,
    },
  });

  // 2. Users & Credentials
  const adminHash = await bcrypt.hash("Admin@123", 10);
  const managerHash = await bcrypt.hash("Manager@123", 10);
  const engineerHash = await bcrypt.hash("Engineer@123", 10);
  const clientHash = await bcrypt.hash("Client@123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@abecsa.in",
      passwordHash: adminHash,
      name: "ABECSA Admin",
      role: "ADMIN",
      phone: "+91 98765 43210",
      jobTitle: "Administrator",
      department: "Administration",
      status: "ACTIVE",
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: "manager@abecsa.in",
      passwordHash: managerHash,
      name: "Vikram Malhotra",
      role: "MANAGER",
      phone: "+91 98765 43211",
      jobTitle: "Senior Delivery & Client Operations Manager",
      department: "Delivery & Client Success",
      status: "ACTIVE",
    },
  });

  const engineerUser = await prisma.user.create({
    data: {
      email: "engineer@abecsa.in",
      passwordHash: engineerHash,
      name: "Priya Nair",
      role: "ENGINEER",
      phone: "+91 98765 43212",
      jobTitle: "Lead Full-Stack Software Engineer",
      department: "Engineering & Architecture",
      hourlyRate: 1250,
      status: "ACTIVE",
    },
  });

  const engineerUser2 = await prisma.user.create({
    data: {
      email: "dev@abecsa.in",
      passwordHash: engineerHash,
      name: "Kavita Rao",
      role: "ENGINEER",
      phone: "+91 98765 43213",
      jobTitle: "Senior Frontend & Mobile Engineer",
      department: "Engineering & Architecture",
      hourlyRate: 1000,
      status: "ACTIVE",
    },
  });

  const clientUser = await prisma.user.create({
    data: {
      email: "client@abecsa.in",
      passwordHash: clientHash,
      name: "Ananya Deshmukh",
      role: "CUSTOMER",
      phone: "+91 98765 43214",
      jobTitle: "VP of Operations",
      status: "ACTIVE",
    },
  });

  const clientProfile = await prisma.customerProfile.create({
    data: {
      userId: clientUser.id,
      companyName: "NexaCorp Global Logistics",
      businessType: "Logistics & Supply Chain",
      address: "Prestige Cyber Heights, Sector 5, HSR Layout, Bengaluru 560102",
      gstNumber: "29AABCN8890P1ZQ",
      assignedManagerId: managerUser.id,
      leadSource: "Direct Enterprise Referral",
      status: "ACTIVE",
      notes: "High-priority enterprise account. Prefers WhatsApp updates and weekly sprint summaries.",
    },
  });

  const clientUser2 = await prisma.user.create({
    data: {
      email: "client2@abecsa.in",
      passwordHash: clientHash,
      name: "Rohan Gupta",
      role: "CUSTOMER",
      phone: "+91 98765 43215",
      jobTitle: "Chief Technology Officer",
      status: "ACTIVE",
    },
  });

  const clientProfile2 = await prisma.customerProfile.create({
    data: {
      userId: clientUser2.id,
      companyName: "FinEdge Capital Solutions",
      businessType: "FinTech & Wealth Management",
      address: "Bandra Kurla Complex, Tower 3, Mumbai 400051",
      gstNumber: "27AABCF4567E1ZY",
      assignedManagerId: managerUser.id,
      leadSource: "Inbound Website RFP",
      status: "ACTIVE",
      notes: "Fintech compliance required. Data encryption standards are paramount.",
    },
  });

  // 3. Projects
  const project1 = await prisma.project.create({
    data: {
      projectId: "PRJ-2026-NEXA",
      name: "NexaFlow Enterprise Supply Chain & Fleet ERP",
      description: "End-to-end cloud ERP for real-time fleet GPS tracking, automated warehouse dispatch, dynamic consignment routing, and GST invoicing.",
      customerId: clientProfile.id,
      managerId: managerUser.id,
      serviceCategory: "ERP & Custom Software",
      budget: 1850000,
      priority: "HIGH",
      status: "IN_PROGRESS",
      progress: 68,
      startDate: new Date("2026-09-01"),
      deliveryDate: new Date("2026-12-15"),
      techStack: "Next.js 16, TypeScript, Node.js, PostgreSQL, Prisma, Tailwind CSS, Redis",
      stagingUrl: "https://nexaflow-staging.abecsa.in",
      repoUrl: "https://github.com/abecsa-internal/nexaflow-erp",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      projectId: "PRJ-2026-FINEDG",
      name: "FinEdge Mobile Wealth & Algorithmic Portfolio Suite",
      description: "Cross-platform iOS and Android mobile investment application with SEBI compliance, KYC verification, real-time market data streaming, and automated rebalancing.",
      customerId: clientProfile2.id,
      managerId: managerUser.id,
      serviceCategory: "Mobile Application Development",
      budget: 2400000,
      priority: "URGENT",
      status: "UNDER_REVIEW",
      progress: 85,
      startDate: new Date("2026-08-15"),
      deliveryDate: new Date("2026-11-30"),
      techStack: "React Native, Expo, Go Backend, TimescaleDB, WebSockets, Kafka",
      stagingUrl: "https://finedge-app-staging.abecsa.in",
      repoUrl: "https://github.com/abecsa-internal/finedge-mobile",
    },
  });

  // Project Members
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: managerUser.id, role: "MANAGER" },
      { projectId: project1.id, userId: engineerUser.id, role: "LEAD" },
      { projectId: project1.id, userId: engineerUser2.id, role: "ENGINEER" },
      { projectId: project2.id, userId: managerUser.id, role: "MANAGER" },
      { projectId: project2.id, userId: engineerUser.id, role: "LEAD" },
      { projectId: project2.id, userId: engineerUser2.id, role: "ENGINEER" },
    ],
  });

  // 4. Tasks for Project 1
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Design GPS Telemetry Pipeline & Map Integration",
      description: "Implement high-throughput real-time GPS telemetry listener and Google Maps driver route rendering with geofencing triggers.",
      assignedToId: engineerUser.id,
      createdById: managerUser.id,
      priority: "HIGH",
      status: "COMPLETED",
      estimatedHours: 40,
      actualHours: 38,
      order: 1,
      deliverableUrl: "https://github.com/abecsa-internal/nexaflow-erp/pull/42",
    },
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "Warehouse Dispatch & Automated Barcode Scanning",
      description: "Integrate camera-based QR/Barcode scanning for warehouse operators during outbound parcel handoff.",
      assignedToId: engineerUser.id,
      createdById: managerUser.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      estimatedHours: 35,
      actualHours: 24,
      order: 2,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: "GST E-Way Bill API Connector",
      description: "Build automated Government GST Portal E-Way bill generation webhook and PDF download engine.",
      assignedToId: engineerUser2.id,
      createdById: managerUser.id,
      priority: "MEDIUM",
      status: "TODO",
      estimatedHours: 25,
      actualHours: 0,
      order: 3,
    },
  });

  // Checklists and Comments
  await prisma.taskChecklist.createMany({
    data: [
      { taskId: task1.id, title: "Telemetry Kafka consumer set up", isCompleted: true },
      { taskId: task1.id, title: "Driver map view with route deviation alert", isCompleted: true },
      { taskId: task2.id, title: "Zebra scanner SDK test on Android", isCompleted: true },
      { taskId: task2.id, title: "Batch verification API endpoint", isCompleted: false },
    ],
  });

  await prisma.taskComment.create({
    data: {
      taskId: task2.id,
      userId: engineerUser.id,
      comment: "Zebra handheld scanner testing went smoothly. Writing the final payload sanitizer now.",
      isInternal: true,
    },
  });

  // 5. Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: project1.id,
        title: "Sprint 1: Core Architecture, DB Schema & Auth RBAC",
        description: "Foundational architecture, database setup, and user permission models.",
        dueDate: new Date("2026-09-25"),
        status: "APPROVED",
        order: 1,
        clientNote: "Approved by Ananya Deshmukh on Sep 26.",
      },
      {
        projectId: project1.id,
        title: "Sprint 2: Fleet Management, Live GPS & Telemetry Engine",
        description: "Real-time dispatch dashboard, vehicle health monitoring, and geofencing.",
        dueDate: new Date("2026-10-30"),
        status: "SUBMITTED_FOR_APPROVAL",
        order: 2,
        clientNote: "Staging deployment ready for client review.",
      },
      {
        projectId: project1.id,
        title: "Sprint 3: Warehouse Operations, Barcode & Invoicing",
        description: "Dispatch scanning, E-Way bills, inventory reconciliation, and analytics.",
        dueDate: new Date("2026-11-28"),
        status: "IN_PROGRESS",
        order: 3,
      },
      {
        projectId: project1.id,
        title: "Sprint 4: End-to-End QA, Load Testing & Production Launch",
        description: "Security penetration testing, high availability failover, and deployment.",
        dueDate: new Date("2026-12-15"),
        status: "PENDING",
        order: 4,
      },
    ],
  });

  // 6. Quotation & Invoice
  const quotation1 = await prisma.quotation.create({
    data: {
      quotationNumber: "QT-2026-001",
      customerId: clientProfile.id,
      projectId: project1.id,
      title: "Enterprise Custom ERP & Fleet Tracking System Development",
      currency: "INR",
      subtotal: 1850000,
      discount: 50000,
      taxRate: 18.0,
      taxAmount: 324000,
      totalAmount: 2124000,
      paymentTerms: "30% Advance, 40% Milestone 2, 30% Final Sign-off",
      validUntil: new Date("2026-12-31"),
      status: "APPROVED",
      clientResponse: "Approved by Ananya Deshmukh. Advance payment processed.",
      notes: "Includes 12 months comprehensive enterprise maintenance and 99.9% uptime SLA.",
      termsConditions: "1. Scope limited to agreed requirements matrix. 2. Any scope extensions billed at standard blended hourly rates.",
    },
  });

  await prisma.quotationItem.createMany({
    data: [
      {
        quotationId: quotation1.id,
        description: "Phase 1: Architecture, UI/UX Design System, Database Modeling & RBAC",
        quantity: 1,
        unitPrice: 400000,
        amount: 400000,
      },
      {
        quotationId: quotation1.id,
        description: "Phase 2: Fleet Management, GPS Live Stream, Geofencing & Driver App",
        quantity: 1,
        unitPrice: 650000,
        amount: 650000,
      },
      {
        quotationId: quotation1.id,
        description: "Phase 3: Automated Warehouse Inbound/Outbound Barcode Scanning & Routing",
        quantity: 1,
        unitPrice: 500000,
        amount: 500000,
      },
      {
        quotationId: quotation1.id,
        description: "Phase 4: GST E-Way Bill Integration, Finance Analytics & BI Reporting",
        quantity: 1,
        unitPrice: 300000,
        amount: 300000,
      },
    ],
  });

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-001",
      quotationId: quotation1.id,
      customerId: clientProfile.id,
      projectId: project1.id,
      issueDate: new Date("2026-09-02"),
      dueDate: new Date("2026-09-17"),
      currency: "INR",
      subtotal: 550000,
      taxAmount: 99000,
      totalAmount: 649000,
      amountPaid: 649000,
      balanceAmount: 0,
      status: "PAID",
      paymentTerms: "Advance 30% against Milestone 1 signoff",
      notes: "Thank you for partnering with ABECSA Software Solutions.",
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice1.id,
      description: "Project Mobilization & Sprint 1 Milestone Advance (30%)",
      quantity: 1,
      unitPrice: 550000,
      amount: 550000,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      customerId: clientProfile.id,
      amount: 649000,
      paymentDate: new Date("2026-09-05"),
      paymentMethod: "BANK_TRANSFER",
      transactionReference: "HDFC-NEFT-9988220194",
      status: "VERIFIED",
      verifiedById: adminUser.id,
      notes: "Verified against HDFC Current Account statement.",
    },
  });

  // Invoice 2: Milestone 2 Partial/Pending
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-002",
      quotationId: quotation1.id,
      customerId: clientProfile.id,
      projectId: project1.id,
      issueDate: new Date("2026-10-31"),
      dueDate: new Date("2026-11-15"),
      currency: "INR",
      subtotal: 740000,
      taxAmount: 133200,
      totalAmount: 873200,
      amountPaid: 500000,
      balanceAmount: 373200,
      status: "PARTIALLY_PAID",
      paymentTerms: "Milestone 2 Delivery Payment",
      notes: "Partial payment received on Nov 4. Balance due upon sprint verification.",
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice2.id,
      description: "Milestone 2 Delivery: Live GPS Telemetry & Fleet Tracking Dashboard",
      quantity: 1,
      unitPrice: 740000,
      amount: 740000,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      customerId: clientProfile.id,
      amount: 500000,
      paymentDate: new Date("2026-11-04"),
      paymentMethod: "UPI",
      transactionReference: "UPI-AXIS-0029381744",
      status: "VERIFIED",
      verifiedById: adminUser.id,
      notes: "First installment of Milestone 2 received via corporate UPI handle.",
    },
  });

  // 7. Folders & Files (Vault)
  const rootFolder1 = await prisma.folder.create({
    data: {
      name: "NexaCorp Shared Client Documents",
      projectId: project1.id,
      customerId: clientProfile.id,
      createdById: managerUser.id,
      isCustomerVisible: true,
    },
  });

  const subFolderDesigns = await prisma.folder.create({
    data: {
      name: "UI-UX High-Fidelity Mockups",
      parentId: rootFolder1.id,
      projectId: project1.id,
      customerId: clientProfile.id,
      createdById: managerUser.id,
      isCustomerVisible: true,
    },
  });

  const subFolderSpecs = await prisma.folder.create({
    data: {
      name: "Technical Specifications & Contracts",
      parentId: rootFolder1.id,
      projectId: project1.id,
      customerId: clientProfile.id,
      createdById: managerUser.id,
      isCustomerVisible: true,
    },
  });

  const internalFolder = await prisma.folder.create({
    data: {
      name: "Internal Engineering Architecture & Credentials",
      projectId: project1.id,
      customerId: clientProfile.id,
      createdById: managerUser.id,
      isCustomerVisible: false, // Internal team only
    },
  });

  await prisma.file.createMany({
    data: [
      {
        folderId: subFolderDesigns.id,
        projectId: project1.id,
        customerId: clientProfile.id,
        uploadedById: managerUser.id,
        fileName: "nexaflow-dispatch-dashboard-v2.png",
        originalName: "NexaFlow Fleet & Dispatch Cockpit Design.png",
        fileUrl: "/logo.png",
        fileType: "IMAGE",
        fileSize: 2450000,
        mimeType: "image/png",
        isCustomerVisible: true,
        description: "Finalized Figma design for dispatch controller screen with live map view.",
      },
      {
        folderId: subFolderSpecs.id,
        projectId: project1.id,
        customerId: clientProfile.id,
        uploadedById: managerUser.id,
        fileName: "abecsa-nexaflow-signed-sow.pdf",
        originalName: "ABECSA NexaCorp Master Services Agreement & Scope of Work.pdf",
        fileUrl: "#",
        fileType: "PDF",
        fileSize: 1820000,
        mimeType: "application/pdf",
        isCustomerVisible: true,
        description: "Countersigned Master Services Agreement and project specification document.",
      },
      {
        folderId: internalFolder.id,
        projectId: project1.id,
        customerId: clientProfile.id,
        uploadedById: engineerUser.id,
        fileName: "redis-cluster-benchmark-report.pdf",
        originalName: "Internal Redis Telemetry Throughput Analysis.pdf",
        fileUrl: "#",
        fileType: "PDF",
        fileSize: 850000,
        mimeType: "application/pdf",
        isCustomerVisible: false,
        description: "Confidential load benchmarks for GPS listener container cluster.",
      },
    ],
  });

  // 8. Notice Board Messages (Pushed to Customer)
  await prisma.noticeMessage.createMany({
    data: [
      {
        customerId: clientProfile.id,
        senderId: managerUser.id,
        title: "Sprint 2 Staging Environment Ready for Your Inspection",
        message: "Hello Ananya, we have deployed the real-time fleet GPS tracking module to your dedicated staging URL (https://nexaflow-staging.abecsa.in). Please review the route simulation and let us know your thoughts.",
        priority: "IMPORTANT",
        actionUrl: "https://nexaflow-staging.abecsa.in",
        actionLabel: "Open Staging Sandbox",
        isRead: false,
      },
      {
        customerId: clientProfile.id,
        senderId: managerUser.id,
        title: "Upcoming Architecture Review & Sprint 3 Kickoff Meeting",
        message: "We have scheduled our weekly sprint sync for this Thursday at 3:30 PM IST via Google Meet. We'll present the barcode batch reconciliation workflow.",
        priority: "NORMAL",
        isRead: true,
        readAt: new Date(),
      },
    ],
  });

  // 9. Support Ticket
  const ticket1 = await prisma.supportTicket.create({
    data: {
      ticketNumber: "TIK-2026-101",
      customerId: clientProfile.id,
      projectId: project1.id,
      assignedToId: engineerUser.id,
      subject: "Driver Mobile App QR Scanner Calibration on Samsung Tab A9",
      description: "Our depot team noticed slight camera autofocus delay when scanning damaged parcel barcodes in low ambient warehouse lighting.",
      category: "BUG",
      priority: "HIGH",
      status: "IN_PROGRESS",
    },
  });

  await prisma.ticketMessage.createMany({
    data: [
      {
        ticketId: ticket1.id,
        senderId: clientUser.id,
        message: "The warehouse shift reported that low-contrast thermal labels require 2-3 seconds to lock focus on Samsung Tab A9 tablets.",
        isInternal: false,
      },
      {
        ticketId: ticket1.id,
        senderId: engineerUser.id,
        message: "Understood Ananya! We are activating continuous auto-exposure torch mode and increasing the camera resolution buffer in the Android scanner component. A patch build will be uploaded to staging today.",
        isInternal: false,
      },
    ],
  });

  // 10. CRM Leads & Pipeline
  const lead1 = await prisma.crmLead.create({
    data: {
      leadNumber: "LEAD-2026-001",
      name: "Siddharth Verma",
      email: "siddharth@cloudbridge.tech",
      phone: "+91 98234 56789",
      companyName: "CloudBridge Global Systems",
      serviceInterested: "Custom Software & Cloud Microservices Migration",
      budgetRange: "₹15,00,000 - ₹30,00,000",
      preferredContact: "WHATSAPP",
      message: "Looking for an expert engineering partner to rewrite our legacy PHP monolith into high-concurrency Node.js / Go microservices with Docker and Kubernetes.",
      status: "DISCOVERY",
      assignedManagerId: managerUser.id,
      score: 85,
      source: "WEBSITE_CONTACT",
    },
  });

  const lead2 = await prisma.crmLead.create({
    data: {
      leadNumber: "LEAD-2026-002",
      name: "Dr. Meenakshi Sundaram",
      email: "m.sundaram@medcurehealth.org",
      phone: "+91 97123 45678",
      companyName: "MedCure Multi-Speciality Clinics",
      serviceInterested: "Healthcare CRM & Patient Telehealth Portal",
      budgetRange: "₹8,00,000 - ₹15,00,000",
      preferredContact: "EMAIL",
      message: "Need HIPAA/ABDM-compliant doctor consultation portal with electronic health records (EHR) and WhatsApp appointment reminders.",
      status: "QUOTATION_SENT",
      assignedManagerId: managerUser.id,
      score: 92,
      source: "WEBSITE_CONTACT",
    },
  });

  const lead3 = await prisma.crmLead.create({
    data: {
      leadNumber: "LEAD-2026-003",
      name: "Aditya Singhania",
      email: "aditya@singhaniagroup.in",
      phone: "+91 98990 12345",
      companyName: "Singhania Retailers & Distributors",
      serviceInterested: "Omnichannel E-commerce & Inventory Management",
      budgetRange: "₹25,00,000+",
      preferredContact: "WHATSAPP",
      message: "We operate 45 stores across South India and need real-time multi-location warehouse synchronization with Shopify Plus.",
      status: "NEW_LEAD",
      score: 78,
      source: "DIRECT_INQUIRY",
    },
  });

  await prisma.crmActivity.create({
    data: {
      leadId: lead1.id,
      userId: managerUser.id,
      activityType: "WHATSAPP",
      notes: "Held initial introductory WhatsApp chat with Siddharth. Scheduled technical deep-dive call for Friday.",
    },
  });

  // 11. WhatsApp Accounts & Templates
  // A. Official Company WhatsApp
  const companyWa = await prisma.whatsAppAccount.create({
    data: {
      accountType: "COMPANY_CENTRAL",
      phoneNumber: "+91 98765 43210",
      businessAccountId: "WABA-ABECSA-OFFICIAL-2026",
      connectionStatus: "CONNECTED",
      lastHeartbeat: new Date(),
      webhookUrl: "https://abecsa.in/api/whatsapp/webhook",
    },
  });

  // B. Manager's Personal WhatsApp
  const managerWa = await prisma.whatsAppAccount.create({
    data: {
      accountType: "MANAGER_PERSONAL",
      userId: managerUser.id,
      phoneNumber: "+91 98765 43211",
      connectionStatus: "CONNECTED",
      lastHeartbeat: new Date(),
    },
  });

  // WhatsApp Templates
  await prisma.whatsAppTemplate.createMany({
    data: [
      {
        templateName: "welcome_client",
        category: "GREETING",
        bodyText: "Hello {{customer_name}}, welcome to ABECSA Software Solutions! Your client workspace has been provisioned at {{portal_url}}. Your dedicated Project Manager is {{manager_name}}.",
        variablesJson: JSON.stringify(["customer_name", "portal_url", "manager_name"]),
      },
      {
        templateName: "project_milestone_update",
        category: "PROJECT_UPDATE",
        bodyText: "Dear {{customer_name}}, {{project_name}} has reached a new milestone: {{milestone_title}}! Our team has updated the staging preview for your review at {{staging_url}}.",
        variablesJson: JSON.stringify(["customer_name", "project_name", "milestone_title", "staging_url"]),
      },
      {
        templateName: "quotation_ready_alert",
        category: "QUOTATION_ALERT",
        bodyText: "Hi {{customer_name}}, your formal quotation {{quotation_number}} for {{project_name}} is ready. Total: ₹{{total_amount}}. Review and approve online in your portal: {{portal_url}}.",
        variablesJson: JSON.stringify(["customer_name", "quotation_number", "project_name", "total_amount", "portal_url"]),
      },
      {
        templateName: "payment_receipt_acknowledgement",
        category: "PAYMENT_REMINDER",
        bodyText: "Thank you {{customer_name}}! We have successfully received payment of ₹{{amount}} for Invoice {{invoice_number}}. Receipt has been attached in your account.",
        variablesJson: JSON.stringify(["customer_name", "amount", "invoice_number"]),
      },
      {
        templateName: "meeting_reminder_sync",
        category: "GENERAL",
        bodyText: "Reminder: ABECSA & {{company_name}} sprint sync is scheduled for {{meeting_time}}. Link: {{meeting_link}}. Looking forward to speaking with you!",
        variablesJson: JSON.stringify(["company_name", "meeting_time", "meeting_link"]),
      },
    ],
  });

  // Pre-seed some logged messages
  await prisma.whatsAppMessage.createMany({
    data: [
      {
        accountId: companyWa.id,
        senderId: adminUser.id,
        recipientPhone: "+91 98765 43214",
        recipientName: "Ananya Deshmukh",
        customerId: clientProfile.id,
        messageType: "TEMPLATE",
        templateName: "welcome_client",
        content: "Hello Ananya Deshmukh, welcome to ABECSA Software Solutions! Your client workspace has been provisioned at https://abecsa.in/login. Your dedicated Project Manager is Vikram Malhotra.",
        status: "READ",
        messageId: "wamid.HBgMOTE5ODc2NTQzMjE0FQIAERgSMzAyRUYwRkJEMEEyODVDNEUA",
        sentAt: new Date("2026-09-01T10:00:00Z"),
        deliveredAt: new Date("2026-09-01T10:00:05Z"),
        readAt: new Date("2026-09-01T10:01:22Z"),
      },
      {
        accountId: managerWa.id,
        senderId: managerUser.id,
        recipientPhone: "+91 98765 43214",
        recipientName: "Ananya Deshmukh",
        customerId: clientProfile.id,
        messageType: "CUSTOM_TEXT",
        content: "Good morning Ananya! Priya has pushed the barcode scanner patch to staging. Let me know when you get a chance to test it.",
        status: "DELIVERED",
        messageId: "wamid.HBgMOTE5ODc2NTQzMjE0FQIAERgSREVFODlCNjg4NzFBMURBRjYA",
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    ],
  });

  // 12. HR, Attendance, Leave Requests & Work Logs
  await prisma.attendance.createMany({
    data: [
      { userId: engineerUser.id, status: "PRESENT", checkIn: new Date("2026-11-16T09:15:00Z") },
      { userId: engineerUser2.id, status: "PRESENT", checkIn: new Date("2026-11-16T09:30:00Z") },
      { userId: managerUser.id, status: "PRESENT", checkIn: new Date("2026-11-16T09:00:00Z") },
    ],
  });

  await prisma.leaveRequest.create({
    data: {
      userId: engineerUser.id,
      leaveType: "CASUAL",
      startDate: new Date("2026-11-20"),
      endDate: new Date("2026-11-21"),
      totalDays: 2,
      reason: "Family function in Kochi.",
      status: "APPROVED",
      approvedById: managerUser.id,
      reviewNote: "Approved. Handover to Kavita Rao confirmed.",
    },
  });

  await prisma.workLog.createMany({
    data: [
      {
        userId: engineerUser.id,
        taskId: task1.id,
        projectId: project1.id,
        hoursSpent: 6.5,
        description: "Finished driver location coordinate interpolation algorithms and map polyline rendering.",
      },
      {
        userId: engineerUser.id,
        taskId: task2.id,
        projectId: project1.id,
        hoursSpent: 5.0,
        description: "Implemented barcode scanner continuous autofocus camera listener on Android WebView.",
      },
    ],
  });

  // 13. Audit Log & Notifications
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "SYSTEM_INITIALIZATION",
        entityType: "SYSTEM",
        details: "ABECSA enterprise management system initialized with enterprise master seed.",
      },
      {
        userId: managerUser.id,
        action: "CREATE_PROJECT",
        entityType: "PROJECT",
        entityId: project1.id,
        details: "Project PRJ-2026-NEXA created for NexaCorp Global Logistics.",
      },
      {
        userId: managerUser.id,
        action: "PUSH_NOTICE",
        entityType: "NOTICE",
        details: "Pushed Sprint 2 Staging Notice to client Ananya Deshmukh.",
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        title: "New Enterprise Quotation Approved",
        message: "NexaCorp Global Logistics approved Quotation QT-2026-001 (₹21,24,000).",
        type: "SUCCESS",
        linkUrl: "/admin/quotations",
      },
      {
        userId: managerUser.id,
        title: "Client Ticket Opened",
        message: "New bug ticket TIK-2026-101 opened for NexaFlow ERP.",
        type: "WARNING",
        linkUrl: "/manager/support",
      },
      {
        userId: clientUser.id,
        title: "Sprint 2 Staging Preview Ready",
        message: "Manager Vikram Malhotra has shared Sprint 2 deployment link for inspection.",
        type: "INFO",
        linkUrl: "/customer",
      },
      {
        userId: engineerUser.id,
        title: "Task Assigned",
        message: "You have been assigned to Warehouse Dispatch & Automated Barcode Scanning.",
        type: "INFO",
        linkUrl: "/engineer/tasks",
      },
    ],
  });

  // 14. Sync production Supabase accounts, apps, websites & applications
  console.log("Synchronizing live Supabase production cloud data...");
  const syncResult = await syncSupabaseProductionData();
  console.log("Supabase production sync finished:", syncResult);

  console.log("Database seeded successfully with enterprise records!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
