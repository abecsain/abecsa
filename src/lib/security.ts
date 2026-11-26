import { NextRequest, NextResponse } from "next/server";

// ==========================================
// 1. IN-MEMORY SLIDING WINDOW RATE LIMITER
// ==========================================
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// Clean up stale buckets every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of rateLimitStore.entries()) {
      if (bucket.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Checks sliding-window rate limit for a given key
 * @param key unique identifier (e.g. IP, IP+route, or user ID)
 * @param maxRequests maximum allowed requests within window
 * @param windowMs window duration in milliseconds (default: 60s)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSecs: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetInSecs: Math.ceil(windowMs / 1000) };
  }

  bucket.count += 1;
  const resetInSecs = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0, resetInSecs };
  }

  return { allowed: true, remaining: maxRequests - bucket.count, resetInSecs };
}

/**
 * Helper to rate limit an API route by client IP
 */
export function applyRateLimit(
  req: NextRequest,
  actionKey: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000
): NextResponse | null {
  const clientIp = getClientIp(req);
  const key = `${actionKey}_${clientIp}`;
  const result = checkRateLimit(key, maxRequests, windowMs);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: `Too many requests. Rate limit exceeded. Try again in ${result.resetInSecs} seconds.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetInSecs),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

// ==========================================
// 2. CORS & CSRF RESTRICTIONS
// ==========================================
export const ALLOWED_ORIGINS = [
  "https://abecsa.in",
  "https://www.abecsa.in",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
];

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Direct same-origin or curl/mobile requests without Origin header
  return ALLOWED_ORIGINS.includes(origin);
}

export function validateCsrf(req: NextRequest): boolean {
  // Safe read-only HTTP methods do not require CSRF origin validation
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return true;
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (origin) {
    return isAllowedOrigin(origin);
  }

  if (referer) {
    try {
      const parsed = new URL(referer);
      return isAllowedOrigin(parsed.origin);
    } catch {
      return false;
    }
  }

  // Same-site request without origin/referer
  return true;
}

// ==========================================
// 3. FILE UPLOAD & ASSET SECURITY
// ==========================================
export const ALLOWED_FILE_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".svg",
  ".gif",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".csv",
  ".txt",
  ".zip",
  ".apk",
];

export const FORBIDDEN_FILE_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".php",
  ".phtml",
  ".pl",
  ".py",
  ".cgi",
  ".js",
  ".jsp",
  ".vbs",
  ".scr",
  ".msi",
  ".ps1",
  ".com",
  ".dll",
  ".so",
];

export function isSafeFilename(fileName: string): boolean {
  if (!fileName || typeof fileName !== "string") return false;
  const clean = fileName.trim().toLowerCase();

  // Block directory traversal attempts
  if (clean.includes("..") || clean.includes("/") || clean.includes("\\")) {
    return false;
  }

  // Explicitly block any executable extension
  for (const ext of FORBIDDEN_FILE_EXTENSIONS) {
    if (clean.endsWith(ext)) {
      return false;
    }
  }

  // Check allowlist
  return ALLOWED_FILE_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

export function isSafeFileUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim().toLowerCase();

  // Reject dangerous protocols
  if (
    clean.startsWith("javascript:") ||
    clean.startsWith("data:text/html") ||
    clean.startsWith("data:application/") ||
    clean.startsWith("vbscript:")
  ) {
    return false;
  }

  // Allow relative URLs, HTTPS URLs, or HTTP (in non-prod)
  return clean.startsWith("/") || clean.startsWith("https://") || (process.env.NODE_ENV !== "production" && clean.startsWith("http://"));
}

// ==========================================
// 4. SANITIZED API RESPONSES
// ==========================================
export function safeErrorResponse(
  error: any,
  defaultMessage: string = "An error occurred while processing your request",
  status: number = 500
): NextResponse {
  // Never expose raw database schema, file paths, or stack traces in production
  const isDev = process.env.NODE_ENV !== "production";
  console.error("API Security Log:", error);

  let userMessage = defaultMessage;
  if (isDev && error?.message) {
    userMessage = error.message;
  }

  return NextResponse.json(
    {
      success: false,
      error: userMessage,
    },
    { status }
  );
}
