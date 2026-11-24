import type { Metadata } from "next";
import "./globals.css";
import VisitorTracker from "@/components/public/VisitorTracker";
import AndroidExternalLinks from "@/components/AndroidExternalLinks";

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
      <body className="min-h-full flex flex-col bg-white text-slate-900 relative selection:bg-sky-500 selection:text-white">
        {/* Luminous Ambient Mesh Glows (Brand Cyan, Rose & Violet) */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none" aria-hidden="true">
          {/* Top-Left: Soft Sky / Cyan Aura */}
          <div className="absolute -top-[12%] -left-[10%] w-[60vw] max-w-[700px] h-[60vw] max-h-[700px] rounded-full bg-gradient-to-br from-sky-400/28 via-cyan-300/20 to-transparent blur-[120px]" />
          {/* Top-Right: Soft Violet / Lavender Aura */}
          <div className="absolute -top-[8%] -right-[12%] w-[55vw] max-w-[650px] h-[55vw] max-h-[650px] rounded-full bg-gradient-to-bl from-purple-400/26 via-violet-300/18 to-transparent blur-[130px]" />
          {/* Bottom-Left: Soft Rose / Pink Aura */}
          <div className="absolute top-[35%] -left-[12%] w-[55vw] max-w-[650px] h-[55vw] max-h-[650px] rounded-full bg-gradient-to-tr from-pink-400/25 via-rose-300/16 to-transparent blur-[130px]" />
          {/* Bottom-Right: Soft Indigo / Violet Aura */}
          <div className="absolute top-[70%] -right-[10%] w-[50vw] max-w-[600px] h-[50vw] max-h-[600px] rounded-full bg-gradient-to-tl from-indigo-300/22 via-purple-200/16 to-transparent blur-[120px]" />
        </div>
        <AndroidExternalLinks />
        {children}
        <VisitorTracker />
      </body>
    </html>
  );
}
