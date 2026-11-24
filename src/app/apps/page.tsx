"use client";

import React, { useState, useEffect } from "react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import { Download, Smartphone, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Filter } from "lucide-react";

interface AppItem {
  id: string;
  name: string;
  description: string | null;
  version: string;
  category: string;
  iconUrl: string | null;
  apkUrl: string;
  apkFilename: string | null;
  downloadCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function AppsPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/apps");
      const data = await res.json();
      if (data.success && data.apps) {
        setApps(data.apps);
      }
    } catch (err) {
      console.error("Failed to fetch apps:", err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ["ALL", ...Array.from(new Set(apps.map((a) => a.category).filter(Boolean)))];

  const filteredApps = apps.filter((app) => {
    if (selectedCategory === "ALL") return true;
    return app.category === selectedCategory;
  });

  const handleDownload = async (app: AppItem) => {
    try {
      setDownloadingId(app.id);
      const res = await fetch(`/api/apps/${app.id}/download`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.downloadUrl) {
        // Update local state download count
        setApps((prev) =>
          prev.map((a) => (a.id === app.id ? { ...a, downloadCount: data.downloadCount } : a))
        );
        // Trigger download
        window.open(data.downloadUrl, "_blank");
      } else {
        window.open(app.apkUrl, "_blank");
      }
    } catch {
      window.open(app.apkUrl, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold tracking-wide uppercase">
            <Smartphone className="w-3.5 h-3.5 text-sky-600" />
            <span>Official Mobile & Enterprise Apps</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Download ABECSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">Enterprise Apps</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            High-speed mobile applications, POS counter terminals, warehouse scanners, and field utilities built for zero-latency operations.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter by Category:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse space-y-4 h-64" />
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No Apps Found</h3>
            <p className="text-xs text-slate-500">No applications currently listed in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-lg hover:border-sky-300 transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform overflow-hidden">
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.name} className="h-full w-full object-cover" />
                      ) : (
                        <Smartphone className="w-6 h-6" />
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full block">
                        v{app.version}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {app.downloadCount} Downloads
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-widest block">
                      {app.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-950 mt-0.5 group-hover:text-sky-600 transition-colors">
                      {app.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-3">
                      {app.description || "Enterprise mobile client with offline sync & live cloud updates."}
                    </p>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 mt-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Verified APK</span>
                  </div>

                  <button
                    type="button"
                    disabled={downloadingId === app.id}
                    onClick={() => handleDownload(app)}
                    className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingId === app.id ? "Downloading..." : "Download APK"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
