"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Smartphone,
  Layers,
  Cloud,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Send,
  Zap,
  Clock,
  ExternalLink,
  Phone,
  Building2,
  Truck,
  Stethoscope,
  UtensilsCrossed,
  ShoppingBag,
  GraduationCap,
  Receipt,
  Bot,
  Laptop,
  Check,
  Lock,
  FileText,
  Users,
  Award,
  HelpCircle,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "WEB" | "MOBILE" | "ERP" | "WHATSAPP" | "PRODUCTS">("ALL");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Proposal / Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    serviceInterested: "Custom Web Application",
    budgetRange: "₹2,50,000 - ₹5,00,000",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          companyName: leadForm.name ? `${leadForm.name}'s Enterprise` : "Direct Inquiry",
          preferredContact: "WHATSAPP",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || "Failed to submit request.");
      }
    } catch {
      setErrorMsg("Network error. Please try again or chat with us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  // Company Overview Pillars
  const companyPillars = [
    {
      icon: Code2,
      title: "Bespoke Engineering",
      badge: "Custom Code",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      description: "Tailor-made web applications, client portals, SaaS architectures, and cloud APIs built from the ground up for your specific business workflow.",
    },
    {
      icon: Smartphone,
      title: "Mobile App Development",
      badge: "iOS & Android",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      description: "High-performance native-feel cross-platform apps with offline local database caching, background sync, biometrics, and GPS telemetry.",
    },
    {
      icon: Layers,
      title: "Enterprise ERP & CRM",
      badge: "Operations OS",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Complete business operating systems: automated GST invoicing, multi-warehouse inventory, staff attendance, and client collaboration vaults.",
    },
    {
      icon: Bot,
      title: "Automated WhatsApp Sync",
      badge: "Zero API Fees",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "Headless WhatsApp Web integration powered by Baileys. Send POS receipts, GST bills, and overdue payment reminders (तकादा) automatically.",
    },
  ];

  // Comprehensive Services Catalog
  const comprehensiveServices = [
    {
      id: "web-apps",
      category: "WEB",
      icon: Code2,
      badge: "Sub-Second Latency",
      badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
      title: "Custom Web Applications & SaaS Platforms",
      tagline: "Ultra-fast Next.js, React, and Node.js solutions engineered for high concurrency.",
      description:
        "We build scalable web portals, SaaS platforms, and enterprise dashboards. Every application is optimized for sub-second page loads, role-based access control (RBAC), and bank-grade data security.",
      deliverables: [
        "Full-Stack Next.js (App Router), React & TypeScript architecture",
        "Granular Role-Based Access Control (Admin, Manager, Staff, Customer)",
        "PostgreSQL / SQLite database modeling & optimized indexing",
        "GST-compliant invoicing & automatic PDF generation",
        "Payment gateways: Razorpay, Stripe, UPI, Bank Transfer",
        "Responsive, mobile-first design with modern Tailwind styling",
      ],
      idealFor: "Startups, SaaS Founders, Corporate Portals, Digital Marketplaces",
      typicalTimeline: "3 to 6 Weeks",
      startingPrice: "₹2,50,000",
    },
    {
      id: "mobile-apps",
      category: "MOBILE",
      icon: Smartphone,
      badge: "iOS & Android",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      title: "Cross-Platform Mobile App Engineering",
      tagline: "Universal iOS and Android apps with 60fps animations & offline sync.",
      description:
        "We build clean, fluid cross-platform mobile apps using React Native and Flutter. Designed for smooth animations, background telemetry, push notifications, and seamless app store releases.",
      deliverables: [
        "Universal iOS & Android codebase with native-feel UI/UX",
        "Offline-first local SQLite caching & background sync engine",
        "Biometric authentication (Fingerprint, FaceID)",
        "Real-time GPS tracking, telemetry & geofencing",
        "Push notifications, Firebase Cloud Messaging, SMS OTP",
        "Complete Google Play Store & Apple App Store publishing",
      ],
      idealFor: "Field Operations, Logistics Drivers, Fintech, E-Commerce, Consumer Apps",
      typicalTimeline: "4 to 8 Weeks",
      startingPrice: "₹4,00,000",
    },
    {
      id: "erp-crm",
      category: "ERP",
      icon: Layers,
      badge: "Most Popular",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Enterprise Custom ERP & CRM Operating Systems",
      tagline: "Centralized automation for invoicing, inventory, HR, and customer workflows.",
      description:
        "Replace fragmented spreadsheets with a centralized, enterprise-grade operating system. Manage dispatch pipelines, multi-warehouse inventory, staff attendance, GST filing, and client contracts in one cockpit.",
      deliverables: [
        "Multi-branch, multi-department role segregation & audit trails",
        "Automated GST Tax Invoicing, E-Way bills & payment tracking",
        "Warehouse inventory, stock alerts & barcode scanning",
        "HR attendance tracking, leave workflows & payroll logs",
        "Client collaboration vault with granular confidentiality toggles",
        "Dedicated Manager cockpit & engineer sprint task Kanban",
      ],
      idealFor: "Manufacturing, Logistics, Healthcare Clinics, Wholesale & Supply Chain",
      typicalTimeline: "6 to 12 Weeks",
      startingPrice: "₹7,50,000",
    },
    {
      id: "whatsapp-automation",
      category: "WHATSAPP",
      icon: Bot,
      badge: "Baileys Multi-Device",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      title: "Automated WhatsApp Multi-Device Sync & Bots",
      tagline: "Send POS bills, invoices, and payment reminders (तकादा) on WhatsApp automatically.",
      description:
        "Connect directly via headless Baileys WebSocket protocol without paid per-message API fees. Dual-mode pairing via QR scan or 8-digit mobile code, backed by persistent cloud database synchronization.",
      deliverables: [
        "Automated POS bill & Tax Invoice delivery with PDF attachments",
        "1-Click payment reminder (तकादा) with balance & UPI payment links",
        "30-second in-memory deduplication cache to prevent duplicate alerts",
        "8-digit pairing code generation: link on mobile with zero camera needed",
        "Cloud database session persistence (never expires across server restarts)",
        "Android WebView bridge compatibility for native APK execution",
      ],
      idealFor: "Retail Shops, Distributors, Service Companies, Billing Desks",
      typicalTimeline: "1 to 2 Weeks",
      startingPrice: "₹1,20,000",
    },
    {
      id: "software-products",
      category: "PRODUCTS",
      icon: ShoppingBag,
      badge: "Turnkey & Source Code",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      title: "Turnkey Software Products & Source Code Shop",
      tagline: "Ready-to-deploy, white-label enterprise software with full commercial code ownership.",
      description:
        "Skip months of development with our pre-built, battle-tested software products. Includes 100% source code, self-hosted deployment scripts, lifetime commercial license, and optional customization.",
      deliverables: [
        "PulseCare: Hospital, Clinic & Pharmacy Management ERP",
        "AeroFleet: GPS Telemetry, Fleet Tracking & Dispatch System",
        "NovaStore: Omnichannel Multi-Store E-Commerce Suite",
        "BistroTouch: Restaurant POS, Kitchen Display & Table Ordering",
        "LedgerPro: GST Billing, Client Collaboration & Asset Vault",
        "EduCampus: College & School ERP with Fee Management",
      ],
      idealFor: "Enterprises, Agency Resellers, Hospital Chains, Fleet Operators",
      typicalTimeline: "Ready in 24 - 48 Hours",
      startingPrice: "₹85,000 (One-Time)",
    },
    {
      id: "cloud-devops",
      category: "WEB",
      icon: Cloud,
      badge: "24/7 SLA Support",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      title: "Cloud Infrastructure, DevOps & 24/7 Maintenance",
      tagline: "Zero-downtime AWS, Vercel & Docker deployments with enterprise SLA.",
      description:
        "Keep your mission-critical applications fast, secure, and always accessible. We manage container orchestration, automated database backups, SSL provisioning, and continuous vulnerability patching.",
      deliverables: [
        "AWS, Vercel, DigitalOcean & Docker container orchestration",
        "Daily automated database backups & disaster recovery drills",
        "SSL certification, firewall configuration & DDoS mitigation",
        "Continuous performance monitoring & sub-100ms API latency tuning",
        "Dedicated Delivery Manager & direct WhatsApp engineering channel",
        "99.9% Uptime Service Level Agreement (SLA) guarantee",
      ],
      idealFor: "Growing Tech Startups, High-Volume E-Commerce, Regulated Businesses",
      typicalTimeline: "Ongoing / Retainer",
      startingPrice: "₹45,000 / Month",
    },
  ];

  // Industry Verticals
  const industries = [
    {
      icon: Stethoscope,
      title: "Healthcare & Clinics",
      desc: "Patient OPD/IPD registers, doctor rostering, electronic health records (EHR), automated lab report delivery, and pharmacy billing.",
    },
    {
      icon: Truck,
      title: "Logistics & Transport",
      desc: "Real-time GPS vehicle tracking, fuel consumption logs, driver trip sheets, e-way bill generation, and automated delivery notifications.",
    },
    {
      icon: ShoppingBag,
      title: "Retail & Distribution",
      desc: "Multi-branch stock sync, barcode scanning, POS counter billing, customer credit passbooks, and WhatsApp tax invoices.",
    },
    {
      icon: UtensilsCrossed,
      title: "Hospitality & Dining",
      desc: "Cloud restaurant POS, Kitchen Display Systems (KDS), contactless QR menus, table reservations, and Swiggy/Zomato consolidation.",
    },
    {
      icon: Building2,
      title: "Manufacturing & Plants",
      desc: "Bill of materials (BOM), shop-floor production stages, raw material replenishment alerts, equipment maintenance, and GST filing.",
    },
    {
      icon: GraduationCap,
      title: "Education & Academies",
      desc: "Student admissions, digital fee collection receipts, exam report cards, teacher attendance registers, and parent WhatsApp updates.",
    },
  ];

  // Turnkey Ready-to-Deploy Products
  const turnkeyProducts = [
    {
      title: "PulseCare Hospital & Clinic ERP",
      category: "Healthcare",
      icon: Stethoscope,
      features: "OPD/IPD Billing, Doctor Rostering, Pharmacy POS, Lab Reports",
      price: "₹1,45,000",
      demoSlug: "/demos",
    },
    {
      title: "AeroFleet GPS Telemetry & Dispatch",
      category: "Logistics",
      icon: Truck,
      features: "Real-time Vehicle Tracking, Fuel Logs, Driver Roster, E-Way Sync",
      price: "₹1,95,000",
      demoSlug: "/demos",
    },
    {
      title: "NovaStore Omnichannel Retail Suite",
      category: "E-Commerce",
      icon: ShoppingBag,
      features: "Multi-Store Inventory, Barcode Scanner, WhatsApp Order Alerts, UPI Checkout",
      price: "₹1,20,000",
      demoSlug: "/demos",
    },
    {
      title: "BistroTouch Restaurant Cloud POS",
      category: "Food & Beverage",
      icon: UtensilsCrossed,
      features: "Kitchen Display (KDS), Table QR Menus, Delivery Aggregator Sync, Daily Sales Book",
      price: "₹85,000",
      demoSlug: "/demos",
    },
  ];

  // 4-Step Lifecycle
  const processSteps = [
    {
      number: "01",
      title: "Scope & Free Architecture Plan",
      description: "We analyze your business workflow, map database structures, and deliver an itemized commercial proposal within 24 hours.",
    },
    {
      number: "02",
      title: "Milestone Sprints & Live Staging",
      description: "Track progress in your private Client Portal. Test live staging sandbox URLs and review code commits every sprint cycle.",
    },
    {
      number: "03",
      title: "Quality Assurance & E-Sign Signoff",
      description: "Rigorous automated and manual testing. Approve deliverables through legal digital signature seals directly on the web portal.",
    },
    {
      number: "04",
      title: "Zero-Downtime Launch & 24/7 SLA",
      description: "We deploy to your private cloud with custom domain, SSL, automated daily backups, and 24/7 technical maintenance.",
    },
  ];

  // FAQ Items
  const faqList = [
    {
      q: "Do I get full commercial ownership of the source code and database?",
      a: "Yes, 100%. Whether we build a custom solution from scratch or you purchase a turnkey product, you receive complete source code, database schemas, and documentation with a perpetual commercial license. No recurring per-user software licensing fees.",
    },
    {
      q: "How does the private Client Portal (/customer) work?",
      a: "From day one, you receive private login credentials to your dedicated Client Portal. There, you can monitor sprint progress percentages, review developer staging links, approve milestone deliverables, download GST tax invoices, and access your confidential file vault.",
    },
    {
      q: "How are milestone payments and legal contracts handled?",
      a: "We work with complete transparency. Every project starts with a formal Master Services Agreement and itemized quotation. Payments are split across milestones (e.g. 30% advance, 40% functional milestone, 30% final signoff). You can review and execute agreements directly on our web portal via digital E-Signature.",
    },
    {
      q: "Can you automate WhatsApp billing and payment reminders without monthly API fees?",
      a: "Yes! Our custom WhatsApp sync engine uses the headless Baileys Multi-Device protocol. You can pair your official business number via QR code or 8-digit mobile code. The server automatically dispatches POS receipts, PDF invoices, and payment reminders (तकादा) directly to customer phones.",
    },
    {
      q: "How fast can my project go live?",
      a: "Turnkey software products (like PulseCare, AeroFleet, NovaStore, BistroTouch) can be deployed with your branding, custom domain, and cloud database within 24 to 48 hours. Custom web or mobile development sprints typically take 2 to 6 weeks depending on scope.",
    },
    {
      q: "Do you offer post-deployment support and AMC maintenance?",
      a: "Absolutely. Every project includes complimentary post-launch warranty support. Additionally, we provide ongoing monthly maintenance covering 24/7 cloud monitoring, 99.9% uptime SLA, daily automated backups, security patching, and on-demand feature upgrades.",
    },
  ];

  const filteredServices =
    activeCategory === "ALL"
      ? comprehensiveServices
      : comprehensiveServices.filter((s) => s.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* =========================================================================
          HERO SECTION (Mobile-First, Generous, Clean, High Contrast, Direct Action)
      ========================================================================= */}
      <section className="relative pt-6 pb-12 sm:pt-14 sm:pb-20 overflow-hidden bg-gradient-to-b from-white via-sky-50/20 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
            
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-sky-50 border border-sky-200/80 text-sky-800 text-[11px] sm:text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Enterprise Software & Digital Product Engineering</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              We Engineer Custom Software That Powers Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                Business Growth
              </span>
            </h1>

            {/* Generous Clear Description */}
            <p className="text-xs sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              ABECSA delivers tailor-made web platforms, cross-platform mobile apps, complete ERP/CRM operating systems, and automated WhatsApp billing engines — with 100% source code ownership, guaranteed 99.9% uptime, and dedicated delivery managers.
            </p>

            {/* Direct 1-Tap CTAs (Optimized for Mobile Touch) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2 max-w-md sm:max-w-none mx-auto">
              <a
                href="#contact"
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 shadow-md shadow-slate-950/10 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Request Project Proposal</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20am%20interested%20in%20discussing%20a%20software%20project%20for%20my%20business."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>

              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 shadow-xs transition-all active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Client & Staff Login</span>
              </Link>
            </div>

            {/* Direct Phone Assistance Bar */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Need immediate consultation? Call us directly:</span>
              <a href="tel:+919876543210" className="text-slate-900 font-bold underline hover:text-sky-600">
                +91 98765 43210
              </a>
            </div>

            {/* Live Trust Metrics Grid (2x2 on mobile, 4-col on desktop) */}
            <div className="pt-6 sm:pt-8 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 border-t border-slate-200/80 mt-6 text-left">
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-600 font-black text-lg sm:text-2xl">
                  <span>45+</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-0.5">Systems Deployed</div>
                <div className="text-[10px] text-slate-400">Production-ready releases</div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-sky-600 font-black text-lg sm:text-2xl">
                  <span>99.9%</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-0.5">Uptime SLA</div>
                <div className="text-[10px] text-slate-400">High-availability cloud</div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-indigo-600 font-black text-lg sm:text-2xl">
                  <span>100%</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-0.5">Code Ownership</div>
                <div className="text-[10px] text-slate-400">Zero recurring vendor lock-in</div>
              </div>

              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/70 shadow-xs">
                <div className="flex items-center gap-2 text-amber-500 font-black text-lg sm:text-2xl">
                  <span>24 Hrs</span>
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-0.5">Fast Proposals</div>
                <div className="text-[10px] text-slate-400">Itemized cost roadmap</div>
              </div>
            </div>

          </div>

          {/* Interactive Portal Preview Mockup */}
          <div className="mt-8 sm:mt-12 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white p-2.5 sm:p-4 shadow-xl">
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs text-white">
              {/* Window Header */}
              <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="ml-2 font-mono text-slate-400 text-[10px] sm:text-[11px]">abecsa.site/cockpit</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] sm:text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Enterprise OS Live</span>
                </div>
              </div>

              {/* 3 Perspectives */}
              <div className="p-3 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                      Client Portal (`/customer`)
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white mt-1">Live Sprints & Invoices</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Approve milestones, view staging links, download GST tax invoices, and access private files.
                    </p>
                  </div>
                  <Link
                    href="/customer"
                    className="mt-3 text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <span>Inspect Client View</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Operations (`/manager`)
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white mt-1">Manager Cockpit</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Lead pipeline, WhatsApp Web gateway, squad assignments, and real-time client notice broadcast.
                    </p>
                  </div>
                  <Link
                    href="/manager"
                    className="mt-3 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>View Operations</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Engineering (`/engineer`)
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white mt-1">Sprint Kanban Board</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Task specification criteria, PR review submissions, work hour logging, and staging deployments.
                    </p>
                  </div>
                  <Link
                    href="/engineer"
                    className="mt-3 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <span>View Sprint Board</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: AT A GLANCE - WHO WE ARE & WHAT WE DO (NEW VISITOR GUIDE)
      ========================================================================= */}
      <section className="py-10 sm:py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              AT A GLANCE
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Why Forward-Thinking Businesses Choose ABECSA
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We bridge the gap between creative product design, battle-tested full-stack engineering, and business operating transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {companyPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-white text-sky-600 flex items-center justify-center border border-slate-200 shadow-2xs">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pillar.badgeColor}`}>
                        {pillar.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-950">{pillar.title}</h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {pillar.description}
                      </p>
                    </div>
                  </div>

                  <a
                    href="#services"
                    className="pt-2 text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 border-t border-slate-200/60"
                  >
                    <span>Learn more</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: COMPREHENSIVE SERVICES CATALOG (MOBILE CATEGORY PILLS)
      ========================================================================= */}
      <section className="py-12 sm:py-20 bg-slate-50" id="services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              OUR SERVICES & ENGINEERING CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              What We Build, Deliver & Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every digital solution is custom-architected with enterprise-grade standards, clean documentation, strict security, and complete source code ownership.
            </p>

            {/* Mobile Category Filter Bar */}
            <div className="pt-3 flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
              {[
                { id: "ALL", label: "All Capabilities" },
                { id: "WEB", label: "Web & SaaS" },
                { id: "MOBILE", label: "Mobile Apps" },
                { id: "ERP", label: "Custom ERP & CRM" },
                { id: "WHATSAPP", label: "WhatsApp Automation" },
                { id: "PRODUCTS", label: "Turnkey Products" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCategory(tab.id as any)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === tab.id
                      ? "bg-slate-950 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service Cards Grid (1 col on mobile, 2 cols on tablet/desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-7">
            {filteredServices.map((svc) => {
              const Icon = svc.icon;
              return (
                <div
                  key={svc.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs hover:border-sky-300 hover:shadow-lg transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Top Row: Icon + Badge + Starting Price */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs shrink-0">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${svc.badgeColor}`}>
                          {svc.badge}
                        </span>
                        <span className="text-xs font-black text-slate-900">
                          From {svc.startingPrice}
                        </span>
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-950">
                        {svc.title}
                      </h3>
                      <p className="text-xs font-semibold text-sky-700 mt-0.5">
                        {svc.tagline}
                      </p>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {svc.description}
                      </p>
                    </div>

                    {/* Feature Deliverables Checklist */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Included Deliverables:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 text-xs">
                        {svc.deliverables.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Timeline + Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700">Sprint Timeline:</span>{" "}
                      <span>{svc.typicalTimeline}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20would%20like%20to%20consult%20about%20${encodeURIComponent(
                          svc.title
                        )}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href="#contact"
                        onClick={() =>
                          setLeadForm((prev) => ({
                            ...prev,
                            serviceInterested: svc.title,
                          }))
                        }
                        className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>Get Quote</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: TURNKEY SOFTWARE SHELF (/demos & /shop)
      ========================================================================= */}
      <section className="py-12 sm:py-18 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
                TURNKEY SOFTWARE SHELF
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Pre-Built Enterprise Systems Ready to Launch
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Need software live this week? Buy turnkey software packages with complete source code, self-hosted deployment, and zero recurring seat fees.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/demos"
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <span>Live Demos</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/shop"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <span>Software Shop</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {turnkeyProducts.map((prod, i) => {
              const Icon = prod.icon;
              return (
                <div
                  key={i}
                  className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-white text-sky-600 flex items-center justify-center border border-slate-200">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {prod.category}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{prod.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        {prod.features}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Commercial Code</span>
                      <span className="text-xs font-black text-slate-900">{prod.price}</span>
                    </div>

                    <Link
                      href={prod.demoSlug}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>Try Demo</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: INDUSTRIES WE TRANSFORM (REAL-WORLD WORKFLOWS)
      ========================================================================= */}
      <section className="py-12 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              DOMAIN EXPERTISE
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Software Tailored to Your Specific Industry
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We understand that every sector requires specific regulatory compliance, hardware integration, and workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {industries.map((ind, i) => {
              const Icon = ind.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 hover:shadow-md transition-all space-y-3"
                >
                  <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{ind.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {ind.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: HOW WE WORK (4-STEP PROVEN SPRINT LIFECYCLE)
      ========================================================================= */}
      <section className="py-12 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              OUR PROVEN METHODOLOGY
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              From Concept to Production in 4 Transparent Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              No black boxes. No surprises. You have real-time visibility and approval authority at every single milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {processSteps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 shadow-xs relative flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="text-2xl font-black text-sky-600 font-mono">
                    {step.number}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step {idx + 1} of 4
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: THE ABECSA ADVANTAGE (CLIENT PORTAL TRANSPARENCY)
      ========================================================================= */}
      <section className="py-12 sm:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
                COMPLETE TRANSPARENCY
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Track Every Sprint & Milestone in Your Private Client Portal
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Unlike traditional agencies where development is a black box, ABECSA provides every client with an authenticated portal (`/customer`). You have real-time visibility from day one.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Live Sprint Progress & Deliverable Links:</span>
                    <span className="text-slate-500 text-[11px]">Inspect real-time developer commits, test sandbox preview URLs, and approve milestones.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Instant Invoicing & Quotation Signoffs:</span>
                    <span className="text-slate-500 text-[11px]">Review itemized quotes, download GST-compliant tax invoice PDFs, and verify payment receipts.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="h-6 w-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Confidential Shared Vault:</span>
                    <span className="text-slate-500 text-[11px]">Secure file storage with granular privacy toggles (`Confidential`, `Visible to Everyone`, `Assigned Customer Only`).</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/customer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold transition-all shadow-xs"
                >
                  <span>Explore Client Portal Experience</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Portal Architecture Illustration Card */}
            <div className="lg:col-span-6 bg-slate-900 text-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-sky-400">ABECSA Operating System Architecture</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                  Live RBAC Active
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Central Executive Admin</span>
                      <span className="text-[10px] text-slate-400">Total company control, invoices, HR & CRM audits</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">/admin</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Project Delivery Manager</span>
                      <span className="text-[10px] text-slate-400">Client coordination, sprint allocation, WhatsApp Web gateway</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">/manager</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Code2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Software Engineer Workspace</span>
                      <span className="text-[10px] text-slate-400">Sprint Kanban, code reviews, staging URLs & work logs</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">/engineer</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Enterprise Customer Portal</span>
                      <span className="text-[10px] text-slate-400">Milestone progress %, invoice settlement, private vault</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-700/60 px-2 py-0.5 rounded">/customer</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)
      ========================================================================= */}
      <section className="py-12 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8 sm:mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              FREQUENT QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Everything You Need to Know
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Answers to top questions regarding source code ownership, milestones, WhatsApp bots, and cloud maintenance.
            </p>
          </div>

          <div className="space-y-3">
            {faqList.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/60 transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-900 cursor-pointer hover:bg-slate-100/60 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-sky-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: CONTACT & PROPOSAL INQUIRY FORM (MOBILE-FIRST)
      ========================================================================= */}
      <section className="py-12 sm:py-20 bg-slate-50" id="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-10 shadow-2xl border border-slate-800">
            
            <div className="max-w-xl mx-auto text-center space-y-2 mb-6 sm:mb-8">
              <span className="text-xs font-black uppercase tracking-widest text-sky-400 block">
                START YOUR PROJECT
              </span>
              <h2 className="text-xl sm:text-3xl font-black tracking-tight">
                Request an Itemized Project Proposal
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Tell us about your requirements. Our software architecture team will analyze your goals and share a detailed breakdown within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl text-center space-y-3 animate-in fade-in">
                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">Thank You! Your Request is Logged.</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  A dedicated Delivery Manager has received your specifications and will follow up shortly with a customized software proposal.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    Send Another Inquiry
                  </button>
                  <a
                    href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20just%20submitted%20a%20project%20inquiry%20on%20your%20website."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open WhatsApp Chat Directly</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3.5 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@enterprise.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Service Category Required
                    </label>
                    <select
                      value={leadForm.serviceInterested}
                      onChange={(e) => setLeadForm({ ...leadForm, serviceInterested: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="Custom Web Application">Custom Web Application / SaaS</option>
                      <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                      <option value="Enterprise Custom ERP & CRM">Enterprise Custom ERP & CRM</option>
                      <option value="Automated WhatsApp Engine & Bots">Automated WhatsApp Engine & Bots</option>
                      <option value="Turnkey Software Product Purchase">Turnkey Software Product Purchase</option>
                      <option value="Cloud Infrastructure & Maintenance">Cloud Infrastructure & Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Requirements or Specific Goals
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you would like to build, key features, target timeline..."
                    value={leadForm.message}
                    onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none font-sans"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-sky-500/20 active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? "Transmitting..." : "Submit Project Inquiry"}</span>
                  </button>

                  <a
                    href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20want%20to%20discuss%20a%20new%20software%20project%20directly."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Direct WhatsApp Chat</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          MOBILE STICKY BOTTOM QUICK ACTION BAR (Visible only on mobile sm:hidden)
      ========================================================================= */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2 shadow-2xl border border-slate-800 flex items-center justify-between gap-1.5 animate-in slide-in-from-bottom duration-300">
        <a
          href="#contact"
          className="flex-1 py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Get Quote</span>
        </a>

        <a
          href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20would%20like%20to%20consult%20about%20a%20software%20project."
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold text-center flex items-center justify-center gap-1 shadow-xs"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href="tel:+919876543210"
          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold text-center flex items-center justify-center gap-1 border border-slate-700"
        >
          <Phone className="w-3.5 h-3.5 text-sky-400" />
          <span>Call</span>
        </a>
      </div>

      <PublicFooter />
    </div>
  );
}