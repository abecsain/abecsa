"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Smartphone,
  Monitor,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  PhoneCall,
  Mail,
  UserCheck,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface PageViewItem {
  id: string;
  path: string;
  pageTitle: string | null;
  referrer: string | null;
  createdAt: string;
}

interface VisitorSessionItem {
  id: string;
  visitorToken: string;
  userId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  landingPage: string | null;
  pageViewCount: number;
  loginCount: number;
  deviceType: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    jobTitle: string | null;
  } | null;
  pageViews: PageViewItem[];
}

export default function AdminVisitorsPage() {
  const [sessions, setSessions] = useState<VisitorSessionItem[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalPageViews: 0,
    totalCapturedLeads: 0,
    totalLogins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "LEADS_ONLY" | "USERS_ONLY">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/track?filter=${filterType}`);
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchName = (s.name || s.user?.name || "").toLowerCase().includes(q);
    const matchPhone = (s.phone || "").toLowerCase().includes(q);
    const matchEmail = (s.email || s.user?.email || "").toLowerCase().includes(q);
    const matchToken = s.visitorToken.toLowerCase().includes(q);
    const matchPath = (s.landingPage || "").toLowerCase().includes(q);
    return matchName || matchPhone || matchEmail || matchToken || matchPath;
  });

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const getWhatsAppContactLink = (s: VisitorSessionItem) => {
    const phone = s.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const name = s.name || s.user?.name || "Client";
    const text = `Hello ${name}! Thank you for visiting ABECSA Software Solutions (abecsa.in). I am reaching out regarding your software inquiry. How may we assist you today?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-sky-50 text-sky-600">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Visitor Tracking & User Account Logs
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Audit trail of how many times accounts have logged in, every page traversed, and captured website visitor contact details.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Live Logs</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Tracked Visitors
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {stats.totalSessions}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Unique browser sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
            Account Logins Recorded
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {stats.totalLogins}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Successful auth events</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
            Total Pages Traversed
          </span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 block">
            {stats.totalPageViews}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Route navigation clicks</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
            Captured Leads / Phones
          </span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 block">
            {stats.totalCapturedLeads}
          </span>
          <span className="text-[11px] text-emerald-700 mt-0.5 block font-semibold">
            Ready for WhatsApp contact
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            All Logs ({sessions.length})
          </button>
          <button
            onClick={() => setFilterType("LEADS_ONLY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "LEADS_ONLY"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            Captured Leads Only
          </button>
          <button
            onClick={() => setFilterType("USERS_ONLY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === "USERS_ONLY"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            }`}
          >
            Registered Accounts Only
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name, phone, email, token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Sessions & Account Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((s) => {
              const isExpanded = expandedSessionId === s.id;
              const isUser = !!s.user;
              const hasContact = !!s.phone || !!s.email;

              return (
                <div key={s.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: User / Visitor Identity */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUser ? (
                          <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                            {s.user?.name}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                              {s.user?.role}
                            </span>
                          </span>
                        ) : hasContact ? (
                          <span className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {s.name || "Captured Visitor Lead"}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Lead Captured
                            </span>
                          </span>
                        ) : (
                          <span className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-slate-400" />
                            Anonymous Visitor
                            <span className="text-[10px] font-mono font-normal text-slate-400">
                              ({s.visitorToken.substring(0, 10)}...)
                            </span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          {s.deviceType === "Mobile" ? (
                            <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Monitor className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{s.deviceType || "Desktop"}</span>
                        </span>

                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          IP: {s.ipAddress || "127.0.0.1"}
                        </span>
                      </div>

                      {/* Contact Details Line */}
                      <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                        {s.phone && (
                          <span className="flex items-center gap-1 font-semibold text-emerald-700">
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{s.phone}</span>
                          </span>
                        )}
                        {(s.email || s.user?.email) && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{s.email || s.user?.email}</span>
                          </span>
                        )}
                        {s.landingPage && (
                          <span className="text-slate-500 text-[11px]">
                            Landed on: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">{s.landingPage}</code>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Counts & Badges */}
                    <div className="flex items-center gap-4 text-xs shrink-0">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[70px]">
                        <span className="text-[10px] text-slate-400 font-bold block">Logins</span>
                        <span className="text-sm font-black text-sky-600">
                          {s.loginCount} times
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center min-w-[70px]">
                        <span className="text-[10px] text-slate-400 font-bold block">Pages Visited</span>
                        <span className="text-sm font-black text-indigo-600">
                          {s.pageViewCount} pages
                        </span>
                      </div>

                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 block font-bold">Last Active</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {formatDateTime(s.lastActiveAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      {s.phone && (
                        <a
                          href={getWhatsAppContactLink(s)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Chat with lead on WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 fill-white" />
                          <span>WhatsApp Lead</span>
                        </a>
                      )}

                      <button
                        onClick={() => toggleExpand(s.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? "Hide Trail" : "View Trail"}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Breadcrumb Trail */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/80 rounded-xl p-4 space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-200">
                        <span>Page Navigation Trail (Chronological Breadcrumbs)</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {s.pageViews?.length || 0} page hits logged
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto">
                        {s.pageViews && s.pageViews.length > 0 ? (
                          s.pageViews.map((pv, i) => (
                            <div
                              key={pv.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-slate-100"
                            >
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-slate-400 text-[10px] w-4">{i + 1}.</span>
                                <span className="font-semibold text-sky-700">{pv.path}</span>
                                {pv.pageTitle && (
                                  <span className="text-[10px] text-slate-400 font-sans truncate max-w-xs">
                                    ({pv.pageTitle})
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-sans">
                                {formatDateTime(pv.createdAt)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 py-2">No individual route hits recorded.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No visitor or account logs match the current criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
