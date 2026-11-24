import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Award, Users2, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <PublicNavbar />

      <section className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            ENGINEERING CULTURE & FOUNDATION
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">
            About ABECSA Software Solutions
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            Founded with a singular mission: to provide growing enterprises with high-caliber software engineering, high uptime, and full operational transparency through our proprietary Client Management Portal.
          </p>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Zero Technical Debt</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We enforce strict TypeScript typings, relational database constraints, automated test suites, and audited security architectures on every project.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Radical Client Visibility</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our clients track sprint milestones, inspect daily work progress, download quotations, and test live staging builds directly through their dedicated Customer Portal.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Enterprise SLA Standards</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We deliver projects backed by 99.9% uptime commitments, automated daily database backups, and rapid engineering support response times.
            </p>
          </div>
        </div>

        {/* Leadership Details */}
        <div className="mt-16 bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-8">
          <div className="relative h-20 w-52 shrink-0">
            <Image src="/logo.png" alt="ABECSA" fill className="object-contain" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Headquartered in Bengaluru Tech Corridor</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Operating out of Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100. Registered under the Companies Act. Our senior engineering leads bring experience across FinTech, Supply Chain, Healthcare, and Cloud Infrastructure.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
