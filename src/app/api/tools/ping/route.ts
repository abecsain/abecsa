import { NextRequest, NextResponse } from "next/server";
import { applyRateLimit, validateCsrf, safeErrorResponse } from "@/lib/security";

function isBlockedTarget(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);

    // Only allow http: and https:
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, link-local, loopbacks, internal domains
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan") ||
      hostname.endsWith(".arpa") ||
      hostname.endsWith(".corp")
    ) {
      return true;
    }

    // IPv4 checks:
    // 0.0.0.0/8, 127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (cloud metadata)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const octet1 = parseInt(match[1], 10);
      const octet2 = parseInt(match[2], 10);

      if (octet1 === 0) return true;
      if (octet1 === 127) return true;
      if (octet1 === 10) return true;
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return true;
      if (octet1 === 192 && octet2 === 168) return true;
      if (octet1 === 169 && octet2 === 254) return true;
      if (octet1 === 100 && octet2 >= 64 && octet2 <= 127) return true;
      if (octet1 >= 224) return true;
    }

    // IPv6 checks (including [::1], fe80::, fd00::, etc.)
    const cleanHost = hostname.replace(/^\[|\]$/g, "");
    if (
      cleanHost === "::1" ||
      cleanHost === "::" ||
      cleanHost.startsWith("fe80:") ||
      cleanHost.startsWith("fc00:") ||
      cleanHost.startsWith("fd00:")
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting: max 12 ping requests per minute per IP
  const rateLimitRes = applyRateLimit(req, "tool_ping", 12, 60 * 1000);
  if (rateLimitRes) return rateLimitRes;

  // 2. CSRF Origin validation
  if (!validateCsrf(req)) {
    return NextResponse.json({ error: "Forbidden: Cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { targetUrl } = await req.json();

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json({ error: "Target URL or hostname is required" }, { status: 400 });
    }

    let urlToFetch = targetUrl.trim();
    if (!urlToFetch.startsWith("http://") && !urlToFetch.startsWith("https://")) {
      urlToFetch = `https://${urlToFetch}`;
    }

    // Strict SSRF protection check
    if (isBlockedTarget(urlToFetch)) {
      return NextResponse.json(
        { error: "Access denied: Internal or private network destinations cannot be queried." },
        { status: 403 }
      );
    }

    const startTime = performance.now();
    let response: Response;
    try {
      response = await fetch(urlToFetch, {
        method: "GET",
        headers: {
          "User-Agent": "ABECSA-Uptime-Inspector/1.0 (+https://abecsa.in)",
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch (fetchErr: any) {
      const duration = Math.round(performance.now() - startTime);
      return NextResponse.json({
        success: true,
        targetUrl: urlToFetch,
        isUp: false,
        latencyMs: duration,
        status: 0,
        statusText: fetchErr.name === "TimeoutError" ? "Connection Timed Out (>8000ms)" : fetchErr.message || "Unreachable",
        sslValid: false,
        health: "DOWN",
        timestamp: new Date().toISOString(),
      });
    }

    const duration = Math.round(performance.now() - startTime);

    const headersObj: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      if (["server", "content-type", "cache-control", "x-powered-by"].includes(key.toLowerCase())) {
        headersObj[key] = val;
      }
    });

    const isUp = response.status >= 200 && response.status < 400;
    const health = !isUp ? "DEGRADED" : duration < 250 ? "EXCELLENT" : duration < 600 ? "GOOD" : "DEGRADED";

    return NextResponse.json({
      success: true,
      targetUrl: urlToFetch,
      isUp: true,
      latencyMs: duration,
      status: response.status,
      statusText: response.statusText || "OK",
      sslValid: urlToFetch.startsWith("https://"),
      headers: headersObj,
      health,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return safeErrorResponse(error, "Ping execution failed");
  }
}
