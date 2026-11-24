"use client";

import React, { useState, useEffect } from "react";
import { GraduationCap, Mail, Phone, Calendar, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";

interface Application {
  id: number;
  name: string;
  email: string;
  phone: string;
  courseName: string;
  branch: string | null;
  message: string | null;
  status: string;
  type: string;
  createdAt: string;
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchApplications();
  }, [typeFilter, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (typeFilter !== "ALL") query.set("type", typeFilter);
      if (statusFilter !== "ALL") query.set("status", statusFilter);

      const res = await fetch(`/api/applications?${query.toString()}`);
      const data = await res.json();
      if (data.success && data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      } else {
        alert(data.error || "Failed to update status");
      }
    } catch {
      alert("Network error");
    }
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Academy & Talent Applications
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and manage incoming registrations for Courses, Software Internships, and Student Ambassadors.
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Track:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Tracks</option>
              <option value="Course">Courses</option>
              <option value="Internship">Internships</option>
              <option value="Student Ambassador">Student Ambassadors</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Track & Program</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading applications...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{app.name}</span>
                        {app.message && (
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">&quot;{app.message}&quot;</span>
                        )}
                      </td>
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-700 font-mono">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{app.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{app.phone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 inline-block">
                          {app.type}
                        </span>
                        <span className="font-semibold text-slate-800 block mt-0.5">{app.courseName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{app.branch || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            app.status === "Approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "Rejected"
                              ? "bg-rose-100 text-rose-800"
                              : app.status === "Reviewed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.status !== "Approved" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(app.id, "Approved")}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] cursor-pointer"
                              title="Approve"
                            >
                              Approve
                            </button>
                          )}
                          {app.status !== "Rejected" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(app.id, "Rejected")}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] cursor-pointer"
                              title="Reject"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
