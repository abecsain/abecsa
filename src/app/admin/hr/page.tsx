"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  Calendar,
  Clock,
  Check,
  X,
  AlertCircle,
  Users,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  jobTitle: string | null;
  phone: string | null;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  user: { name: string };
  reviewNote: string | null;
}

interface Attendance {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: string;
  user: { name: string; jobTitle: string | null };
}

interface WorkLog {
  id: string;
  hoursSpent: number;
  description: string;
  date: string;
  user: { name: string };
  project: { name: string } | null;
}

export default function AdminHrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHrData();
  }, []);

  const fetchHrData = async () => {
    try {
      const res = await fetch("/api/hr");
      const data = await res.json();
      if (data.employees) setEmployees(data.employees);
      if (data.leaves) setLeaves(data.leaves);
      if (data.attendance) setAttendance(data.attendance);
      if (data.workLogs) setWorkLogs(data.workLogs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLeaveStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/hr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LEAVE", id, status }),
      });
      if (res.ok) fetchHrData();
    } catch {
      alert("Error updating leave status");
    }
  };

  const handleDeleteLeave = async (id: string) => {
    if (!confirm("Are you sure you want to delete this leave record?")) return;
    try {
      const res = await fetch(`/api/hr?id=${id}&type=LEAVE`, { method: "DELETE" });
      if (res.ok) fetchHrData();
    } catch {
      alert("Error deleting leave record");
    }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm("Delete this attendance check-in record?")) return;
    try {
      const res = await fetch(`/api/hr?id=${id}&type=ATTENDANCE`, { method: "DELETE" });
      if (res.ok) fetchHrData();
    } catch {
      alert("Error deleting attendance record");
    }
  };

  const handleDeleteWorkLog = async (id: string) => {
    if (!confirm("Delete this engineer work log?")) return;
    try {
      const res = await fetch(`/api/hr?id=${id}&type=WORKLOG`, { method: "DELETE" });
      if (res.ok) fetchHrData();
    } catch {
      alert("Error deleting work log");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          HR Management & Engineering Operations
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review staff attendance logs, approve or decline leave applications, and inspect daily sprint engineering logs.
        </p>
      </div>

      {/* Two Column Grid: Leave Requests & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Leave Requests */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Leave Applications & Approvals</h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {leaves.filter((l) => l.status === "PENDING").length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {leaves.map((l) => (
              <div key={l.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{l.user.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {l.leaveType} ({l.totalDays} Days)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {formatDate(l.startDate)} - {formatDate(l.endDate)}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">&quot;{l.reason}&quot;</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <select
                    value={l.status}
                    onChange={(e) => handleQuickLeaveStatus(l.id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer outline-none ${
                      l.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : l.status === "REJECTED"
                        ? "bg-rose-50 text-rose-700 border-rose-300"
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}
                    title="Change Leave Status"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>

                  <button
                    onClick={() => handleDeleteLeave(l.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                    title="Delete Leave Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Attendance Logs */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Today&apos;s Attendance Logs</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600">Active Check-ins</span>
          </div>

          <div className="divide-y divide-slate-100">
            {attendance.map((att) => (
              <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-800">{att.user.name}</p>
                  <p className="text-[10px] text-slate-400">{att.user.jobTitle || "Engineer"}</p>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {att.status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      In: {new Date(att.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAttendance(att.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                    title="Delete Attendance Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engineer Daily Work Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">Sprint Work Logs & Time Entries</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">{workLogs.length} Entries Logged</span>
        </div>

        <div className="divide-y divide-slate-100">
          {workLogs.map((wl) => (
            <div key={wl.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{wl.user.name}</span>
                  {wl.project && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                      {wl.project.name}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{wl.description}</p>
              </div>

              <div className="flex items-center gap-3 text-right shrink-0">
                <div>
                  <span className="font-bold text-slate-800 text-xs">{wl.hoursSpent} Hours</span>
                  <span className="block text-[10px] text-slate-400">{formatDate(wl.date)}</span>
                </div>
                <button
                  onClick={() => handleDeleteWorkLog(wl.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete Work Log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
