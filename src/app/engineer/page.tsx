"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  FolderGit2,
  Calendar,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EngineerDashboardPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngineerData();
  }, []);

  const fetchEngineerData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
      ]);

      const tData = await tRes.json();
      const pData = await pRes.json();

      if (tData.tasks) setTasks(tData.tasks);
      if (pData.projects) setProjects(pData.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoCount = tasks.filter((t) => t.status === "TODO").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Engineering Sprint Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your assigned sprint tasks, update implementation status, log hours, and push deliverables for manager review.
          </p>
        </div>

        <Link
          href="/engineer/tasks"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all"
        >
          <ListTodo className="w-4 h-4" />
          <span>Go to Sprint Kanban Board</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Total Assigned Tasks</span>
          <p className="text-2xl font-black text-slate-900">{tasks.length}</p>
          <p className="text-[11px] text-slate-500">Across your assigned projects</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">In Progress</span>
          <p className="text-2xl font-black text-sky-600">{inProgressCount}</p>
          <p className="text-[11px] text-slate-500">Currently active execution</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Ready / In Queue</span>
          <p className="text-2xl font-black text-amber-600">{todoCount}</p>
          <p className="text-[11px] text-slate-500">Sprint backlog tasks</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Completed</span>
          <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
          <p className="text-[11px] text-slate-500">Verified & deployed</p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Tasks Queue */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="text-sm font-bold text-slate-900">Immediate Sprint Priorities</h3>
            <Link href="/engineer/tasks" className="text-xs text-sky-600 font-semibold hover:underline">
              View Kanban
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div key={task.id} className="py-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{task.title}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      task.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : task.status === "IN_PROGRESS"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] line-clamp-1">{task.description}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Project: {task.project?.name}</span>
                  <span>Est: {task.estimatedHours} hrs • Actual: {task.actualHours} hrs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <h3 className="text-sm font-bold text-slate-900">Assigned Projects ({projects.length})</h3>
            <span className="text-[11px] text-slate-400">Repositories & Staging</span>
          </div>

          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-sky-600 uppercase">{p.projectId}</span>
                  <h4 className="font-bold text-slate-900">{p.name}</h4>
                  <p className="text-[11px] text-slate-500">Client: {p.customer?.companyName}</p>
                </div>

                {p.techStack && (
                  <p className="text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-200 font-mono">
                    Stack: {p.techStack}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  {p.stagingUrl ? (
                    <a
                      href={p.stagingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Staging Sandbox</span>
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No staging URL</span>
                  )}

                  <span className="text-[10px] font-bold text-slate-700">
                    Progress: {p.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
