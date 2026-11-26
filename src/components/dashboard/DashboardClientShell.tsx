"use client";

import { useState } from "react";
import DashboardSidebar from "./Sidebar";
import TopNav from "./TopNav";
import GlobalWhatsAppWidget from "@/components/whatsapp/GlobalWhatsAppWidget";

interface DashboardClientShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    effectiveRole: string;
    actualRole: string;
    jobTitle?: string | null;
  };
  children: React.ReactNode;
}

export default function DashboardClientShell({
  user,
  children,
}: DashboardClientShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100/70 text-slate-900">
      {/* Sidebar (Desktop and Mobile Drawer) */}
      <DashboardSidebar
        role={user.effectiveRole}
        actualRole={user.actualRole}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Global WhatsApp Web Assistant Widget */}
      <GlobalWhatsAppWidget role={user.effectiveRole} />
    </div>
  );
}
