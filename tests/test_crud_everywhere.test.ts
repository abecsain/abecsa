import assert from "node:assert";

const BASE_URL = "http://localhost:3737";

async function testCrudEverywhere() {
  console.log("=== BEGIN COMPREHENSIVE FULL-LIFECYCLE CRUD VERIFICATION AUDIT ===");

  // 1. Authenticate as Admin
  console.log("1. Authenticating as Admin...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@abecsa.in", password: "Admin@123" }),
  });
  assert.strictEqual(loginRes.status, 200, "Login must succeed");
  const cookie = loginRes.headers.get("set-cookie") || "";
  assert.ok(cookie.includes("abecsa_session"), "Session cookie required");
  console.log("✓ Authenticated.");

  // 2. Project Lifecycle (CREATE -> MODIFY -> DELETE)
  console.log("2. Testing Project CRUD Lifecycle...");
  const createProjRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Temporary Test Microservice Project",
      budget: 350000,
      priority: "HIGH",
    }),
  });
  const createProjData = await createProjRes.json();
  assert.strictEqual(createProjRes.status, 200);
  assert.ok(createProjData.success);
  const projId = createProjData.project.id;
  console.log(`  ✓ Project Created: ${projId}`);

  // Modify Project
  const patchProjRes = await fetch(`${BASE_URL}/api/projects/${projId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: "Renamed Microservice Engine",
      budget: 400000,
      status: "IN_PROGRESS",
    }),
  });
  const patchProjData = await patchProjRes.json();
  assert.strictEqual(patchProjRes.status, 200);
  assert.strictEqual(patchProjData.project.name, "Renamed Microservice Engine");
  console.log(`  ✓ Project Modified successfully`);

  // 3. Task / Todo Lifecycle (CREATE -> MODIFY -> CHECKLIST ADD/DELETE -> DELETE)
  console.log("3. Testing Task / Todo CRUD Lifecycle...");
  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      projectId: projId,
      title: "Temporary Task To Edit And Delete",
      priority: "URGENT",
      description: "Initial description",
    }),
  });
  const createTaskData = await createTaskRes.json();
  assert.strictEqual(createTaskRes.status, 200);
  const taskId = createTaskData.task.id;
  console.log(`  ✓ Task Created: ${taskId}`);

  // Modify Task (title, status, priority)
  const patchTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: taskId,
      title: "Modified Task Title with SLA Guarantee",
      status: "IN_PROGRESS",
      priority: "HIGH",
      checklistAddTitle: "Perform unit test suite",
    }),
  });
  const patchTaskData = await patchTaskRes.json();
  assert.strictEqual(patchTaskRes.status, 200);
  assert.strictEqual(patchTaskData.task.title, "Modified Task Title with SLA Guarantee");
  assert.strictEqual(patchTaskData.task.status, "IN_PROGRESS");
  console.log(`  ✓ Task Modified & Checklist item added`);

  // Delete Task
  const delTaskRes = await fetch(`${BASE_URL}/api/tasks?id=${taskId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  const delTaskData = await delTaskRes.json();
  assert.strictEqual(delTaskRes.status, 200);
  assert.ok(delTaskData.success);
  console.log(`  ✓ Task Deleted successfully`);

  // Delete Project
  const delProjRes = await fetch(`${BASE_URL}/api/projects/${projId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  const delProjData = await delProjRes.json();
  assert.strictEqual(delProjRes.status, 200);
  assert.ok(delProjData.success);
  console.log(`  ✓ Project Deleted successfully`);

  // 4. Quotation Lifecycle (CREATE -> MODIFY -> DELETE)
  console.log("4. Testing Quotation CRUD Lifecycle...");
  const createQuoteRes = await fetch(`${BASE_URL}/api/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "Temporary Proposal for Cloud Deployment",
      discount: 10000,
      items: [{ description: "Cloud Setup", quantity: 1, unitPrice: 150000 }],
    }),
  });
  const createQuoteData = await createQuoteRes.json();
  assert.strictEqual(createQuoteRes.status, 200);
  const quoteId = createQuoteData.quotation.id;
  console.log(`  ✓ Quotation Created: ${createQuoteData.quotation.quotationNumber}`);

  // Modify Quotation
  const patchQuoteRes = await fetch(`${BASE_URL}/api/quotations`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: quoteId,
      title: "Updated Cloud Architecture Proposal",
      discount: 20000,
    }),
  });
  const patchQuoteData = await patchQuoteRes.json();
  assert.strictEqual(patchQuoteRes.status, 200);
  assert.strictEqual(patchQuoteData.quotation.title, "Updated Cloud Architecture Proposal");
  console.log(`  ✓ Quotation Modified successfully`);

  // Delete Quotation
  const delQuoteRes = await fetch(`${BASE_URL}/api/quotations?id=${quoteId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(delQuoteRes.status, 200);
  console.log(`  ✓ Quotation Deleted successfully`);

  // 5. Invoice Lifecycle (CREATE -> MODIFY -> DELETE)
  console.log("5. Testing Invoice CRUD Lifecycle...");
  const createInvRes = await fetch(`${BASE_URL}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      items: [{ description: "Phase 1 Sprint Delivery", quantity: 1, unitPrice: 100000 }],
    }),
  });
  const createInvData = await createInvRes.json();
  assert.strictEqual(createInvRes.status, 200);
  const invId = createInvData.invoice.id;
  console.log(`  ✓ Invoice Created: ${createInvData.invoice.invoiceNumber}`);

  // Modify Invoice (record partial payment and change status)
  const patchInvRes = await fetch(`${BASE_URL}/api/invoices`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: invId,
      amountPaid: 50000,
      notes: "Received partial wire transfer",
    }),
  });
  const patchInvData = await patchInvRes.json();
  assert.strictEqual(patchInvRes.status, 200);
  assert.strictEqual(patchInvData.invoice.status, "PARTIALLY_PAID");
  console.log(`  ✓ Invoice Modified successfully (status: ${patchInvData.invoice.status})`);

  // Delete Invoice
  const delInvRes = await fetch(`${BASE_URL}/api/invoices?id=${invId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(delInvRes.status, 200);
  console.log(`  ✓ Invoice Deleted successfully`);

  // 6. Vault Lifecycle (CREATE FOLDER & FILE -> MODIFY -> DELETE FILE & FOLDER)
  console.log("6. Testing Vault CRUD Lifecycle...");
  const createFolderRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      type: "FOLDER",
      name: "Temporary Mockup Archive",
    }),
  });
  const folderData = await createFolderRes.json();
  assert.strictEqual(createFolderRes.status, 200);
  const folderId = folderData.folder.id;

  const createFileRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      type: "FILE",
      folderId,
      fileName: "temp-spec.pdf",
      fileUrl: "/logo.png",
      fileType: "DOCUMENT",
    }),
  });
  const fileData = await createFileRes.json();
  assert.strictEqual(createFileRes.status, 200);
  const fileId = fileData.file.id;
  console.log(`  ✓ Vault Folder & File Created`);

  // Modify File
  const patchFileRes = await fetch(`${BASE_URL}/api/vault`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: fileId,
      type: "FILE",
      fileName: "approved-spec.pdf",
    }),
  });
  assert.strictEqual(patchFileRes.status, 200);
  console.log(`  ✓ Vault File Modified`);

  // Delete File
  const delFileRes = await fetch(`${BASE_URL}/api/vault?id=${fileId}&type=FILE`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(delFileRes.status, 200);
  console.log(`  ✓ Vault File Deleted`);

  // Delete Folder
  const delFolderRes = await fetch(`${BASE_URL}/api/vault?id=${folderId}&type=FOLDER`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(delFolderRes.status, 200);
  console.log(`  ✓ Vault Folder Deleted`);

  // 7. CRM Lead Lifecycle (CREATE -> MODIFY -> DELETE)
  console.log("7. Testing CRM Lead CRUD Lifecycle...");
  const createLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Rohan Verma",
      email: `rohan.${Date.now()}@vermatech.com`,
      phone: "+91 99887 76655",
      companyName: "Verma Tech Solutions",
    }),
  });
  const leadData = await createLeadRes.json();
  assert.strictEqual(createLeadRes.status, 200);

  // Retrieve lead to get id
  const getLeadsRes = await fetch(`${BASE_URL}/api/leads`, { headers: { Cookie: cookie } });
  const getLeadsData = await getLeadsRes.json();
  const createdLead = getLeadsData.leads.find((l: any) => l.name === "Rohan Verma");
  assert.ok(createdLead);
  const leadId = createdLead.id;
  console.log(`  ✓ CRM Lead Created: ${createdLead.leadNumber}`);

  // Modify Lead
  const patchLeadRes = await fetch(`${BASE_URL}/api/leads`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: leadId,
      status: "DISCOVERY",
      notes: "Completed initial Zoom demonstration",
    }),
  });
  assert.strictEqual(patchLeadRes.status, 200);
  console.log(`  ✓ CRM Lead Modified`);

  // Delete Lead
  const delLeadRes = await fetch(`${BASE_URL}/api/leads?id=${leadId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(delLeadRes.status, 200);
  console.log(`  ✓ CRM Lead Deleted`);

  // 8. Notice Message Lifecycle (CREATE -> MODIFY -> DELETE)
  console.log("8. Testing Notice Message CRUD Lifecycle...");
  const custRes = await fetch(`${BASE_URL}/api/users?role=CUSTOMER`, { headers: { Cookie: cookie } });
  const custData = await custRes.json();
  const validCustomer = custData.users.find((u: any) => !!u.customerProfile);
  assert.ok(validCustomer);

  const createNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      customerId: validCustomer.customerProfile.id,
      title: "Temporary Staging Inspection Notice",
      message: "Please inspect staging environment build 402.",
      priority: "IMPORTANT",
    }),
  });
  const noticeData = await createNoticeRes.json();
  assert.strictEqual(createNoticeRes.status, 200);
  const noticeId = noticeData.notice.id;
  console.log(`  ✓ Notice Created: ${noticeId}`);

  // Modify Notice
  const patchNoticeRes = await fetch(`${BASE_URL}/api/notices`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      id: noticeId,
      title: "Revised Notice: Build 403 Deployed",
    }),
  });
  assert.strictEqual(patchNoticeRes.status, 200);
  console.log(`  ✓ Notice Modified`);

  // Delete Notice
  const delNoticeRes = await fetch(`${BASE_URL}/api/notices?id=${noticeId}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.strictEqual(delNoticeRes.status, 200);
  console.log(`  ✓ Notice Deleted`);

  console.log("\n=======================================================");
  console.log("ALL FULL-LIFECYCLE CRUD VERIFICATION TESTS PASSED 100%");
  console.log("=======================================================\n");
}

testCrudEverywhere().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
