"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe, Layers, Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function ProjectsPage() {
  const caseStudies = [
    {
      title: "NexaFlow Intelligent Supply Chain & Fleet Telemetry ERP",
      client: "NexaCorp Global Logistics (India / SEA)",
      category: "Enterprise Cloud ERP & Telemetry",
      challenge: "NexaCorp operated 650+ logistics trucks and 45 transit hubs across 8 states using manual paper manifests and phone calls, leading to inaccurate ETAs and billing disputes.",
      solution: "ABECSA engineered a centralized Next.js / Node.js ERP with microservices Kafka telemetry ingestion, Google Maps driver route tracking, automatic barcode parcel dispatch, and instant GST E-Way bill generation.",
      metrics: [
        { label: "Dispatch Efficiency", value: "+38%" },
        { label: "Fuel Route Savings", value: "18% MoM" },
        { label: "Daily Scans", value: "12,000+" },
      ],
      tech: "Next.js 16, TypeScript, Node.js, PostgreSQL, Redis, Kafka, Tailwind CSS",
    },
    {
      title: "FinEdge Next-Gen Mobile Wealth & Algorithmic Advisory Suite",
      client: "FinEdge Capital Solutions Pvt Ltd",
      category: "FinTech & Algorithmic Mobile Application",
      challenge: "High latency on market quotes and clunky KYC onboarding caused 42% user drop-off in retail mobile investment workflows.",
      solution: "Engineered a React Native iOS & Android application backed by high-throughput Go microservices and WebSockets, delivering real-time streaming quotes and 2-minute instant Aadhaar/PAN KYC completion.",
      metrics: [
        { label: "Monthly Volume", value: "₹85Cr+" },
        { label: "API Latency", value: "< 85ms" },
        { label: "KYC Conversion", value: "94.2%" },
      ],
      tech: "React Native, Expo, Go, TimescaleDB, WebSockets, Kafka, Docker",
    },
    {
      title: "OmniRetail AI Real-Time Inventory & Multi-Store Sync",
      client: "Singhania Retailers & Distributors",
      category: "Omnichannel E-Commerce & Inventory Management",
      challenge: "Stockouts and overselling across 45 physical retail outlets and their Shopify Plus storefront due to delayed batch synchronization.",
      solution: "Developed an event-driven webhook orchestrator that syncs barcode scanner POS checkouts with central stock levels in under 500 milliseconds.",
      metrics: [
        { label: "Overselling Reduction", value: "99.8%" },
        { label: "Live Stores", value: "45 Outlets" },
        { label: "Inventory Accuracy", value: "99.9%" },
      ],
      tech: "Next.js, Python, FastAPI, PostgreSQL, Shopify GraphQL, AWS SQS",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />

      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            CASE STUDIES & PORTFOLIO
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
            Mission-Critical Software We&apos;ve Engineered
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Every system built by ABECSA is architected for real enterprise scale, high uptime, and observable operational impact.
          </p>
        </div>
      </section>

      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {caseStudies.map((cs) => (
          <div
            key={cs.title}
            className="rounded-2xl bg-white p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  {cs.category}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-3">{cs.title}</h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">Client: {cs.client}</p>
              </div>

              <div className="flex items-center gap-6 text-center">
                {cs.metrics.map((m) => (
                  <div key={m.label} className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/60">
                    <p className="text-xl font-extrabold text-sky-600">{m.value}</p>
                    <p className="text-[11px] font-medium text-slate-500">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-700">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  THE CHALLENGE:
                </h4>
                <p className="leading-relaxed">{cs.challenge}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-600 mb-2">
                  THE ABECSA ENGINEERING SOLUTION:
                </h4>
                <p className="leading-relaxed">{cs.solution}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-4">
              <span><strong>Technology:</strong> {cs.tech}</span>
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Running in Production with 99.9% SLA</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      <PublicFooter />
    </div>
  );
}
