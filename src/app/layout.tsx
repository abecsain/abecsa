import type { Metadata } from "next";
import "./globals.css";
import VisitorTracker from "@/components/public/VisitorTracker";

export const metadata: Metadata = {
  title: "ABECSA",
  description:
    "ABECSA Software Solutions - Custom Web Applications, Enterprise ERP, Mobile Apps, AI Engineering, and Client Management Portal.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
      { url: "/logo-a.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
        <VisitorTracker />
      </body>
    </html>
  );
}
