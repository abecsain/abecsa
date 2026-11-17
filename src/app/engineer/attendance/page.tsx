"use client";

import { useEffect, useState } from "react";
import { UserCheck, Calendar, Check, Send, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EngineerAttendancePage() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState("");

  // Leave Form
  const [leaveType, setLeaveType] = useState("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aRes, lRes] = await Promise.all([
        fetch("/api/hr?type=ATTENDANCE"),
        fetch("/api/hr?type=LEAVES"),
      ]);
      const aData = await aRes.json();
      const lData = await lRes.json();
      if (aData.attendance) setAttendance(aData.attendance);
      if (lData.leaves) setLeaves(lData.leaves);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAttendance = async () => {
    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOG_ATTENDANCE" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg(data.message);
        fetchData();
        setTimeout(() => setStatusMsg(""), 3000);
      }
    } catch {
      alert("Error recording attendance");
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;

    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_LEAVE",
          leaveType,
          startDate,
          endDate,
          totalDays: Number(totalDays),
          reason,
        }),
      });
      if (res.ok) {
        setReason("");
        setStatusMsg("Leave application submitted for manager approval!");
        fetchData();
        setTimeout(() => setStatusMsg(""), 3000);
      }
    } catch {
      alert("Error submitting leave application");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Attendance & Leave Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily check-ins and submit leave applications to your assigned delivery manager.
          </p>
        </div>

        <button
          onClick={handleToggleAttendance}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Clock className="w-4 h-4" />
          <span>Mark Daily Check-In / Out</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {/* Two Columns: Apply Leave & Leave History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <form onSubmit={handleApplyLeave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">Apply for Leave</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="CASUAL">Casual Leave (CL)</option>
              <option value="SICK">Medical / Sick Leave (SL)</option>
              <option value="PAID">Earned / Paid Leave (PL)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Reason for Leave *</label>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for time-off..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700"
          >
            Submit Application
          </button>
        </form>

        {/* History */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">My Leave History</h3>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {leaves.map((l) => (
              <div key={l.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{l.leaveType} ({l.totalDays} Days)</p>
                  <p className="text-[11px] text-slate-500">{formatDate(l.startDate)} - {formatDate(l.endDate)}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    l.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : l.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
