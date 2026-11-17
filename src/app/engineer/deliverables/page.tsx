"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileUp, ExternalLink, Plus, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EngineerDeliverablesPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setTasks(data.tasks.filter((t: any) => !!t.deliverableUrl));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Submitted Sprint Deliverables
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review GitHub pull requests, preview sandboxes, and artifacts submitted for manager verification.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Task Deliverable</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Artifact / Staging Link</th>
                <th className="py-3 px-4">Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-900">{t.title}</td>
                  <td className="py-3 px-4 text-slate-600">{t.project?.name}</td>
                  <td className="py-3 px-4">
                    <a
                      href={t.deliverableUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="truncate max-w-xs">{t.deliverableUrl}</span>
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
