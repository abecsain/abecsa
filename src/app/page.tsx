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
  Send,
  Zap,
  Clock,
  ExternalLink,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function HomePage() {
  const [leadForm, setLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    serviceInterested: "Custom Web Application",
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
          companyName: "Direct Inquiry",
          budgetRange: "Standard",
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
      setErrorMsg("Network error. Please try again or chat via WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const coreServices = [
    {
      icon: Code2,
      title: "Web & Enterprise Software",
      desc: "Custom web applications, client portals, and secure internal tools built for speed and reliability.",
      features: ["Next.js & React", "High-Speed APIs", "Role-Based Security"],
    },
    {
      icon: Smartphone,
      title: "Mobile App Development",
      desc: "Fast, modern iOS and Android apps designed for smooth user experience and offline performance.",
      features: ["Cross-Platform", "Push Notifications", "App Store Release"],
    },
    {
      icon: Layers,
      title: "Business ERP & CRM Systems",
      desc: "Centralized management systems for invoicing, project tracking, inventory, and customer workflows.",
      features: ["Automated Invoicing", "Real-Time Tracking", "WhatsApp Alerts"],
    },
    {
      icon: Cloud,
      title: "Cloud & Dedicated Support",
      desc: "Managed cloud hosting, continuous maintenance, data backups, and technical support.",
      features: ["99.9% Uptime", "Automated Backups", "Dedicated Team"],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-100 text-sky-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Enterprise Software & Digital Solutions</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Software Solutions Built for Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">
                Business Growth
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              ABECSA engineers custom software, responsive web applications, mobile apps, and enterprise operating systems to run your business with clarity.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Client & Staff Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                <span>Request a Free Quote</span>
              </a>

              <a
                href="https://wa.me/919876543210?text=Hello%20ABECSA,%20I%20would%20like%20to%20discuss%20a%20software%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Trust Highlights */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>45+ Completed Projects</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Dedicated Project Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Live Client Dashboard</span>
              </div>
            </div>
          </div>

          {/* Interactive Portal Preview Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 shadow-xl">
            <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              {/* Card Window Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
                  <span className="ml-2 font-mono text-slate-500 text-[11px]">abecsa.in/portal</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 font-semibold text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Enterprise OS Live</span>
                </div>
              </div>

              {/* Window Content */}
              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100">
                  <span className="text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                    Customer Portal
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">Live Progress & Invoices</p>
                  <p className="text-xs text-slate-500 mt-0.5">Approve quotes, view sprints & files</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Operations
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">Manager Cockpit</p>
                  <p className="text-xs text-slate-500 mt-0.5">Task boards, WhatsApp Web & delivery</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-100/60 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Engineering
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-1">Sprint Workspace</p>
                  <p className="text-xs text-slate-500 mt-0.5">Kanban, checklist & staging reviews</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-16 md:py-24 bg-white" id="services">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              OUR EXPERTISE
            </span>
            <h2 className="text-3xl font-bold text-slate-900">What We Build</h2>
            <p className="text-sm text-slate-500">
              From web applications to enterprise automation, everything is delivered with clean architecture and strict quality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreServices.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-11 w-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{svc.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{svc.desc}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                    {svc.features.map((f, fi) => (
                      <span
                        key={fi}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Simple Process */}
      <section className="py-16 bg-slate-50 border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              HOW WE WORK
            </span>
            <h2 className="text-3xl font-bold text-slate-900">Simple & Transparent</h2>
            <p className="text-sm text-slate-500">
              Track everything in real-time through your dedicated ABECSA Customer Portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-3xl font-black text-sky-600/30 block">01</span>
              <h4 className="text-base font-bold text-slate-900">Requirement & Quotation</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit your project goals. We provide a detailed, itemized quotation with milestones within 24 hours.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-3xl font-black text-sky-600/30 block">02</span>
              <h4 className="text-base font-bold text-slate-900">Live Sprint Development</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Our squad builds in bi-weekly sprints. Track task progress, check staging previews, and approve milestones online.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-3xl font-black text-sky-600/30 block">03</span>
              <h4 className="text-base font-bold text-slate-900">Launch & Maintenance</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamless production deployment with continuous server monitoring, security updates, and direct WhatsApp support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Contact & Quote Section */}
      <section className="py-16 md:py-24 bg-white" id="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
            <div className="max-w-xl mx-auto text-center space-y-3 mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                GET IN TOUCH
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Request a Project Proposal
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Share your requirements. We will review and provide a tailored plan with estimated budget and timelines.
              </p>
            </div>

            {submitted ? (
              <div className="bg-white text-slate-900 p-8 rounded-2xl text-center space-y-3">
                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold">Thank You! Your Request is Received.</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  A dedicated Project Delivery Manager will contact you shortly via email or WhatsApp.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@company.com"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      WhatsApp / Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="+91 98765 00000"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Service Required
                    </label>
                    <select
                      value={leadForm.serviceInterested}
                      onChange={(e) => setLeadForm({ ...leadForm, serviceInterested: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="Custom Web Application">Custom Web Application</option>
                      <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                      <option value="ERP & Company Management">ERP & Company Management</option>
                      <option value="API & Cloud Infrastructure">API & Cloud Infrastructure</option>
                      <option value="Software Maintenance & Support">Software Maintenance & Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Project Summary (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you would like to build..."
                    value={leadForm.message}
                    onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md shadow-sky-500/20"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? "Sending..." : "Submit Project Inquiry"}</span>
                  </button>

                  <a
                    href="https://wa.me/919876543210?text=Hello%20ABECSA,%20I%20would%20like%20to%20discuss%20a%20software%20project."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-4 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Or Chat on WhatsApp</span>
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
