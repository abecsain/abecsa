import assert from "node:assert";

const BASE_URL = "http://localhost:3737";

async function testAddingAndOperations() {
  console.log("=== BEGIN COMPREHENSIVE ADDING & WORKFLOW OPERATIONS AUDIT ===");

  // 1. Authenticate as Admin
  console.log("1. Authenticating as ABECSA Admin...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@abecsa.in", password: "Admin@123" }),
  });
  assert.strictEqual(loginRes.status, 200, "Admin login must succeed");
  const cookie = loginRes.headers.get("set-cookie") || "";
  assert.ok(cookie.includes("abecsa_session"), "Session cookie must be returned");
  console.log("✓ Admin authenticated successfully.");

  // 2. Test Project Creation (with auto-fallback if customer omitted or specified)
  console.log("2. Testing Project Creation via POST /api/projects...");
  const projRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Global FinTech Realtime Settlement Engine",
      budget: 850000,
      priority: "HIGH",
      serviceCategory: "ERP & Management",
      description: "Automated real-time reconciliation and ISO20022 message processor.",
    }),
  });
  const projData = await projRes.json();
  assert.strictEqual(projRes.status, 200, "Project creation must succeed");
  assert.ok(projData.success, "Project success flag must be true");
  assert.ok(projData.project?.id, "Created project must have an ID");
  const createdProjectId = projData.project.id;
  console.log(`✓ Project created: ${projData.project.name} (${projData.project.projectId})`);

  // 3. Test Task Creation via POST /api/tasks
  console.log("3. Testing Task Creation via POST /api/tasks...");
  const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      projectId: createdProjectId,
      title: "Develop PCI-DSS Tokenization & Webhook Dispatcher",
      priority: "HIGH",
      estimatedHours: 8,
      description: "Create AES-256 encrypted vault storage and async queue dispatcher.",
    }),
  });
  const taskData = await taskRes.json();
  assert.strictEqual(taskRes.status, 200, "Task creation must succeed");
  assert.ok(taskData.success, "Task success flag must be true");
  console.log(`✓ Sprint task created: ${taskData.task.title} (ID: ${taskData.task.id})`);

  // 4. Test Software Product Creation via POST /api/products
  console.log("4. Testing Software Product Creation via POST /api/products...");
  const productRes = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "ABECSA AI Omnichannel Helpdesk Suite",
      category: "CRM & Sales",
      description: "Complete AI agent powered customer support and ticketing system.",
      price: 65000,
      badge: "2026 Innovation",
      features: ["Auto-routing tickets", "WhatsApp Business Integration", "SLA Escalation"],
      whatsappPhone: "+91 98765 43210",
    }),
  });
  const productData = await productRes.json();
  assert.strictEqual(productRes.status, 200, "Software product creation must succeed");
  assert.ok(productData.success, "Product creation success must be true");
  const productId = productData.product.id;
  console.log(`✓ Software Product created: ${productData.product.name} (${productData.product.code})`);

  // Test PATCH update product
  console.log("5. Testing Product Update via PATCH /api/products...");
  const patchRes = await fetch(`${BASE_URL}/api/products`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: productId,
      price: 69999,
      badge: "Best Seller 2026",
    }),
  });
  const patchData = await patchRes.json();
  assert.strictEqual(patchRes.status, 200, "Product update must succeed");
  assert.strictEqual(patchData.product.price, 69999, "Price must be updated");
  console.log("✓ Product updated successfully.");

  // 6. Test Inbound CRM Lead Submission via POST /api/leads
  console.log("6. Testing CRM Lead Submission via POST /api/leads...");
  const leadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Aakash Mehta",
      email: `aakash.${Date.now()}@mehtaglobal.com`,
      phone: "+91 98111 22334",
      companyName: "Mehta Global Logistics",
      serviceInterested: "Custom Enterprise Software",
      budgetRange: "₹5,00,000 - ₹15,00,000",
      message: "Need a centralized warehouse inventory and fleet tracker.",
    }),
  });
  const leadData = await leadRes.json();
  assert.strictEqual(leadRes.status, 200, "Lead creation must succeed");
  assert.ok(leadData.success, "Lead success must be true");
  console.log(`✓ Inbound CRM Lead created: ${leadData.leadNumber}`);

  // 7. Test Quotation Creation via POST /api/quotations
  console.log("7. Testing Quotation Creation via POST /api/quotations...");
  const quoteRes = await fetch(`${BASE_URL}/api/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "Enterprise Logistics Cloud Transformation Proposal",
      projectId: createdProjectId,
      discount: 25000,
      taxRate: 18,
      items: [
        { description: "Microservices Architecture & System Design", quantity: 1, unitPrice: 300000 },
        { description: "Driver Android App & Real-time GPS Tracker", quantity: 1, unitPrice: 400000 },
      ],
    }),
  });
  const quoteData = await quoteRes.json();
  assert.strictEqual(quoteRes.status, 200, "Quotation creation must succeed");
  assert.ok(quoteData.success, "Quotation success must be true");
  console.log(`✓ Quotation created: ${quoteData.quotation.quotationNumber} (Total: ₹${quoteData.quotation.totalAmount})`);

  // 8. Test Invoice Creation via POST /api/invoices
  console.log("8. Testing Invoice Creation via POST /api/invoices...");
  const invRes = await fetch(`${BASE_URL}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      projectId: createdProjectId,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
      items: [
        { description: "Phase 1 Mobilization & Architecture Approval", quantity: 1, unitPrice: 200000 },
      ],
    }),
  });
  const invData = await invRes.json();
  assert.strictEqual(invRes.status, 200, "Invoice creation must succeed");
  assert.ok(invData.success, "Invoice success must be true");
  console.log(`✓ Invoice created: ${invData.invoice.invoiceNumber} (Total: ₹${invData.invoice.totalAmount})`);

  // 9. Test Vault Folder & File Creation via POST /api/vault
  console.log("9. Testing Vault Folder and File Creation via POST /api/vault...");
  const folderRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      type: "FOLDER",
      name: "Sprint 1 Architecture Blueprints",
      projectId: createdProjectId,
      isCustomerVisible: true,
    }),
  });
  const folderData = await folderRes.json();
  assert.strictEqual(folderRes.status, 200, "Folder creation must succeed");
  assert.ok(folderData.success, "Folder creation must be true");

  const fileRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      type: "FILE",
      folderId: folderData.folder.id,
      projectId: createdProjectId,
      fileName: "system-architecture-v1.png",
      fileUrl: "/logo.png",
      fileType: "IMAGE",
      description: "High-level microservice interaction diagram.",
      isCustomerVisible: true,
    }),
  });
  const fileData = await fileRes.json();
  assert.strictEqual(fileRes.status, 200, "File creation must succeed");
  assert.ok(fileData.success, "File creation must be true");
  console.log(`✓ Vault Folder and File created and linked successfully.`);

  // 10. Verify Key Routes respond with HTTP 200
  console.log("10. Verifying Public and Admin route accessibility on port 3737...");
  const routes = [
    "/",
    "/shop",
    "/demos",
    "/domains",
    "/tools",
    "/services",
    "/projects",
    "/about",
    "/contact",
    "/admin",
    "/admin/projects",
    "/admin/tasks",
    "/admin/shop",
    "/admin/users",
    "/admin/crm",
    "/admin/quotations",
    "/admin/invoices",
    "/admin/vault",
    "/admin/whatsapp",
    "/admin/visitors",
  ];

  for (const route of routes) {
    const res = await fetch(`${BASE_URL}${route}`, {
      headers: { Cookie: cookie },
    });
    assert.strictEqual(res.status, 200, `Route ${route} must respond with 200 OK`);
  }
  console.log(`✓ All ${routes.length} inspected routes returned 200 OK.`);

  console.log("\n=======================================================");
  console.log("ALL 10 CREATION & WORKFLOW VERIFICATION TESTS PASSED 100%");
  console.log("=======================================================\n");
}

testAddingAndOperations().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
