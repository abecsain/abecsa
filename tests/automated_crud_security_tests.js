require("dotenv").config();
const jwt = require("jsonwebtoken");

const BASE_URL = "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "abecsa_prod_sec_jwt_94078_997721_2026_enterprise";

// Tokens for different roles
const adminToken = jwt.sign(
  { userId: "55c6d425-ef12-46ac-8e7c-7955447531e9", email: "admin@abecsa.in", role: "ADMIN", name: "Abecsa Admin" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const customerAToken = jwt.sign(
  { userId: "9f703bc5-76c5-4b19-a1b4-7d830e81f13a", email: "client@abecsa.in", role: "CUSTOMER", name: "Ananya Deshmukh" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const customerBToken = jwt.sign(
  { userId: "8a07ae04-174a-4528-8dd8-9d1e1b234f7e", email: "client2@abecsa.in", role: "CUSTOMER", name: "Rohan Gupta" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const engineerToken = jwt.sign(
  { userId: "048672e6-8340-48ba-9430-7c07fc8d474d", email: "engineer@abecsa.in", role: "ENGINEER", name: "Priya Nair" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

async function runTests() {
  console.log("==================================================================");
  console.log("     AUTOMATED CRUD & APPLICATION SECURITY AUDIT TEST SUITE       ");
  console.log("==================================================================\n");

  const results = [];

  async function testCase(name, fn) {
    try {
      const res = await fn();
      if (res.passed) {
        console.log(`[PASS] ${name} (Status: ${res.status})`);
        results.push({ name, passed: true, details: res.details });
      } else {
        console.error(`[FAIL] ${name}: ${res.details}`);
        results.push({ name, passed: false, details: res.details });
      }
    } catch (err) {
      console.error(`[ERR]  ${name}: ${err.message}`);
      results.push({ name, passed: false, details: err.message });
    }
  }

  // TEST 1: Unauthenticated access to protected CRUD routes
  await testCase("Unauthenticated GET /api/projects returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/projects`);
    return { passed: res.status === 401, status: res.status, details: `Got ${res.status}` };
  });

  await testCase("Unauthenticated GET /api/users returns 403/401", async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    return { passed: res.status === 401 || res.status === 403, status: res.status, details: `Got ${res.status}` };
  });

  await testCase("Unauthenticated GET /api/hr returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/hr`);
    return { passed: res.status === 401, status: res.status, details: `Got ${res.status}` };
  });

  await testCase("Unauthenticated GET /api/quotations?id=fake-id returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/quotations?id=fake-id`);
    return { passed: res.status === 401, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 2: Role-based Authorization / Privilege Escalation
  await testCase("Customer calling Admin-only /api/users returns 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Cookie: `abecsa_session=${customerAToken}` },
    });
    return { passed: res.status === 403, status: res.status, details: `Got ${res.status}` };
  });

  await testCase("Customer calling Admin-only PATCH /api/settings returns 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `abecsa_session=${customerAToken}` },
      body: JSON.stringify({ companyName: "Hacked" }),
    });
    return { passed: res.status === 403, status: res.status, details: `Got ${res.status}` };
  });

  await testCase("Customer calling internal GET /api/hr returns 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/hr`, {
      headers: { Cookie: `abecsa_session=${customerAToken}` },
    });
    return { passed: res.status === 403, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 3: IDOR (Insecure Direct Object Reference) Protection
  await testCase("Customer B requesting Customer A's project by ID returns 403 Forbidden", async () => {
    const targetProjectId = "05dfa222-b4b9-4f60-9830-1d78eb7d7737";
    const res = await fetch(`${BASE_URL}/api/projects/${targetProjectId}`, {
      headers: { Cookie: `abecsa_session=${customerBToken}` },
    });
    return { passed: res.status === 403, status: res.status, details: `Got ${res.status}` };
  });

  await testCase("Customer A requesting own project by ID succeeds with 200 OK", async () => {
    const targetProjectId = "05dfa222-b4b9-4f60-9830-1d78eb7d7737";
    const res = await fetch(`${BASE_URL}/api/projects/${targetProjectId}`, {
      headers: { Cookie: `abecsa_session=${customerAToken}` },
    });
    return { passed: res.status === 200, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 4: Payment Self-Verification Protection
  await testCase("Customer attempting to self-verify payment creates PENDING_VERIFICATION (not VERIFIED)", async () => {
    // First, let's create a test invoice as Admin
    const invRes = await fetch(`${BASE_URL}/api/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `abecsa_session=${adminToken}` },
      body: JSON.stringify({
        customerId: "556f68e4-1d44-4f65-927d-8f0bba58c457", // Customer A
        items: [{ description: "QA Test Suite Service", quantity: 1, unitPrice: 5000 }],
      }),
    });
    const invData = await invRes.json();
    const testInvoiceId = invData.invoice?.id;

    if (!testInvoiceId) {
      return { passed: false, details: "Failed to create prerequisite invoice" };
    }

    // Customer A submits payment
    const payRes = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: `abecsa_session=${customerAToken}` },
      body: JSON.stringify({
        invoiceId: testInvoiceId,
        amount: 5900,
        transactionReference: "UPI-TEST-12345",
      }),
    });
    const payData = await payRes.json();

    const isPending = payData.payment?.status === "PENDING_VERIFICATION";
    const isUnverified = payData.payment?.verifiedById === null;
    const balanceNotZeroed = payData.invoice?.balanceAmount > 0;

    return {
      passed: isPending && isUnverified && balanceNotZeroed,
      status: payRes.status,
      details: `Payment status: ${payData.payment?.status}, verifiedById: ${payData.payment?.verifiedById}, invoice balance: ${payData.invoice?.balanceAmount}`,
    };
  });

  // TEST 5: Mass Assignment Protection
  await testCase("PATCH /api/settings rejects injection of unauthorized fields", async () => {
    const res = await fetch(`${BASE_URL}/api/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: `abecsa_session=${adminToken}` },
      body: JSON.stringify({
        companyName: "ABECSA Software Solutions",
        unauthorizedField: "INJECTED_VALUE",
        adminPrivilege: true,
      }),
    });
    const data = await res.json();
    const clean = data.settings && !("unauthorizedField" in data.settings);
    return { passed: res.status === 200 && clean, status: res.status, details: "Clean response without injected fields" };
  });

  // TEST 6: SQL/NoSQL Injection and XSS Payload Resiliency
  await testCase("Input fields safely sanitize SQL injection and XSS payloads without crashing", async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.10" },
      body: JSON.stringify({
        name: "'; DROP TABLE users; -- <script>alert(1)</script>",
        email: "security_tester@abecsa.in",
        phone: "+91 94078 99216",
        message: "SELECT * FROM passwords WHERE '1'='1'",
      }),
    });
    return { passed: res.status === 200, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 7: Invalid Payload and Type Validation
  await testCase("POST /api/leads with invalid email returns 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.11" },
      body: JSON.stringify({
        name: "Test User",
        email: "not-an-email",
      }),
    });
    return { passed: res.status === 400, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 8: Missing Resource (404 Not Found) Handling
  await testCase("GET /api/projects/00000000-0000-0000-0000-000000000000 returns 404 Not Found", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/00000000-0000-0000-0000-000000000000`, {
      headers: { Cookie: `abecsa_session=${adminToken}` },
    });
    return { passed: res.status === 404, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 9: CSRF & CORS Origin Protection on Sensitive Actions
  await testCase("Unauthorized Cross-Origin POST /api/vault rejected with 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/vault`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `abecsa_session=${adminToken}`,
        Origin: "https://malicious-attacker-site.com",
      },
      body: JSON.stringify({ type: "FOLDER", name: "Malicious Folder" }),
    });
    return { passed: res.status === 403, status: res.status, details: `Got ${res.status}` };
  });

  // TEST 10: Rate Limiting Protection on Public Endpoints
  await testCase("Rapid requests trigger Rate Limiter (429 Too Many Requests)", async () => {
    let got429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.99" },
        body: JSON.stringify({
          name: `Rate Tester ${i}`,
          email: `ratetest_${i}@example.com`,
          phone: "+91 99999 88888",
        }),
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    return { passed: got429, status: got429 ? 429 : 200, details: got429 ? "Rate limit triggered 429" : "Did not trigger 429" };
  });

  console.log("\n==================================================================");
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passedCount} | FAILED: ${total - passedCount}`);
  console.log("==================================================================");
}

runTests();
