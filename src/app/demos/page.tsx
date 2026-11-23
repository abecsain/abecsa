"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Monitor,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Filter,
  Layers,
  MessageSquare,
  X,
  Play,
  Smartphone,
  Cpu,
  Search,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

interface DemoItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  techStack: string | string[];
  keyFeatures: string | string[];
  previewUrl: string;
  imageUrl?: string | null;
  metrics?: string | null;
}

export default function DemosPage() {
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<DemoItem | null>(null);

  useEffect(() => {
    fetchDemos();
  }, []);

  const fetchDemos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/demos");
      const data = await res.json();
      if (res.ok && data.demos) {
        setDemos(data.demos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseJsonArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const categories = ["ALL", ...Array.from(new Set(demos.map((d) => d.category)))];

  const filteredDemos = demos.filter((demo) => {
    const matchesCat = activeCategory === "ALL" || demo.category === activeCategory;
    const matchesSearch =
      demo.title.toLowerCase().includes(search.toLowerCase()) ||
      demo.description.toLowerCase().includes(search.toLowerCase()) ||
      demo.tagline.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="py-12 sm:py-18 bg-gradient-to-b from-white via-sky-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Interactive Application Showcase</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
            Live Software Demos & Production Sandboxes
          </h1>

          <p className="text-xs sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Experience our production-grade software architectures firsthand. Inspect responsive UI/UX, test real-time billing calculations, and verify sub-second performance.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search live demos (e.g. POS, E-Commerce, Hospital)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white shadow-2xs"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="pt-3 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-slate-950 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {cat === "ALL" ? "All Demonstrations" : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demos Grid */}
      <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-10 w-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading live demonstrations...</p>
          </div>
        ) : filteredDemos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3 max-w-md mx-auto">
            <Monitor className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Demos Found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or select another category filter.
            </p>
            <button
              onClick={() => {
                setActiveCategory("ALL");
                setSearch("");
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredDemos.map((demo) => {
              const tech = parseJsonArray(demo.techStack);
              const features = parseJsonArray(demo.keyFeatures);

              return (
                <div
                  key={demo.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-sky-300 hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    {/* Demo Card Image Cover (Mobile-Optimized) */}
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      {demo.imageUrl ? (
                        <Image
                          src={demo.imageUrl}
                          alt={demo.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-sky-950 text-white">
                          <Monitor className="w-12 h-12 text-sky-400/50" />
                        </div>
                      )}

                      {/* Floating Category Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-sky-300 border border-slate-700/80 shadow-md">
                          {demo.category}
                        </span>
                      </div>

                      {/* Live Indicator */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-400 border border-emerald-700/80 text-[10px] font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Live Sandbox</span>
                      </div>

                      {/* Overlay hover launch */}
                      <a
                        href={demo.previewUrl}
                        target={demo.previewUrl.startsWith("http") ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs"
                      >
                        <span className="px-4 py-2 rounded-xl bg-sky-600 shadow-lg flex items-center gap-1.5">
                          <span>Launch Live Demo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </a>
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight group-hover:text-sky-600 transition-colors">
                          {demo.title}
                        </h3>
                        {demo.tagline && (
                          <p className="text-xs font-semibold text-sky-700 mt-0.5">
                            {demo.tagline}
                          </p>
                        )}
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                          {demo.description}
                        </p>
                      </div>

                      {/* Key Features */}
                      {features.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Included Capabilities:
                          </span>
                          <div className="space-y-1 text-xs text-slate-700">
                            {features.slice(0, 3).map((feat, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-tight line-clamp-1">{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tech Stack Pills */}
                      {tech.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {tech.map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Performance Metric Badge */}
                      {demo.metrics && (
                        <div className="p-2.5 rounded-xl bg-sky-50/70 border border-sky-100 text-[11px] font-semibold text-sky-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="truncate">{demo.metrics}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="p-5 sm:p-6 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDemo(demo)}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
                      title="Quick Preview"
                    >
                      <Monitor className="w-3.5 h-3.5 mr-1 text-sky-600" />
                      <span>Details</span>
                    </button>

                    <a
                      href={demo.previewUrl}
                      target={demo.previewUrl.startsWith("http") ? "_blank" : "_self"}
                      rel="noreferrer"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Live Demo</span>
                    </a>

                    <Link
                      href="/solutions"
                      className="py-2.5 px-3 rounded-xl bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center transition-colors"
                      title="Configure Software Solution"
                    >
                      <span>Quote</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Demo Details & Launch Dialog Modal */}
      {selectedDemo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider">
                  {selectedDemo.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-2">
                  {selectedDemo.title}
                </h3>
                <p className="text-xs font-semibold text-sky-700 mt-0.5">
                  {selectedDemo.tagline}
                </p>
              </div>
              <button
                onClick={() => setSelectedDemo(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedDemo.imageUrl && (
              <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                <Image
                  src={selectedDemo.imageUrl}
                  alt={selectedDemo.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedDemo.description}
            </p>

            {/* Key Features */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Included Capabilities:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {parseJsonArray(selectedDemo.keyFeatures).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedDemo(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close Preview
              </button>

              <Link
                href="/solutions"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-800 text-xs font-bold text-center"
              >
                Customize Solution
              </Link>

              <a
                href={selectedDemo.previewUrl}
                target={selectedDemo.previewUrl.startsWith("http") ? "_blank" : "_self"}
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-600/25"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Launch Full Demo Sandbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Custom Demo Consultation CTA */}
      <section className="py-12 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
            NEED A PRIVATE DEMO FOR YOUR BOARD OR TEAM?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            Request a Dedicated Architecture Walkthrough
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Our principal software engineers can deploy a custom staging instance pre-populated with your industry&apos;s real data models within 24 hours.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/solutions"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all"
            >
              Build Your Software Solution
            </Link>
            <a
              href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20would%20like%20to%20schedule%20a%20live%20software%20demonstration%20for%20my%20business."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Book Demo on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
