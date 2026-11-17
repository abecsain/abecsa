"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CustomerProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMilestone = async (milestoneId: string, decision: "APPROVED" | "REJECTED") => {
    setSubmitting(true);
    try {
      // Confetti celebration if approved!
      if (decision === "APPROVED") {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }

      alert(`Milestone successfully marked as ${decision}! Thank you for your feedback.`);
      fetchProjects();
    } catch {
      alert("Error approving milestone");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Live Project Milestone Tracker
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review sprint deliverables, inspect staging sandboxes, and sign off on completed project milestones.
        </p>
      </div>

      {projects.map((project) => (
        <div key={project.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase">
                {project.projectId} • {project.serviceCategory}
              </span>
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
              {project.status}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600">Overall Sprint Progress</span>
              <span className="text-sky-600 font-bold">{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {/* Staging link banner */}
          {project.stagingUrl && (
            <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-sky-950 block">Dedicated Client Staging Sandbox</span>
                <p className="text-sky-700 text-[11px]">
                  Interact with real features, test mobile responsive layouts, and verify APIs live.
                </p>
              </div>
              <a
                href={project.stagingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 shadow-xs shrink-0"
              >
                <span>Launch Staging Sandbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Milestones Checklist */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-slate-900">Sprint Milestones & Approvals</h3>

            <div className="space-y-3">
              {project.milestones?.map((m: any, idx: number) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-slate-200 font-bold flex items-center justify-center text-[11px] text-slate-700 shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                    </div>
                    {m.description && (
                      <p className="text-slate-600 text-[11px] leading-relaxed pl-8">
                        {m.description}
                      </p>
                    )}
                    {m.clientNote && (
                      <p className="text-[11px] text-emerald-700 pl-8 font-semibold italic">
                        {m.clientNote}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-end sm:self-center pl-8 sm:pl-0">
                    {m.status === "SUBMITTED_FOR_APPROVAL" ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={submitting}
                          onClick={() => handleApproveMilestone(m.id, "APPROVED")}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Milestone</span>
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                          m.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
