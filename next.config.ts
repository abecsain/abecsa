import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheMaxMemorySize: 10 * 1024 * 1024, // 10 MB in-memory cache limit for low-memory environments (Render 512MB)
  experimental: {
    cpus: 1, // Restrict build concurrency to 1 worker so Render 512MB RAM is never exceeded
    workerThreads: false,
    webpackMemoryOptimizations: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "@whiskeysockets/baileys", "pino"],
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com; frame-ancestors 'self'; block-all-mixed-content; upgrade-insecure-requests;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
