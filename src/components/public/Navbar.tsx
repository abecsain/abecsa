"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  Globe,
  Monitor,
  Activity,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative h-8 sm:h-11 w-32 sm:w-40">
              <Image
                src="/logo.png"
                alt="ABECSA Software Solutions"
                fill
                className="object-contain"
                unoptimized
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <Link
              href="/services"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Services
            </Link>
            <Link
              href="/demos"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors flex items-center gap-1.5"
            >
              <span>Live Demos</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-700">
                Interactive
              </span>
            </Link>
            <Link
              href="/shop"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors flex items-center gap-1.5"
            >
              <span>Software Shop</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700">
                Buy Code
              </span>
            </Link>
            <Link
              href="/domains"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Domains
            </Link>
            <Link
              href="/tools"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Ping & Tools
            </Link>
            <Link
              href="/projects"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/contact"
              className="text-xs xl:text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Portal Login</span>
            </Link>

            <Link
              href="/contact?type=quote"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Get a Quote</span>
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-50 text-sky-700 border border-sky-200"
            >
              Portal Login
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 animate-fade-in shadow-xl">
          <nav className="space-y-1 divide-y divide-slate-100 text-xs font-bold text-slate-800">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg"
            >
              <span>Home</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg"
            >
              <span>Services</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/demos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg text-sky-700"
            >
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span>Live Demos Showcase</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                Interactive
              </span>
            </Link>
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg text-emerald-700"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Software Shop</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Buy Code
              </span>
            </Link>
            <Link
              href="/domains"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500" />
                <span>Free & Paid Domains</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Free Offer
              </span>
            </Link>
            <Link
              href="/tools"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Server Ping & Dev Utilities</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg"
            >
              <span>Case Studies & Projects</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-lg"
            >
              <span>Contact Us</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </nav>

          {/* Mobile Bottom CTA Buttons */}
          <div className="pt-2 space-y-2">
            <a
              href="https://wa.me/919876543210?text=Hello%20ABECSA,%20I%20would%20like%20to%20inquire%20about%20your%20software%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Chat Directly on WhatsApp</span>
            </a>

            <Link
              href="/contact?type=quote"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 flex items-center justify-center gap-2 shadow-md shadow-sky-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Request Custom Proposal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
