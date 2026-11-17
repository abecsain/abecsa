"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Shield, Check, RefreshCw } from "lucide-react";

interface RoleSwitcherProps {
  currentRole: string; // "ADMIN" | "MANAGER" | "ENGINEER" | "CUSTOMER"
  actualRole: string;
}

export default function RoleSwitcher({ currentRole, actualRole }: RoleSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  // Strictly only show if actual user is ADMIN
  if (actualRole !== "ADMIN") return null;

  const roles = [
    { key: "ADMIN", label: "Admin Console", path: "/admin" },
    { key: "MANAGER", label: "View as Manager", path: "/manager" },
    { key: "ENGINEER", label: "View as Engineer", path: "/engineer" },
    { key: "CUSTOMER", label: "View as Customer", path: "/customer" },
  ];

  const handleSwitch = async (targetRole: string) => {
    if (targetRole === currentRole || switching) return;
    setSwitching(true);

    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetRole }),
      });

      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data.error || "Failed to switch role");
        setSwitching(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error switching role");
      setSwitching(false);
    }
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs text-amber-900 z-40">
      <div className="flex items-center gap-2 font-medium">
        <Shield className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-semibold text-amber-700">Admin Impersonation Mode:</span>
        <span className="text-slate-600">Currently operating as</span>
        <span className="bg-amber-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          {currentRole}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
        <Eye className="w-3.5 h-3.5 text-amber-700" />
        <span className="text-slate-500 mr-1 hidden md:inline">Inspect View:</span>
        {roles.map((r) => {
          const isActive = currentRole === r.key;
          return (
            <button
              key={r.key}
              disabled={switching}
              onClick={() => handleSwitch(r.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                isActive
                  ? "bg-amber-600 text-white shadow-xs font-semibold"
                  : "bg-white/80 hover:bg-white text-slate-700 border border-amber-200 hover:border-amber-400"
              }`}
            >
              {isActive && <Check className="w-3 h-3 text-white" />}
              {switching && r.key === currentRole && <RefreshCw className="w-3 h-3 animate-spin" />}
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
