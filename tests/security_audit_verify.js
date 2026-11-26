// Automated Security Verification Suite for ABECSA (abecsa.in)
const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function runSecurityTests() {
  console.log("==================================================");
  console.log("🔒 ABECSA SECURITY AUDIT & VERIFICATION SUITE");
  console.log("Target Base URL:", BASE_URL);
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`✅ PASS: ${testName} ${details ? `(${details})` : ""}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // 1. Security Headers on Public Landing Page
  try {
    const res = await fetch(`${BASE_URL}/`);
    const headers = res.headers;

    assert(
      headers.get("x-content-type-options") === "nosniff",
      "X-Content-Type-Options is nosniff",
      headers.get("x-content-type-options")
    );
    assert(
      headers.get("x-frame-options") === "SAMEORIGIN",
      "X-Frame-Options is SAMEORIGIN",
      headers.get("x-frame-options")
    );
    assert(
      headers.get("referrer-policy")?.includes("strict-origin"),
      "Referrer-Policy is strict-origin",
      headers.get("referrer-policy")
    );
    assert(
      headers.get("permissions-policy")?.includes("camera=()"),
      "Permissions-Policy blocks sensitive features",
      headers.get("permissions-policy")
    );
    assert(
      !headers.get("x-powered-by"),
      "X-Powered-By is hidden/removed",
      headers.get("x-powered-by") || "Header absent"
    );
  } catch (e) {
    assert(false, "Public headers check", e.message);
  }

  // 2. Unauthorized Admin Route Protection
  try {
    const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    assert(
      res.status === 307 || res.status === 302 || res.status === 308,
      "Unauthorized access to /admin redirects to login",
      `HTTP ${res.status} -> ${res.headers.get("location")}`
    );
  } catch (e) {
    assert(false, "Admin route protection check", e.message);
  }

  // 3. CORS Preflight & Restriction on API
  try {
    const res = await fetch(`${BASE_URL}/api/solutions/catalog`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://abecsa.in",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert(
      res.status === 204 || res.status === 200,
      "CORS Preflight handled cleanly",
      `HTTP ${res.status}`
    );
    assert(
      res.headers.get("access-control-allow-origin") === "https://abecsa.in",
      "CORS allows official domain https://abecsa.in",
      res.headers.get("access-control-allow-origin")
    );
  } catch (e) {
    assert(false, "CORS check", e.message);
  }

  // 4. SSRF & Private IP Protection on Ping Tool
  try {
    const res = await fetch(`${BASE_URL}/api/tools/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: "http://127.0.0.1:8080/admin" }),
    });
    const json = await res.json();
    assert(
      res.status === 403,
      "SSRF Protection: Blocked private IP loopback (127.0.0.1)",
      json.error
    );

    const cloudMetaRes = await fetch(`${BASE_URL}/api/tools/ping`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: "http://169.254.169.254/latest/meta-data" }),
    });
    assert(
      cloudMetaRes.status === 403,
      "SSRF Protection: Blocked cloud metadata IP (169.254.169.254)",
      (await cloudMetaRes.json()).error
    );
  } catch (e) {
    assert(false, "SSRF protection check", e.message);
  }

  // 5. Rate Limiting on Ping Tool (flood protection)
  try {
    let got429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/api/tools/ping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: "https://example.com" }),
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    assert(got429, "Rate Limiter: Triggered HTTP 429 on excessive requests", "Burst limited successfully");
  } catch (e) {
    assert(false, "Rate limit check", e.message);
  }

  // 6. File Upload Extension & Protocol Allowlist (Vault)
  try {
    const res = await fetch(`${BASE_URL}/api/vault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "FILE",
        fileName: "malware.exe",
        fileUrl: "https://example.com/malware.exe",
      }),
    });
    // Should be rejected with 401/403 (unauthenticated) or 400 (dangerous extension)
    assert(
      res.status === 401 || res.status === 403 || res.status === 400,
      "Executable upload attempt blocked (.exe disallowed)",
      `HTTP ${res.status}`
    );
  } catch (e) {
    assert(false, "Vault upload check", e.message);
  }

  console.log("\n==================================================");
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
