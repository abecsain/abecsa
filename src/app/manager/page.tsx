"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Users,
  Send,
  MessageSquare,
  ListTodo,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  Bell,
  Sparkles,
  Edit2,
  Trash2,
  X,
  UserCheck,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ManagerDashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Task Modal States (Add & Edit)
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedToId: "",
    priority: "MEDIUM",
    status: "TODO",
    dueDate: "",
  });

  // Project Modal States (Add & Edit)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: "",
    customerId: "",
    budget: "500000",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    deliveryDate: "",
    description: "",
  });

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    try {
      const [pRes, tRes, cRes, nRes, eRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/users?role=CUSTOMER"),
        fetch("/api/notices"),
        fetch("/api/users?role=ENGINEER"),
      ]);

      const pData = await pRes.json();
      const tData = await tRes.json();
      const cData = await cRes.json();
      const nData = await nRes.json();
      const eData = await eRes.json();

      if (pData.projects) {
        setProjects(pData.projects);
        if (pData.projects.length > 0 && !taskForm.projectId) {
          setTaskForm((prev) => ({ ...prev, projectId: pData.projects[0].id }));
        }
      }
      if (tData.tasks) setTasks(tData.tasks);
      if (cData.users) {
        setCustomers(cData.users);
        const validCusts = cData.users.filter((u: any) => !!u.customerProfile);
        if (validCusts.length > 0 && !projectForm.customerId) {
          setProjectForm((prev) => ({ ...prev, customerId: validCusts[0].customerProfile.id }));
        }
      }
      if (nData.notices) setNotices(nData.notices);
      if (eData.users) setEngineers(eData.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- TASK CRUD -------------------
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      if (editingTask) {
        // UPDATE TASK
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingTask.id,
            title: taskForm.title.trim(),
            description: taskForm.description,
            priority: taskForm.priority,
            status: taskForm.status,
            assignedToId: taskForm.assignedToId || undefined,
            dueDate: taskForm.dueDate || undefined,
          }),
        });
        if (res.ok) {
          setShowTaskModal(false);
          setEditingTask(null);
          resetTaskForm();
          fetchManagerData();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to update task");
        }
      } else {
        // CREATE TASK
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: taskForm.projectId || (projects[0]?.id || ""),
            title: taskForm.title.trim(),
            description: taskForm.description,
            priority: taskForm.priority,
            assignedToId: taskForm.assignedToId || undefined,
            dueDate: taskForm.dueDate || undefined,
          }),
        });
        if (res.ok) {
          setShowTaskModal(false);
          resetTaskForm();
          fetchManagerData();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to create task");
        }
      }
    } catch {
      alert("Error saving task");
    }
  };

  const handleDeleteTask = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchManagerData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete task");
      }
    } catch {
      alert("Error deleting task");
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) fetchManagerData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      projectId: task.project?.id || projects[0]?.id || "",
      assignedToId: task.assignedTo?.id || "",
      priority: task.priority || "MEDIUM",
      status: task.status || "TODO",
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
    setShowTaskModal(true);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      projectId: projects[0]?.id || "",
      assignedToId: "",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: "",
    });
  };

  // ------------------- PROJECT CRUD -------------------
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;

    try {
      if (editingProject) {
        // UPDATE PROJECT
        const res = await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProject.id,
            name: projectForm.name.trim(),
            budget: Number(projectForm.budget),
            priority: projectForm.priority,
            status: projectForm.status,
            deliveryDate: projectForm.deliveryDate || undefined,
            description: projectForm.description,
          }),
        });
        if (res.ok) {
          setShowProjectModal(false);
          setEditingProject(null);
          resetProjectForm();
          fetchManagerData();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to update project");
        }
      } else {
        // CREATE PROJECT
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectForm),
        });
        if (res.ok) {
          setShowProjectModal(false);
          resetProjectForm();
          fetchManagerData();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to create project");
        }
      }
    } catch {
      alert("Error saving project");
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}" and all associated sprint tasks?`)) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchManagerData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to delete project");
      }
    } catch {
      alert("Error deleting project");
    }
  };

  const openEditProject = (p: any) => {
    setEditingProject(p);
    setProjectForm({
      name: p.name,
      customerId: p.customer?.id || "",
      budget: String(p.budget || "500000"),
      priority: p.priority || "MEDIUM",
      status: p.status || "IN_PROGRESS",
      deliveryDate: p.deliveryDate ? p.deliveryDate.split("T")[0] : "",
      description: p.description || "",
    });
    setShowProjectModal(true);
  };

  const resetProjectForm = () => {
    setProjectForm({
      name: "",
      customerId: customers.find((c: any) => !!c.customerProfile)?.customerProfile?.id || "",
      budget: "500000",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      deliveryDate: "",
      description: "",
    });
  };

  const pendingTasks = tasks.filter((t) => t.status !== "COMPLETED");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Delivery & Client Operations Cockpit
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor assigned client deliveries, coordinate engineering sprint tasks, push updates to client portals, and communicate via WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingTask(null);
              resetTaskForm();
              setShowTaskModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
          <Link
            href="/manager/push"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push to Client Portal</span>
          </Link>
          <Link
            href="/manager/whatsapp"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>My WhatsApp</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Managed Projects</span>
          <p className="text-2xl font-black text-slate-900">{projects.length}</p>
          <p className="text-[11px] text-slate-500">Active client deliveries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Assigned Clients</span>
          <p className="text-2xl font-black text-sky-600">{customers.length}</p>
          <p className="text-[11px] text-slate-500">Client portals synchronized</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Sprint Tasks</span>
          <p className="text-2xl font-black text-amber-600">{pendingTasks.length}</p>
          <p className="text-[11px] text-slate-500">Pending engineer completion</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-semibold text-slate-500 block">Pushed Announcements</span>
          <p className="text-2xl font-black text-emerald-600">{notices.length}</p>
          <p className="text-[11px] text-slate-500">Active client notices</p>
        </div>
      </div>

      {/* Two Column Grid: Managed Projects & Active Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Projects Overview */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">Assigned Project Pipelines</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingProject(null);
                  resetProjectForm();
                  setShowProjectModal(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Project</span>
              </button>
              <span className="text-slate-300">|</span>
              <Link href="/manager/projects" className="text-xs text-slate-500 hover:text-slate-700 font-semibold">
                View All
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No projects assigned yet.</p>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-sky-600 uppercase">{p.projectId}</span>
                      <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                      <p className="text-[11px] text-slate-500">{p.customer?.companyName || "Client Project"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                        {p.status}
                      </span>
                      <button
                        onClick={() => openEditProject(p)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded-md cursor-pointer transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(p.id, p.name)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Overall Progress</span>
                      <span className="font-bold text-slate-800">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Target: {formatDate(p.deliveryDate)}</span>
                    <span>{p.tasks?.length || 0} Tasks Assigned</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sprint Tasks & Checklists (WITH FULL ADD, EDIT, DELETE & STATUS CHANGE) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Sprint Tasks & Checklists</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingTask(null);
                  resetTaskForm();
                  setShowTaskModal(true);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">({tasks.length})</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No sprint tasks created yet. Click &quot;Add Task&quot; above.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="py-3 text-xs space-y-1.5 hover:bg-slate-50/50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {/* Status Selector Dropdown */}
                      <select
                        value={task.status}
                        onChange={(e) => handleQuickStatusChange(task.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : task.status === "IN_PROGRESS"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : task.status === "CODE_REVIEW"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="CODE_REVIEW">CODE REVIEW</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>

                      {/* Modify / Edit Button */}
                      <button
                        onClick={() => openEditTask(task)}
                        className="p-1 text-slate-400 hover:text-sky-600 rounded cursor-pointer transition-colors"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Assigned to: <strong className="text-slate-700">{task.assignedTo?.name || "Unassigned"}</strong>
                    </span>
                    <span className="text-[10px] text-sky-600 font-medium">{task.project?.name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Modal (Add or Modify) */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingTask ? `Modify Task: ${editingTask.title}` : "Add New Sprint Task"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  setEditingTask(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="e.g. Implement GST E-Way Bill API Connector"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {!editingTask && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project</label>
                  <select
                    value={taskForm.projectId}
                    onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Engineer</label>
                  <select
                    value={taskForm.assignedToId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="">Unassigned</option>
                    {engineers.map((eng) => (
                      <option key={eng.id} value={eng.id}>
                        {eng.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 bg-white"
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
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Acceptance Criteria</label>
                <textarea
                  rows={3}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task specifications, endpoints, tests..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                {editingTask ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTask.id, editingTask.title)}
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
                      setShowTaskModal(false);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 cursor-pointer"
                  >
                    {editingTask ? "Save Modifications" : "Add Task"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal (Add or Modify) */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingProject ? `Modify Project: ${editingProject.name}` : "Create New Project"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowProjectModal(false);
                  setEditingProject(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  placeholder="e.g. Apex Health EHR Portal"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {!editingProject && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Client Customer</label>
                  <select
                    value={projectForm.customerId}
                    onChange={(e) => setProjectForm({ ...projectForm, customerId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {customers
                      .filter((c: any) => !!c.customerProfile)
                      .map((c: any) => (
                        <option key={c.customerProfile.id} value={c.customerProfile.id}>
                          {c.customerProfile.companyName} ({c.name})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget (INR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={projectForm.budget === "0" ? "" : projectForm.budget}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setProjectForm({ ...projectForm, budget: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="TESTING">TESTING</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Delivery Date</label>
                <input
                  type="date"
                  value={projectForm.deliveryDate}
                  onChange={(e) => setProjectForm({ ...projectForm, deliveryDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Scope / Description</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Architecture overview, deliverable roadmap..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
