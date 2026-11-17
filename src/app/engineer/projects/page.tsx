"use client";

import { useEffect, useState } from "react";
import { FolderGit2, ExternalLink, Calendar, Users, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function EngineerProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Assigned Engineering Projects
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View technical specifications, repository endpoints, and staging environments for projects you are actively developing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase block">{p.projectId}</span>
              <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
              <p className="text-xs text-slate-500">Client: {p.customer?.companyName}</p>
            </div>

            {p.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {p.description}
              </p>
            )}

            {p.techStack && (
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Technology Stack:</span>
                <p className="font-mono text-[11px] bg-slate-900 text-slate-200 p-2.5 rounded-xl">
                  {p.techStack}
                </p>
              </div>
            )}

            <div className="pt-2 border-t flex items-center justify-between text-xs">
              {p.stagingUrl ? (
                <a
                  href={p.stagingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Staging URL</span>
                </a>
              ) : (
                <span className="text-slate-400">No staging URL</span>
              )}

              <span className="font-bold text-slate-800">Sprint Progress: {p.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
