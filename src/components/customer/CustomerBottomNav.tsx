"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  FolderLock,
  FileSpreadsheet,
  Receipt,
  MessageSquare,
  LifeBuoy,
} from "lucide-react";

export default function CustomerBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/customer", label: "Home", icon: LayoutDashboard },
    { href: "/customer/projects", label: "Tracker", icon: FolderGit2 },
    { href: "/customer/vault", label: "Vault", icon: FolderLock },
    { href: "/customer/quotations", label: "Quotes", icon: FileSpreadsheet },
    { href: "/customer/invoices", label: "Invoices", icon: Receipt },
    { href: "/customer/support", label: "Support", icon: LifeBuoy },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 z-50 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[50px] ${
                isActive
                  ? "text-sky-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-sky-600 stroke-[2.2]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
