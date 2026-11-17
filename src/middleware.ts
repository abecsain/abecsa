import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

// Basic decoding for Edge middleware (payload extraction)
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
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

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.userId) {
    const loginUrl = new URL("/login", req.url);
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
