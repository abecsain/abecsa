"use client";

import { useEffect, useState } from "react";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  MessageSquare,
  CheckSquare,
  Square,
  Send,
  ExternalLink,
  X,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  estimatedHours: number;
  actualHours: number;
  deliverableUrl: string | null;
  dueDate: string | null;
  project: { id: string; name: string; progress: number };
  assignedTo?: { id: string; name: string; email: string } | null;
  checklists: Array<{ id: string; title: string; isCompleted: boolean }>;
  comments: Array<{ id: string; comment: string; user: { name: string; role: string } }>;
}

export default function EngineerTasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");

  // Comment & Log State
  const [commentText, setCommentText] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");
  const [hoursInput, setHoursInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New Sprint Task Modal State
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskProject, setNewTaskProject] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");
  const [newTaskHours, setNewTaskHours] = useState("4");
  const [creatingTask, setCreatingTask] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState("");

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newChecklistTitle.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTask.id, checklistAddTitle: newChecklistTitle.trim() }),
      });
      if (res.ok) {
        setNewChecklistTitle("");
        fetchTasks();
      }
    } catch {
      alert("Error adding checklist item");
    }
  };

  const handleDeleteChecklist = async (e: React.MouseEvent, checklistId: string) => {
    e.stopPropagation();
    if (!selectedTask) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTask.id, checklistDeleteId: checklistId }),
      });
      if (res.ok) fetchTasks();
    } catch {
      alert("Error deleting checklist item");
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedTask(null);
        fetchTasks();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete task");
      }
    } catch {
      alert("Error deleting task");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) setNewTaskProject(data.projects[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreatingTask(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newTaskProject,
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          priority: newTaskPriority,
          estimatedHours: Number(newTaskHours || 4),
        }),
      });
      if (res.ok) {
        setShowCreateTaskModal(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        fetchTasks();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create task");
      }
    } catch {
      alert("Error creating sprint task");
    } finally {
      setCreatingTask(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
        if (selectedTask) {
          const updated = data.tasks.find((t: TaskItem) => t.id === selectedTask.id);
          if (updated) setSelectedTask(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
    } catch {
      alert("Error updating status");
    }
  };

  const handleToggleChecklist = async (taskId: string, checklistId: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, checklistToggleId: checklistId }),
      });
      if (res.ok) fetchTasks();
    } catch {
      alert("Error toggling checklist");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !commentText) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedTask.id, comment: commentText }),
      });
      if (res.ok) {
        setCommentText("");
        fetchTasks();
      }
    } catch {
      alert("Error adding comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !deliverableInput) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTask.id,
          deliverableUrl: deliverableInput,
          status: "CODE_REVIEW", // Submitting deliverable moves to Code Review
        }),
      });
      if (res.ok) {
        setDeliverableInput("");
        fetchTasks();
      }
    } catch {
      alert("Error submitting deliverable");
    }
  };

  const handleLogHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !hoursInput) return;

    try {
      const res = await fetch("/api/hr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_WORK",
          taskId: selectedTask.id,
          projectId: selectedTask.project.id,
          hoursSpent: Number(hoursInput),
          description: `Work executed on task: ${selectedTask.title}`,
        }),
      });
      if (res.ok) {
        setHoursInput("");
        fetchTasks();
      }
    } catch {
      alert("Error logging hours");
    }
  };

  const columns = [
    { key: "TODO", label: "Sprint Backlog", color: "bg-slate-100 text-slate-700" },
    { key: "IN_PROGRESS", label: "In Development", color: "bg-sky-50 text-sky-700" },
    { key: "CODE_REVIEW", label: "Code Review", color: "bg-purple-50 text-purple-700" },
    { key: "COMPLETED", label: "Completed & Tested", color: "bg-emerald-50 text-emerald-700" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sprint Task Board & Execution
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept tasks, check off specification criteria, submit pull requests / staging sandbox links, and log development hours.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sprint Task</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Task completion dynamically updates overall project % in Client Portal</span>
          </div>
        </div>
      </div>

      {/* Squad Assignee Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter Squad:</span>
        <button
          onClick={() => setAssigneeFilter("ALL")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            assigneeFilter === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All Sprint Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setAssigneeFilter("Priya Nair")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            assigneeFilter === "Priya Nair"
              ? "bg-sky-600 text-white shadow-xs"
              : "bg-sky-50 text-sky-700 hover:bg-sky-100"
          }`}
        >
          Priya Nair ({tasks.filter((t) => t.assignedTo?.name === "Priya Nair").length})
        </button>
        <button
          onClick={() => setAssigneeFilter("Kavita Rao")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            assigneeFilter === "Kavita Rao"
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-purple-50 text-purple-700 hover:bg-purple-100"
          }`}
        >
          Kavita Rao ({tasks.filter((t) => t.assignedTo?.name === "Kavita Rao").length})
        </button>
        <button
          onClick={() => setAssigneeFilter("UNASSIGNED")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
            assigneeFilter === "UNASSIGNED"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          Unassigned Backlog ({tasks.filter((t) => !t.assignedTo).length})
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = tasks
            .filter((t) => {
              if (assigneeFilter === "ALL") return true;
              if (assigneeFilter === "UNASSIGNED") return !t.assignedTo;
              return t.assignedTo?.name === assigneeFilter || t.assignedTo?.id === assigneeFilter;
            })
            .filter((t) => t.status === col.key);

          return (
            <div key={col.key} className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[240px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs font-bold text-slate-600">{colTasks.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {colTasks.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-sky-600 uppercase truncate max-w-[140px]">
                          {t.project?.name}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            t.priority === "HIGH" || t.priority === "URGENT"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{t.title}</h4>

                      {t.description && (
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      {/* Assignee & Hours */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                          👤 {t.assignedTo?.name || "Unassigned"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.actualHours}/{t.estimatedHours}h
                        </span>
                      </div>

                      {/* Checklists progress */}
                      {t.checklists?.length > 0 && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                          <span>
                            {t.checklists.filter((c) => c.isCompleted).length} / {t.checklists.length} items checked
                          </span>
                        </div>
                      )}

                      {/* Quick Move Status & Delete Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                        <select
                          value={t.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(t.id, e.target.value);
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 bg-white cursor-pointer"
                        >
                          <option value="TODO">TODO</option>
                          <option value="IN_PROGRESS">IN DEV</option>
                          <option value="CODE_REVIEW">REVIEW</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(t.id, t.title);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK DETAIL & EXECUTION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase">
                  Project: {selectedTask.project?.name}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{selectedTask.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteTask(selectedTask.id, selectedTask.title)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete Task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Status Switcher Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Current Phase:</span>
              <div className="flex items-center gap-1.5">
                {["TODO", "IN_PROGRESS", "CODE_REVIEW", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedTask.id, st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedTask.status === st
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white border text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div className="text-xs">
                <span className="font-bold text-slate-700 block mb-1">Specification & Context:</span>
                <p className="p-3 bg-slate-50 border rounded-lg text-slate-700 leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Checklists */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 block">Checklist Items ({selectedTask.checklists?.length || 0}):</span>
              </div>

              {selectedTask.checklists?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(selectedTask.id, item.id)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border hover:bg-slate-100 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {item.isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={item.isCompleted ? "line-through text-slate-400" : "text-slate-800"}>
                      {item.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteChecklist(e, item.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="+ Add new checklist requirement..."
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Add Item
                </button>
              </form>
            </div>

            {/* Submit Deliverable Link */}
            <form onSubmit={handleSubmitDeliverable} className="p-3 bg-sky-50/50 border border-sky-200 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-sky-900 block">Submit Staging Link / GitHub PR:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  placeholder="https://github.com/... or staging URL"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white font-bold"
                >
                  Submit Review
                </button>
              </div>
              {selectedTask.deliverableUrl && (
                <a
                  href={selectedTask.deliverableUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 hover:underline flex items-center gap-1 text-[11px] font-semibold pt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Current Link: {selectedTask.deliverableUrl}</span>
                </a>
              )}
            </form>

            {/* Log Hours */}
            <form onSubmit={handleLogHours} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-700">Log Hours on this Task:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="e.g. 2.5"
                  value={hoursInput === "0" ? "" : hoursInput}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setHoursInput(val);
                  }}
                  className="w-20 px-2 py-1 rounded border border-slate-300 bg-white text-center"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-slate-900 text-white font-semibold"
                >
                  Log Time
                </button>
              </div>
            </form>

            {/* Comments Thread */}
            <div className="space-y-2 pt-2 border-t text-xs">
              <span className="font-bold text-slate-700 block">Engineering Task Comments:</span>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add implementation note or ask for clarification..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 text-white font-bold"
                >
                  Comment
                </button>
              </form>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedTask.comments?.map((c) => (
                  <div key={c.id} className="p-2 rounded bg-slate-50 border text-[11px]">
                    <span className="font-bold text-slate-800">{c.user.name}: </span>
                    <span className="text-slate-600">{c.comment}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Sprint Task Modal */}
      {showCreateTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">New Engineering Sprint Task</h3>
              </div>
              <button
                onClick={() => setShowCreateTaskModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement OAuth JWT Auth Middleware"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Project</label>
                <select
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newTaskHours === "0" ? "" : newTaskHours}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setNewTaskHours(val);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technical Specifications</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Acceptance criteria, target endpoints, database migrations required..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateTaskModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer"
                >
                  {creatingTask ? "Creating..." : "Save Sprint Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
