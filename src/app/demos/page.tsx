"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Monitor,
  Smartphone,
  Eye,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Filter,
  Layers,
  MessageSquare,
  X,
  Play,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

interface DemoItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  techStack: string[];
  keyFeatures: string[];
  previewUrl: string;
  metrics: string;
}

const demosCatalog: DemoItem[] = [
  {
    id: "demo-ecom",
    title: "NovaStore Omnichannel E-Commerce Suite",
    category: "E-Commerce & Retail",
    tagline: "High-speed storefront with 1-click UPI & automated dispatch",
    description: "Production demo of a multi-category modern e-commerce storefront featuring instant search, cart drawer, Razorpay checkout, product filters, and real-time stock sync.",
    techStack: ["Next.js 16", "React 19", "Tailwind CSS", "PostgreSQL", "Razorpay"],
    keyFeatures: [
      "Sub-100ms instant product search & variant selectors",
      "UPI QR, NetBanking, Cards & Cash on Delivery",
      "Automated WhatsApp order confirmation & tracking dispatch",
      "Admin inventory management & revenue reports"
    ],
    previewUrl: "/shop",
    metrics: "98 Lighthouse Speed Score • 60fps Native Animations"
  },
  {
    id: "demo-hospital",
    title: "PulseCare Multi-Branch Hospital & Clinic ERP",
    category: "Healthcare",
    tagline: "Digital OPD, doctor scheduling, electronic prescription & pharmacy",
    description: "Complete clinical workflow system demo showcasing patient token queuing, doctor consultation notes, pharmacy inventory dispensing, and multi-department billing.",
    techStack: ["React", "TypeScript", "Node.js", "Prisma", "PostgreSQL"],
    keyFeatures: [
      "Live OPD queue counter with token display",
      "Digital prescription writing with standard medication dosage",
      "Pharmacy barcode scanning & stock expiry alerts",
      "Multi-branch insurance claim & cash counter receipts"
    ],
    previewUrl: "/customer",
    metrics: "12,000+ Daily Patient Capacity • Zero Lag"
  },
  {
    id: "demo-logistics",
    title: "AeroFleet GPS Telemetry & Warehouse Dispatch",
    category: "Logistics & Fleet",
    tagline: "Live vehicle GPS tracking, geofence alerts & trip manifests",
    description: "Enterprise supply chain demonstration showcasing real-time vehicle movement, temperature telemetry, consignment handoffs, and proof-of-delivery signatures.",
    techStack: ["Next.js", "WebSockets", "TimescaleDB", "Leaflet Maps", "Docker"],
    keyFeatures: [
      "Live GPS fleet map with route replay & speed graphs",
      "Automated e-way bill verification & trip manifest generation",
      "Driver mobile dispatch app with signature capture",
      "Automated fuel expense & maintenance logs"
    ],
    previewUrl: "/projects",
    metrics: "45 Depots Synchronized • 32% Faster Turnaround"
  },
  {
    id: "demo-school",
    title: "EduCampus School & College Operating System",
    category: "Education & LMS",
    tagline: "Fee management, biometric attendance, report cards & parent app",
    description: "Educational ERP demo allowing administrators to collect tuition fees online, generate CBSE/ICSE report cards, track teacher timetables, and send attendance SMS.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind", "jsPDF"],
    keyFeatures: [
      "Online fee collection with partial installment tracking",
      "Automated report card computation & PDF generator",
      "Biometric RFID student attendance sync with WhatsApp alerts",
      "Exam timetable & teacher substitution planner"
    ],
    previewUrl: "/customer",
    metrics: "5,000+ Students Supported • 100% Paperless"
  },
  {
    id: "demo-pos",
    title: "BistroTouch Restaurant POS & Cloud Kitchen Display",
    category: "Restaurant & POS",
    tagline: "Table QR ordering, kitchen display system (KDS) & thermal billing",
    description: "Touch point-of-sale demonstration for restaurants, breweries, and food franchises. Supports table layouts, split checks, captain handheld terminals, and inventory.",
    techStack: ["React", "Node.js", "SQLite", "Tailwind", "WebSockets"],
    keyFeatures: [
      "Visual floor plan with real-time table occupancy status",
      "Kitchen Display Screen (KDS) with color-coded preparation timers",
      "Contactless QR code customer digital menu",
      "Thermal ESC/POS printing for quick checkout"
    ],
    previewUrl: "/shop",
    metrics: "Instant Kitchen Routing • Offline-Resilient"
  },
  {
    id: "demo-invoicing",
    title: "LedgerPro GST Invoicing & Client Collaboration Vault",
    category: "Finance & Invoicing",
    tagline: "Automated 18% GST invoices, quote approvals & vector PDFs",
    description: "Full demonstration of our proprietary billing engine: itemized quotation generator, customer electronic signoff, partial payment receipts, and high-res vector PDFs.",
    techStack: ["Next.js 16", "TypeScript", "Tailwind", "jsPDF", "Canvas Confetti"],
    keyFeatures: [
      "Itemized line items with dynamic 18% GST calculation",
      "Customer 1-click quotation approval with celebratory confetti",
      "Partial payment ledger tracking with remaining balance due",
      "Downloadable print-ready vector PDFs with official QR code"
    ],
    previewUrl: "/login",
    metrics: "Used Daily Across ABECSA OS • 100% Verified"
  }
];

