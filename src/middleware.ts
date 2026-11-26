import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "abecsa_session";

async function getEdgeJwtSecret(): Promise<string> {
  const direct = process.env.JWT_SECRET?.trim();
  if (direct) return direct;

  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.DATABASE_URL?.trim();
  if (seed) {
    const encoder = new TextEncoder();
    const kdfKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode("abecsa-jwt-key-derivation-v1"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", kdfKey, encoder.encode(seed));
    return Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  if (process.env.NODE_ENV !== "production") {
    return "abecsa-enterprise-jwt-dev-only-secret-2026";
  }

  return "";
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  return toBase64Url(encoder.encode(str));
}

// Cryptographically signs HMAC-SHA256 JWT using Edge-compatible Web Crypto API
async function signJwtToken(payload: Record<string, any>): Promise<string> {
  const secret = await getEdgeJwtSecret();
  if (!secret) throw new Error("JWT secret not configured");

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const headerB64 = stringToBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  const signatureB64 = toBase64Url(signature);

  return `${headerB64}.${payloadB64}.${signatureB64}`;
}

// Cryptographically verifies HMAC-SHA256 signature using Edge-compatible Web Crypto API
async function verifyAndDecodeToken(token: string) {
  try {
    const secret = await getEdgeJwtSecret();
    if (!secret) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const sigBytes = base64UrlToUint8Array(signatureB64);
    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);

    const isValid = await crypto.subtle.verify("HMAC", cryptoKey, sigBytes as unknown as BufferSource, dataToVerify);
    if (!isValid) return null;

    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    // Reject expired tokens
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

const ALLOWED_ORIGINS = [
  "https://abecsa.in",
  "https://www.abecsa.in",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const origin = req.headers.get("origin");

  // Handle CORS Preflight for APIs
  if (pathname.startsWith("/api/")) {
    if (req.method === "OPTIONS") {
      const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin);
      const preflight = new NextResponse(null, { status: 204 });
      if (isAllowed && origin) {
        preflight.headers.set("Access-Control-Allow-Origin", origin);
        preflight.headers.set("Access-Control-Allow-Credentials", "true");
        preflight.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        preflight.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-visitor-token, x-requested-with");
        preflight.headers.set("Access-Control-Max-Age", "86400");
      }
      return applySecurityHeaders(preflight);
    }
  }

  // Protect internal role workspaces
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/engineer") ||
    pathname.startsWith("/customer");

  // Sliding Session constants
  const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60; // 604,800 seconds
  const REFRESH_THRESHOLD_SECONDS = 6 * 24 * 60 * 60; // Refresh JWT token when < 6 days remain

  if (!isProtectedPath) {
    const res = NextResponse.next();
    if (origin && ALLOWED_ORIGINS.includes(origin) && pathname.startsWith("/api/")) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
    }

    // Rolling session: if logged in and visiting any public page within 7 days, refresh session
    const publicToken = req.cookies.get(COOKIE_NAME)?.value;
    if (publicToken) {
      const publicPayload = await verifyAndDecodeToken(publicToken);
      if (publicPayload && publicPayload.userId) {
        const nowSec = Math.floor(Date.now() / 1000);
        const secondsRemaining = (publicPayload.exp || 0) - nowSec;
        let activeToken = publicToken;

        if (secondsRemaining < REFRESH_THRESHOLD_SECONDS) {
          try {
            activeToken = await signJwtToken({
              userId: publicPayload.userId,
              email: publicPayload.email,
              role: publicPayload.role,
              name: publicPayload.name,
              impersonatedRole: publicPayload.impersonatedRole,
              iat: nowSec,
              exp: nowSec + SEVEN_DAYS_SECONDS,
            });
          } catch {
            activeToken = publicToken;
          }
        }

        res.cookies.set(COOKIE_NAME, activeToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: SEVEN_DAYS_SECONDS,
          path: "/",
        });
      }
    }

    return applySecurityHeaders(res);
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Cryptographic signature and expiration check
  const payload = await verifyAndDecodeToken(token);
  if (!payload || !payload.userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    const redirectRes = NextResponse.redirect(loginUrl);
    // Invalidate invalid/tampered cookie
    redirectRes.cookies.delete(COOKIE_NAME);
    return applySecurityHeaders(redirectRes);
  }

  const effectiveRole =
    payload.role === "ADMIN" && payload.impersonatedRole
      ? payload.impersonatedRole
      : payload.role;

  // Strict route permission verification:
  if (pathname.startsWith("/admin")) {
    if (effectiveRole !== "ADMIN" && payload.role !== "ADMIN") {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
    }
  } else if (pathname.startsWith("/manager")) {
    if (effectiveRole !== "MANAGER" && payload.role !== "ADMIN") {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
    }
  } else if (pathname.startsWith("/engineer")) {
    if (effectiveRole !== "ENGINEER" && payload.role !== "ADMIN") {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
    }
  } else if (pathname.startsWith("/customer")) {
    if (effectiveRole !== "CUSTOMER" && payload.role !== "ADMIN") {
      return applySecurityHeaders(NextResponse.redirect(new URL("/login", req.url)));
    }
  }

  const res = NextResponse.next();

  // Sliding Session Window: Refresh 7-day expiration so active users are never logged out
  const nowSec = Math.floor(Date.now() / 1000);
  const secondsRemaining = (payload.exp || 0) - nowSec;
  let activeToken = token;

  if (secondsRemaining < REFRESH_THRESHOLD_SECONDS) {
    try {
      activeToken = await signJwtToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
        impersonatedRole: payload.impersonatedRole,
        iat: nowSec,
        exp: nowSec + SEVEN_DAYS_SECONDS,
      });
    } catch {
      activeToken = token;
    }
  }

  res.cookies.set(COOKIE_NAME, activeToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SEVEN_DAYS_SECONDS,
    path: "/",
  });

  return applySecurityHeaders(res);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
