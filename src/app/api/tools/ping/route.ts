import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { targetUrl } = await req.json();

    if (!targetUrl) {
      return NextResponse.json({ error: "Target URL or hostname is required" }, { status: 400 });
    }

    let urlToFetch = targetUrl.trim();
    if (!urlToFetch.startsWith("http://") && !urlToFetch.startsWith("https://")) {
      urlToFetch = `https://${urlToFetch}`;
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
    console.error("Ping inspector error:", error);
    return NextResponse.json({ error: "Ping execution failed" }, { status: 500 });
  }
}
