"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Globe,
  Search,
  CheckCircle2,
  Gift,
  ShieldCheck,
  Zap,
  ArrowRight,
  MessageSquare,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

interface DomainResult {
  extension: string;
  price: number;
  isFreeEligible: boolean;
  status: "AVAILABLE" | "POPULAR";
  renewalPrice: number;
}

export default function DomainsPage() {
  const [searchTerm, setSearchTerm] = useState("mycompany");
  const [searchedName, setSearchedName] = useState("mycompany");

  const extensions: DomainResult[] = [
    {
      extension: ".in",
      price: 499,
      renewalPrice: 599,
      isFreeEligible: true,
      status: "POPULAR",
    },
    {
      extension: ".com",
      price: 899,
      renewalPrice: 999,
      isFreeEligible: false,
      status: "AVAILABLE",
    },
    {
      extension: ".co.in",
      price: 399,
      renewalPrice: 499,
      isFreeEligible: true,
      status: "AVAILABLE",
    },
    {
      extension: ".org",
      price: 999,
      renewalPrice: 1099,
      isFreeEligible: false,
      status: "AVAILABLE",
    },
    {
      extension: ".store",
      price: 299,
      renewalPrice: 699,
      isFreeEligible: true,
      status: "POPULAR",
    },
    {
      extension: ".net",
      price: 849,
      renewalPrice: 949,
      isFreeEligible: false,
      status: "AVAILABLE",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchTerm.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (clean) {
      setSearchedName(clean);
    }
  };

  const getWhatsAppRegistrationLink = (ext: string, isFree: boolean) => {
    const fullDomain = `${searchedName}${ext}`;
    const text = isFree
      ? `Hello ABECSA Team! I would like to claim the FREE domain offer for "${fullDomain}" with an annual software/hosting package. Please assist me.`
      : `Hello ABECSA Team! I want to register the domain name "${fullDomain}". Please share availability and payment details.`;
    return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 sm:pt-16 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200">
              <Globe className="w-3.5 h-3.5" />
              <span>ABECSA Domain Registrar & DNS Manager</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Domain Registration & Free Domain Bundles
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Find your brand&apos;s digital identity. Get a 100% free domain with any ABECSA annual software solution, or register standalone premium domains with instant DNS setup.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                <input
                  type="text"
                  required
                  placeholder="Enter your company or brand name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/20"
              >
                <span>Search Domains</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Free Domain Highlight Banner */}
          <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-800">
                  SPECIAL ENTERPRISE OFFER
                </span>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  Get a <span className="font-bold text-slate-900">100% FREE .in or .co.in domain</span> with any ABECSA Software, Website, or Cloud package. Includes free SSL & DNS!
                </p>
              </div>
            </div>

            <a
              href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20want%20to%20claim%20the%20FREE%20Domain%20Offer%20with%20a%20software%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-auto cursor-pointer shadow-xs"
            >
              Claim Free Domain
            </a>
          </div>
        </div>
      </section>

      {/* Domain Results Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Availability Results for &ldquo;<span className="text-sky-600">{searchedName}</span>&rdquo;
          </h2>
          <p className="text-xs text-slate-500">
            All registrations include free SSL certificates, automated DNS configuration, and corporate email forwarding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {extensions.map((ext, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-6 border shadow-xs flex flex-col justify-between transition-all ${
                ext.isFreeEligible
                  ? "border-amber-300 ring-2 ring-amber-100"
                  : "border-slate-200 hover:border-sky-300"
              }`}
            >
              <div className="space-y-4">
                {/* Top Extension Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-slate-900">
                      {searchedName}
                    </span>
                    <span className="text-xl font-black text-sky-600">
                      {ext.extension}
                    </span>
                  </div>

                  {ext.isFreeEligible ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      FREE Available
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      Available
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {ext.isFreeEligible && (
                    <div className="text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      <span>₹0 with any ABECSA Software Package</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      ₹{ext.price}
                    </span>
                    <span className="text-xs text-slate-500">/ 1st Year</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      Renews at ₹{ext.renewalPrice}/yr
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Free Let&apos;s Encrypt SSL Certificate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Free DNS Records (A, CNAME, MX, TXT)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Instant WhatsApp Setup Assistance</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                {ext.isFreeEligible && (
                  <a
                    href={getWhatsAppRegistrationLink(ext.extension, true)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Claim FREE with Software</span>
                  </a>
                )}

                <a
                  href={getWhatsAppRegistrationLink(ext.extension, false)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Register Domain via WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Value Proposition Cards */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2">
            <Lock className="w-6 h-6 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">Domain Privacy Shield</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keep your contact details hidden from spammers and public WHOIS crawlers with free private masking.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <h4 className="text-sm font-bold text-slate-900">Ultra-Fast Global DNS</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Anycast DNS cluster ensures your domain resolves with sub-20ms latency worldwide with 100% uptime.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-2">
            <Mail className="w-6 h-6 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Corporate Email Forwarding</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create professional addresses like contact@yourdomain.in and automatically route them to your inbox.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
