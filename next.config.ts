import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    "/**": ["./prisma/dev.db", "./dev.db"],
  },
};

export default nextConfig;