export default function DemosPage() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [activeDemoModal, setActiveDemoModal] = useState<DemoItem | null>(null);

  const categories = [
    "ALL",
    "E-Commerce & Retail",
    "Healthcare",
    "Logistics & Fleet",
    "Education & LMS",
    "Restaurant & POS",
    "Finance & Invoicing",
  ];

  const filteredDemos = demosCatalog.filter(
    (d) => selectedCategory === "ALL" || d.category === selectedCategory
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* Hero Header */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 sm:pt-16 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200">
              <Monitor className="w-3.5 h-3.5" />
              <span>Interactive Enterprise Demo Showcase</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Live Software & Website Demos
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Explore working demos of custom software built by ABECSA. Filter by your industry, test real workflows, and request an identical or customized deployment.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demos Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDemos.map((demo) => (
            <div
              key={demo.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl hover:border-sky-300 transition-all p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category & Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                    {demo.category}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Sandbox
                  </span>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {demo.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {demo.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {demo.description}
                </p>

                {/* Key Features */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Core Capabilities:
                  </span>
                  {demo.keyFeatures.map((f, fi) => (
                    <div key={fi} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Performance Metric */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-semibold text-slate-700">
                  ⚡ {demo.metrics}
                </div>

                {/* Tech Stack Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {demo.techStack.map((tech, ti) => (
                    <span
                      key={ti}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-5 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveDemoModal(demo)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Demo</span>
                </button>

                <a
                  href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20am%20interested%20in%20a%20solution%20similar%20to%20your%20demo:%20"${encodeURIComponent(demo.title)}".%20Please%20share%20timeline%20and%20pricing.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>Request Build</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Demo Inspector Modal */}
      {activeDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">
                  {activeDemoModal.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {activeDemoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDemoModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p className="text-sm font-medium text-slate-800">
                {activeDemoModal.tagline}
              </p>
              <p>{activeDemoModal.description}</p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Architecture & Security:</span>
                <p className="text-slate-600">
                  Built on ABECSA Enterprise Standard: Dockerized container architecture, Next.js App Router, strict TypeScript type-safety, and PostgreSQL database migrations.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-900 block text-xs">Included Functionality:</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeDemoModal.keyFeatures.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => setActiveDemoModal(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>

              <a
                href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20reviewed%20the%20${encodeURIComponent(activeDemoModal.title)}%20demo%20and%20would%20like%20a%20commercial%20quote%20for%20my%20business.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Request Custom Build on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
