"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Receipt,
  Users,
  FolderGit2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState<{
    metrics: {
      totalRevenue: number;
      pendingPayments: number;
      totalInvoiced: number;
      customersCount: number;
      leadsCount: number;
      totalProjects: number;
      activeProjects: number;
      completedProjects: number;
      overdueProjects: number;
      employeesCount: number;
    };
    statusDistribution: Record<string, number>;
    serviceDistribution: Record<string, number>;
    recentPayments: Array<{
      id: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      customer: { companyName: string };
      invoice: { invoiceNumber: string };
    }>;
    recentAuditLogs: Array<{
      id: string;
      action: string;
      details: string;
      createdAt: string;
      user: { name: string; role: string } | null;
    }>;
    recentTickets: Array<{
      id: string;
      ticketNumber: string;
      subject: string;
      priority: string;
      status: string;
      customer: { companyName: string };
    }>;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.metrics) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Activity className="w-5 h-5 animate-spin text-sky-600" />
          <span>Aggregating Enterprise Financial & Operational Data...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalRevenue: 0,
    pendingPayments: 0,
    totalInvoiced: 0,
    customersCount: 0,
    leadsCount: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    employeesCount: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Executive Operations Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business telemetry, client accounts, financial collections, and project delivery status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </Link>
          <Link
            href="/admin/quotations"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </Link>
          <Link
            href="/admin/whatsapp"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Console</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Collected Revenue</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">Verified</span> against bank & UPI deposits
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Pending Receivables</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {formatCurrency(metrics.pendingPayments)}
          </p>
          <div className="text-[11px] text-slate-500">
            From active milestone invoices
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active Projects</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <FolderGit2 className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics.activeProjects}
            <span className="text-xs font-normal text-slate-400 ml-1">
              / {metrics.totalProjects} Total
            </span>
          </p>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            <span>{metrics.completedProjects} Completed to Date</span>
          </div>
        </div>

        {/* Clients & Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Corporate Clients</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics.customersCount}
            <span className="text-xs font-normal text-slate-400 ml-1">
              Active Portals
            </span>
          </p>
          <div className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
            <Link href="/admin/crm" className="hover:underline flex items-center gap-0.5">
              <span>{metrics.leadsCount} Open Leads in CRM Pipeline</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Payments & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Payment Collections</h2>
            </div>
            <Link
              href="/admin/invoices"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <span>Manage Invoices</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentPayments && data.recentPayments.length > 0 ? (
              data.recentPayments.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{p.customer?.companyName || "Direct Client"}</p>
                    <p className="text-[11px] text-slate-400">
                      Invoice: {p.invoice?.invoiceNumber} • {p.paymentMethod} • {formatDate(p.paymentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600 text-sm">
                      +{formatCurrency(p.amount)}
                    </span>
                    <span className="block text-[10px] text-emerald-700 font-semibold">Verified</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No payment records found.</p>
            )}
          </div>
        </div>

        {/* Project Service Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Active Service Portfolio</h2>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Live Breakdown</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.serviceDistribution &&
              Object.entries(data.serviceDistribution).map(([category, count]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate max-w-[200px]">{category}</span>
                    <span className="font-bold text-slate-900">{count} Projects</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (count / (metrics.totalProjects || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Overdue Warning */}
          {metrics.overdueProjects > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>{metrics.overdueProjects} Project(s)</strong> require milestone delivery review.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Support Tickets & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Support Tickets */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Active Client Tickets</h2>
            </div>
            <Link
              href="/admin/tickets"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentTickets && data.recentTickets.length > 0 ? (
              data.recentTickets.map((t) => (
                <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{t.ticketNumber}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          t.priority === "HIGH" || t.priority === "URGENT"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-slate-600 truncate max-w-xs mt-0.5">{t.subject}</p>
                    <p className="text-[10px] text-slate-400">{t.customer.companyName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">All customer tickets resolved.</p>
            )}
          </div>
        </div>

        {/* Real-time Audit Trail */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">System Activity Audit Trail</h2>
            </div>
            <Link
              href="/admin/audit"
              className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
            >
              <span>Full Audit Logs</span>
              <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
              data.recentAuditLogs.map((log) => (
                <div key={log.id} className="py-2.5 text-xs flex items-start justify-between gap-3">
                  <div>
                    <span className="font-semibold text-slate-800">{log.action}</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-slate-400">
                      By: {log.user?.name || "System"} ({log.user?.role || "AUTO"})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-slate-400">No activity logged.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
