"use client";

import { useEffect, useState } from "react";
import {
  ListTodo,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  X,
  User,
  FolderGit2,
  AlertCircle,
  Filter,
  Edit2,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  estimatedHours: number;
  actualHours: number;
  project: { id: string; name: string; projectId: string };
  assignedTo: { id: string; name: string; email: string } | null;
  comments: Array<{ id: string }>;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    projectId: "",
    title: "",
    description: "",
    assignedToId: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
    estimatedHours: "4",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchMetadata();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/users?role=ENGINEER"),
      ]);
      const pData = await pRes.json();
      const uData = await uRes.json();

      if (pData.projects) {
        setProjects(pData.projects);
        if (pData.projects.length > 0) {
          setFormData((prev) => ({ ...prev, projectId: prev.projectId || pData.projects[0].id }));
        }
      }
      if (uData.users) {
        setEngineers(uData.users);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      if (editingTask) {
        // UPDATE
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTask.id,
            title: formData.title.trim(),
            description: formData.description,
            priority: formData.priority,
            status: formData.status,
            assignedToId: formData.assignedToId || undefined,
            dueDate: formData.dueDate || undefined,
            estimatedHours: Number(formData.estimatedHours || 0),
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setShowAddModal(false);
          setEditingTask(null);
          resetForm();
          fetchTasks();
        } else {
          alert(data.error || "Failed to update task");
        }
      } else {
        // CREATE
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setShowAddModal(false);
          resetForm();
          fetchTasks();
        } else {
          alert(data.error || "Failed to create task");
        }
      }
    } catch {
      alert("Error saving task");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      projectId: projects[0]?.id || "",
      title: "",
      description: "",
      assignedToId: "",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: "",
      estimatedHours: "4",
    });
  };

  const openEdit = (t: TaskItem) => {
    setEditingTask(t);
    setFormData({
      projectId: t.project?.id || projects[0]?.id || "",
      title: t.title,
      description: t.description || "",
      assignedToId: t.assignedTo?.id || "",
      priority: t.priority || "MEDIUM",
      status: t.status || "TODO",
      dueDate: t.dueDate ? t.dueDate.split("T")[0] : "",
      estimatedHours: String(t.estimatedHours || 4),
    });
    setShowAddModal(true);
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) fetchTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project?.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedTo?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-sky-600" />
            Company-Wide Engineering Tasks & Sprints
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise agile sprint backlogs, developer work allocation, code reviews, and project milestones.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 block">Total Tasks</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{tasks.length}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 block">In Progress</span>
          <span className="text-2xl font-bold text-sky-600 mt-1 block">
            {tasks.filter((t) => t.status === "IN_PROGRESS").length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 block">In Code Review</span>
          <span className="text-2xl font-bold text-purple-600 mt-1 block">
            {tasks.filter((t) => t.status === "CODE_REVIEW").length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-medium text-slate-500 block">Completed</span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {tasks.filter((t) => t.status === "COMPLETED").length}
          </span>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by task title, project, or developer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {["ALL", "TODO", "IN_PROGRESS", "CODE_REVIEW", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                statusFilter === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No tasks found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Task & Project</th>
                  <th className="px-4 py-3">Assigned Engineer</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Target Due</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{t.title}</span>
                        <span className="text-[11px] text-sky-600 font-medium">
                          {t.project?.projectId}: {t.project?.name}
                        </span>
                        {t.description && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-sm mt-0.5">
                            {t.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {t.assignedTo ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            {t.assignedTo.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800 text-xs block">{t.assignedTo.name}</span>
                            <span className="text-[10px] text-slate-400 block">{t.assignedTo.email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === "HIGH" || t.priority === "URGENT"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold border border-slate-300 bg-white"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="CODE_REVIEW">CODE REVIEW</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-slate-700 font-medium text-xs">
                        {t.dueDate ? formatDate(t.dueDate) : "No deadline"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status !== "COMPLETED" ? (
                          <button
                            onClick={() => handleUpdateStatus(t.id, "COMPLETED")}
                            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] cursor-pointer"
                          >
                            Mark Done
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        )}
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id, t.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingTask ? `Modify Task: ${editingTask.title}` : "Create New Project Task"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTask(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Integrate Razorpay / Stripe Payment Webhooks"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Project</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Engineer</label>
                  <select
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="CODE_REVIEW">CODE REVIEW</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Est. Hours</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.estimatedHours === "0" ? "" : formData.estimatedHours}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setFormData({ ...formData, estimatedHours: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Acceptance Criteria</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task specifications, documentation references, expected outputs..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      handleDeleteTask(editingTask.id, editingTask.title);
                    }}
                    className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer"
                  >
                    {submitting ? "Saving..." : editingTask ? "Save Modifications" : "Create Task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
