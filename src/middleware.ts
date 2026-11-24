import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "abecsa_session";
const JWT_SECRET = process.env.JWT_SECRET || "abecsa-enterprise-jwt-super-secret-key-2026";

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

// Cryptographically verifies HMAC-SHA256 signature using Edge-compatible Web Crypto API
async function verifyAndDecodeToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_SECRET);
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect internal role workspaces
  const isProtectedPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/engineer") ||
    pathname.startsWith("/customer");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cryptographic signature and expiration check
  const payload = await verifyAndDecodeToken(token);
  if (!payload || !payload.userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const effectiveRole =
    payload.role === "ADMIN" && payload.impersonatedRole
      ? payload.impersonatedRole
      : payload.role;

  // Strict route permission verification:
  if (pathname.startsWith("/admin")) {
    if (effectiveRole !== "ADMIN" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } else if (pathname.startsWith("/manager")) {
    if (effectiveRole !== "MANAGER" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } else if (pathname.startsWith("/engineer")) {
    if (effectiveRole !== "ENGINEER" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } else if (pathname.startsWith("/customer")) {
    if (effectiveRole !== "CUSTOMER" && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/manager/:path*",
    "/engineer/:path*",
    "/customer/:path*",
  ],
};
