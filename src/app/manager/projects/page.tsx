"use client";

import { useEffect, useState } from "react";
import { FolderGit2, Plus, Search, Calendar, Users, ListTodo, Edit2, X, ExternalLink, Trash2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ManagerProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [assignedEngineer, setAssignedEngineer] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");

  useEffect(() => {
    fetchProjects();
    fetchEngineers();
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

  const fetchEngineers = async () => {
    try {
      const res = await fetch("/api/users?role=ENGINEER");
      const data = await res.json();
      if (data.users) setEngineers(data.users);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !taskTitle) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: taskTitle,
          description: taskDesc,
          assignedToId: assignedEngineer || undefined,
          priority: taskPriority,
          dueDate: taskDueDate || undefined,
        }),
      });

      if (res.ok) {
        setShowTaskModal(false);
        setTaskTitle("");
        setTaskDesc("");
        fetchProjects();
      }
    } catch {
      alert("Error creating task");
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchProjects();
    } catch {
      alert("Error deleting task");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Managed Projects & Sprint Squads
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create tasks, assign software engineers, inspect delivery milestones, and synchronize staging sandboxes.
          </p>
        </div>

        <button
          onClick={() => {
            if (projects.length > 0) setSelectedProjectId(projects[0].id);
            setShowTaskModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Sprint Task</span>
        </button>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase block">{p.projectId}</span>
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs font-semibold text-slate-500">{p.customer?.companyName}</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {p.status}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Calculated Sprint Progress</span>
                <span className="font-bold text-slate-800">{p.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-600 h-full rounded-full" style={{ width: `${p.progress}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600 pt-2 border-t">
              <div>
                <span className="text-slate-400 block text-[10px]">Target Delivery:</span>
                <span className="font-semibold text-slate-800">{formatDate(p.deliveryDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Budget Allocated:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(p.budget)}</span>
              </div>
            </div>

            {/* Task list preview */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Active Tasks ({p.tasks?.length || 0})</span>
                <button
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setShowTaskModal(true);
                  }}
                  className="text-sky-600 hover:underline font-bold text-[11px] flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Task</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {p.tasks?.map((t: any) => (
                  <div key={t.id} className="p-2 rounded-lg bg-slate-50 border text-[11px] flex items-center justify-between">
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">{t.title}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white text-slate-600 border">
                        {t.status}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="p-0.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-slate-900">Assign New Sprint Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project *</label>
                <select
                  required
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Implement Kafka telemetry listener"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Engineer</label>
                  <select
                    value={assignedEngineer}
                    onChange={(e) => setAssignedEngineer(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>{eng.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Technical acceptance criteria..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-3 py-1.5 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 text-white font-semibold"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
