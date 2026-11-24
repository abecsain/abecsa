import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Globe, ShieldCheck, ShoppingBag, Monitor, Activity } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Company Bio */}
          <div className="lg:col-span-2 space-y-4">
            <div className="h-10 w-44">
              <Image
                src="/logo-white.png"
                alt="ABECSA Software Solutions"
                width={176}
                height={40}
                className="h-10 w-auto object-contain"
                unoptimized
              />
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              ABECSA Software Solutions is an enterprise software engineering company. We build custom web applications, mobile apps, ERP platforms, ready-to-deploy software packages, and provide 24/7 cloud support.
            </p>
            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ministry of Corporate Affairs Registered Enterprise</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>ISO 9001:2015 Quality & ISO 27001 Data Security Certified</span>
              </div>
            </div>
          </div>

          {/* Software & Products */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Products & Demos
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors text-emerald-400 font-semibold">
                  Software Shop (Buy Code)
                </Link>
              </li>
              <li>
                <Link href="/demos" className="hover:text-white transition-colors text-sky-400 font-semibold">
                  Live Demos Showcase
                </Link>
              </li>
              <li>
                <Link href="/domains" className="hover:text-white transition-colors text-amber-400 font-semibold">
                  Free & Paid Domains
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-white transition-colors">
                  Server Ping & Health Check
                </Link>
              </li>
              <li>
                <Link href="/tools" className="hover:text-white transition-colors">
                  GST & Tax Invoice Tool
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions & Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Company & Portal
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/solutions" className="hover:text-white transition-colors text-sky-400 font-semibold">
                  Software Catalog & Builder
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition-colors">
                  Engineering Services & Pricing
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Case Studies & Sprints
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About ABECSA
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Request Commercial Quote
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors font-bold text-sky-400">
                  Client & Staff Portal Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Corporate Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Registered Office
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                <a href="mailto:Abecsa.in@gmail.com" className="hover:text-white">
                  Abecsa.in@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href="https://wa.me/919407899216?text=Hello%20ABECSA!%20I%20have%20an%20inquiry."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 font-medium"
                >
                  +91 94078 99216 (WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                <span>abecsa.in</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ABECSA Software Solutions. Enterprise Business Operating Platform.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/domains" className="hover:text-slate-400">Domains</Link>
            <span>•</span>
            <Link href="/shop" className="hover:text-slate-400">Shop</Link>
            <span>•</span>
            <Link href="/demos" className="hover:text-slate-400">Demos</Link>
            <span>•</span>
            <Link href="/tools" className="hover:text-slate-400">Ping Utilities</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
