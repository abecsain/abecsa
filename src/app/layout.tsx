import type { Metadata } from "next";
import "./globals.css";
import VisitorTracker from "@/components/public/VisitorTracker";

export const metadata: Metadata = {
  title: "ABECSA Software Solutions | Enterprise Software & Client Management",
  description:
    "ABECSA Software Solutions - Custom Web Applications, Enterprise ERP, Mobile Apps, AI Engineering, and Client Management Portal.",
  icons: {
    icon: "/logo.png",
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
