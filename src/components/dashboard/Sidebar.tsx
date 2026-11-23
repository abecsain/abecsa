"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Users,
  Target,
  FileSpreadsheet,
  Receipt,
  FolderLock,
  MessageSquare,
  UserCheck,
  LifeBuoy,
  Settings,
  ShieldAlert,
  Send,
  ListTodo,
  CheckCircle2,
  Clock,
  CalendarCheck,
  Bell,
  LogOut,
  X,
  Activity,
  ShoppingBag,
  Gift,
  Layers,
  Monitor,
} from "lucide-react";

interface SidebarProps {
  role: string; // "ADMIN" | "MANAGER" | "ENGINEER" | "CUSTOMER"
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function DashboardSidebar({
  role,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const getNavLinks = () => {
    switch (role) {
      case "ADMIN":
        return [
          { href: "/admin", label: "Executive Overview", icon: LayoutDashboard },
          { href: "/admin/projects", label: "Projects & Sprints", icon: FolderGit2 },
          { href: "/admin/tasks", label: "Tasks & Sprint Backlog", icon: ListTodo },
          { href: "/admin/users", label: "User Management", icon: Users },
          { href: "/admin/crm", label: "CRM & Lead Pipeline", icon: Target },
          { href: "/admin/solutions", label: "Catalog & Pricing Engine", icon: Layers, highlight: true },
          { href: "/admin/demos", label: "Interactive Demos", icon: Monitor },
          { href: "/admin/quotations", label: "Quotations", icon: FileSpreadsheet },
          { href: "/admin/gifts", label: "Scratch Card Gifts", icon: Gift, highlight: true },
          { href: "/admin/invoices", label: "Invoices & Payments", icon: Receipt },
          { href: "/admin/vault", label: "Asset Vault & Files", icon: FolderLock },
          { href: "/admin/shop", label: "Software Store Admin", icon: ShoppingBag },
          { href: "/admin/whatsapp", label: "Official WhatsApp Web", icon: MessageSquare, badge: "Connected" },
          { href: "/admin/hr", label: "HR & Team Attendance", icon: UserCheck },
          { href: "/admin/tickets", label: "Client Support Tickets", icon: LifeBuoy },
          { href: "/admin/visitors", label: "Visitor & Account Logs", icon: Activity, highlight: true },
          { href: "/admin/settings", label: "Company Configuration", icon: Settings },
          { href: "/admin/audit", label: "Audit Logs", icon: ShieldAlert },
        ];
      case "MANAGER":
        return [
          { href: "/manager", label: "Operations Cockpit", icon: LayoutDashboard },
          { href: "/manager/projects", label: "Assigned Projects", icon: FolderGit2 },
          { href: "/manager/users", label: "Clients & Engineers", icon: Users },
          { href: "/manager/crm", label: "CRM Leads & Pipeline", icon: Target },
          { href: "/manager/push", label: "Push to Client Portal", icon: Send, highlight: true },
          { href: "/manager/gifts", label: "Scratch Card Gifts", icon: Gift, highlight: true },
          { href: "/manager/whatsapp", label: "My WhatsApp Web", icon: MessageSquare, badge: "Active" },
          { href: "/manager/quotations", label: "Quotations", icon: FileSpreadsheet },
          { href: "/manager/invoices", label: "Invoices", icon: Receipt },
          { href: "/manager/vault", label: "Client Vault & Folders", icon: FolderLock },
          { href: "/manager/support", label: "Support Tickets", icon: LifeBuoy },
        ];
      case "ENGINEER":
        return [
          { href: "/engineer", label: "Sprint Workspace", icon: LayoutDashboard },
          { href: "/engineer/tasks", label: "My Tasks & Kanban", icon: ListTodo },
          { href: "/engineer/projects", label: "Assigned Projects", icon: FolderGit2 },
          { href: "/engineer/deliverables", label: "Deliverables & Links", icon: CheckCircle2 },
          { href: "/engineer/logs", label: "Work Log & Hours", icon: Clock },
          { href: "/engineer/attendance", label: "Attendance & Leaves", icon: CalendarCheck },
        ];
      case "CUSTOMER":
        return [
          { href: "/customer", label: "Project Dashboard", icon: LayoutDashboard },
          { href: "/customer/projects", label: "Milestones & Progress", icon: FolderGit2 },
          { href: "/customer/vault", label: "Shared Vault & Mockups", icon: FolderLock },
          { href: "/customer/quotations", label: "Quotations & Proposals", icon: FileSpreadsheet },
          { href: "/customer/invoices", label: "Invoices & Payments", icon: Receipt },
          { href: "/customer/notices", label: "Manager Notice Board", icon: Bell },
          { href: "/customer/support", label: "Support & Changes", icon: LifeBuoy },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo-white.png"
            alt="ABECSA"
            width={140}
            height={36}
            unoptimized
            priority
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Pill */}
      <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          WORKSPACE PERSPECTIVE
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-semibold text-white tracking-wide">
            {role === "ADMIN" && "Super Administrator"}
            {role === "MANAGER" && "Operations & Delivery"}
            {role === "ENGINEER" && "Engineering Execution"}
            {role === "CUSTOMER" && "Enterprise Client"}
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onCloseMobile}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-semibold"
                  : link.highlight
                  ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          <Image src="/logo-white.png" alt="Abecsa" width={16} height={16} className="opacity-80" unoptimized />
          <span>View Public Agency Site</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block shrink-0">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
