"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FolderGit2,
  Receipt,
  FileSpreadsheet,
  FolderLock,
  MessageSquare,
  LifeBuoy,
  Bell,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  Download,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CustomerDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerPortal();
  }, []);

  const fetchCustomerPortal = async () => {
    try {
      const [pRes, qRes, iRes, nRes, fRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/quotations"),
        fetch("/api/invoices"),
        fetch("/api/notices"),
        fetch("/api/vault"),
      ]);

      const pData = await pRes.json();
      const qData = await qRes.json();
      const iData = await iRes.json();
      const nData = await nRes.json();
      const fData = await fRes.json();

      if (pData.projects) setProjects(pData.projects);
      if (qData.quotations) setQuotations(qData.quotations);
      if (iData.invoices) setInvoices(iData.invoices);
      if (nData.notices) setNotices(nData.notices);
      if (fData.files) setFiles(fData.files);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const primaryProject = projects[0];
  const assignedManager = primaryProject?.manager || {
    name: "Vikram Malhotra",
    email: "manager@abecsa.in",
    phone: "+919876543211",
  };

  const pendingQuotations = quotations.filter((q) => q.status === "SENT");
  const pendingInvoices = invoices.filter((i) => i.balanceAmount > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Welcome & Assigned Manager Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] uppercase font-bold tracking-widest text-sky-400 bg-sky-950/60 px-3 py-1 rounded-full border border-sky-800/80">
              CLIENT EXECUTIVE PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to Your ABECSA Workspace
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Real-time sprint progress, staging sandboxes, formal proposals, invoices, and direct communication with your dedicated engineering squad.
            </p>
          </div>

          {/* Assigned Manager Card with 1-tap WhatsApp Trigger */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-3 shrink-0 sm:min-w-[260px]">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              YOUR DELIVERY MANAGER
            </span>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-md">
                {assignedManager.name.charAt(0)}
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">{assignedManager.name}</p>
                <p className="text-[11px] text-slate-300">Operations & Delivery</p>
              </div>
            </div>

            <a
              href={`https://wa.me/${assignedManager.phone?.replace(/[^0-9]/g, "")}?text=Hi%20${encodeURIComponent(
                assignedManager.name
              )},%20I%20have%20an%20update%20regarding%20our%20project.`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Message Manager on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Pushed Notice Board Alerts (Priority Notice) */}
      {notices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-sky-600" />
              <span>Manager Notice Board ({notices.length})</span>
            </h3>
            <Link href="/customer/notices" className="text-xs text-sky-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-2">
            {notices.slice(0, 2).map((notice) => (
              <div
                key={notice.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{notice.title}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                        notice.priority === "IMPORTANT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {notice.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{notice.message}</p>
                </div>

                {notice.actionUrl && (
                  <a
                    href={notice.actionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 shrink-0"
                  >
                    <span>{notice.actionLabel || "Inspect Sandbox"}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Project Card */}
      {primaryProject && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase">
                {primaryProject.projectId} • {primaryProject.serviceCategory}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{primaryProject.name}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
              {primaryProject.status}
            </span>
          </div>

          {/* Progress Bar & Milestone stats */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Overall Sprint Completion</span>
              <span className="text-sky-600 font-bold text-base">{primaryProject.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${primaryProject.progress}%` }}
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Target Delivery: <strong className="text-slate-800">{formatDate(primaryProject.deliveryDate)}</strong></span>
              {primaryProject.stagingUrl && (
                <a
                  href={primaryProject.stagingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Interactive Staging Sandbox</span>
                </a>
              )}
            </div>

            <Link
              href="/customer/projects"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all"
            >
              <span>View Milestone Tracker</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Two Column Grid: Pending Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Quotations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Quotations & Proposals</h3>
            </div>
            <Link href="/customer/quotations" className="text-xs text-sky-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {quotations.map((q) => (
              <div key={q.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{q.title}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      q.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {q.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{q.quotationNumber}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(q.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Billing & Tax Invoices</h3>
            </div>
            <Link href="/customer/invoices" className="text-xs text-sky-600 font-semibold hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{inv.invoiceNumber}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      inv.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Balance Due:</span>
                  <span className="font-bold text-rose-600">{formatCurrency(inv.balanceAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
