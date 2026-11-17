"use client";

import { useEffect, useState } from "react";
import { Clock, Plus, Send } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EngineerLogsPage() {
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [hours, setHours] = useState("");
  const [desc, setDesc] = useState("");
  const [taskId, setTaskId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const [lRes, tRes] = await Promise.all([
        fetch("/api/hr?type=WORKLOGS"),
        fetch("/api/tasks"),
      ]);
      const lData = await lRes.json();
      const tData = await tRes.json();
      if (lData.workLogs) setWorkLogs(lData.workLogs);
      if (tData.tasks) {
        setTasks(tData.tasks);
        if (tData.tasks.length > 0) setTaskId(tData.tasks[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || !desc) return;

    try {
      const selectedT = tasks.find((t) => t.id === taskId);
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_WORK",
          hoursSpent: Number(hours),
          description: desc,
          taskId: taskId || undefined,
          projectId: selectedT?.project?.id,
        }),
      });

      if (res.ok) {
        setHours("");
        setDesc("");
        fetchLogs();
      }
    } catch {
      alert("Error logging hours");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Engineering Work Logs & Timesheet
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Record development hours, link daily commits to sprint tasks, and maintain progress visibility.
        </p>
      </div>

      <form onSubmit={handleLog} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-900">Log Daily Sprint Hours</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Associated Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.project?.name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Hours Executed *</label>
            <input
              type="number"
              step="0.5"
              required
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. 4.5"
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Work Description & Accomplishments *</label>
          <textarea
            rows={2}
            required
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Implemented GPS telemetry ingestion listener and wrote unit tests..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-2 cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          <span>Submit Work Log</span>
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">Recent Timesheet Entries</h3>
        <div className="divide-y divide-slate-100">
          {workLogs.map((l) => (
            <div key={l.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-semibold text-slate-800">{l.description}</p>
                <p className="text-[10px] text-slate-400">
                  {l.project?.name || "Sprint Task"} • {formatDate(l.date)}
                </p>
              </div>
              <span className="font-bold text-slate-900">{l.hoursSpent} hrs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
