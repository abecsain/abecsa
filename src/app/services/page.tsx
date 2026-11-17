"use client";

import Link from "next/link";
import { ArrowRight, Check, Code2, Globe, Smartphone, Layers, Cpu, Cloud, ShieldCheck, Sparkles } from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function ServicesPage() {
  const packages = [
    {
      title: "Core Web & MVP Engineering",
      idealFor: "Startups & Mid-size firms launching new SaaS or corporate products",
      timeline: "4 - 8 Weeks",
      startingAt: "₹3,50,000",
      features: [
        "Full-stack Next.js App Router & TypeScript codebase",
        "Responsive, mobile-optimized UI with Tailwind CSS",
        "Secure JWT / Session authentication & RBAC",
        "PostgreSQL database modeling & migrations",
        "Staging preview environment & deployment setup",
        "Complete Client Portal access for milestone signoff",
      ],
    },
    {
      title: "Enterprise Custom ERP & CRM",
      idealFor: "Logistics, Manufacturing, Retail & Healthcare enterprises",
      timeline: "8 - 16 Weeks",
      startingAt: "₹12,50,000",
      popular: true,
      features: [
        "Multi-branch, multi-warehouse entity modeling",
        "Real-time GPS telemetry & automated barcode dispatch",
        "GST E-Way bill generation & automated invoicing",
        "Role-based dashboards (Admin, Managers, Staff, Clients)",
        "Integrated WhatsApp Business Cloud notifications",
        "Dedicated Delivery Manager & SLA guarantee",
      ],
    },
    {
      title: "Cross-Platform Mobile Suites",
      idealFor: "Consumer apps, fintech portfolios, field worker tracking",
      timeline: "6 - 12 Weeks",
      startingAt: "₹6,00,000",
      features: [
        "Universal iOS & Android React Native / Expo codebase",
        "Offline-first local SQLite caching & sync engine",
        "Biometric authentication (FaceID, Fingerprint)",
        "Camera scanning, push notifications, and background location",
        "App Store & Google Play compliance & publishing",
        "Sub-100ms API microservices backend",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />

      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            TRANSPARENT PACKAGES & CAPABILITIES
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
            Enterprise Solutions Tailored to Your Scale
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Every engagement includes senior architecture leadership, itemized milestone pricing, transparent staging environments, and dedicated client management.
          </p>
        </div>
      </section>

      {/* Packages Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <div
              key={pkg.title}
              className={`rounded-2xl bg-white p-8 border flex flex-col justify-between relative transition-all ${
                pkg.popular
                  ? "border-sky-500 shadow-xl ring-2 ring-sky-500/20"
                  : "border-slate-200 shadow-sm"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 right-6 bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  Most Requested
                </div>
              )}

              <div>
                <h3 className="text-2xl font-bold text-slate-900">{pkg.title}</h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">{pkg.idealFor}</p>

                <div className="py-4 border-t border-b border-slate-100 mb-6">
                  <span className="text-xs text-slate-500 block">Starting Investment</span>
                  <span className="text-3xl font-extrabold text-slate-900">{pkg.startingAt}</span>
                  <span className="text-xs text-slate-500 block mt-1">Typical Timeline: {pkg.timeline}</span>
                </div>

                <div className="space-y-3 mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    DELIVERABLES INCLUDED:
                  </span>
                  {pkg.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-700 leading-normal">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/contact?package=${encodeURIComponent(pkg.title)}`}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center transition-all flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? "bg-sky-600 text-white hover:bg-sky-700 shadow-md shadow-sky-600/30"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                <span>Request Detailed Proposal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
