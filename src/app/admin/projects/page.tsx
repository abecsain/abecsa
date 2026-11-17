"use client";

import { useEffect, useState } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Users,
  Calendar,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Project {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  serviceCategory: string;
  budget: number;
  priority: string;
  status: string;
  progress: number;
  startDate: string | null;
  deliveryDate: string | null;
  techStack: string | null;
  stagingUrl: string | null;
  repoUrl: string | null;
  customer: {
    id: string;
    companyName: string;
    user: { name: string; email: string };
  };
  manager: { id: string; name: string } | null;
  members: Array<{ user: { id: string; name: string; role: string } }>;
  _count: { tasks: number; files: number };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [managers, setManagers] = useState<Array<{ id: string; name: string }>>([]);
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    customerId: "",
    managerId: "",
    serviceCategory: "Custom Software Development",
    budget: "",
    priority: "MEDIUM",
    status: "PLANNING",
    deliveryDate: "",
    techStack: "",
    description: "",
    engineerIds: [] as string[],
  });

  useEffect(() => {
    fetchProjects();
    fetchUsersMetadata();
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

  const fetchUsersMetadata = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/users?role=CUSTOMER"),
      ]);
      const uData = await uRes.json();
      if (uData.users) {
        setManagers(uData.users.filter((u: { role: string }) => u.role === "MANAGER"));
        setEngineers(uData.users.filter((u: { role: string }) => u.role === "ENGINEER"));
      }
      const cRes = await fetch("/api/leads"); // or derive from users
      // Fetch customers
      const allUsers = uData.users || [];
      const custs = allUsers
        .filter((u: { customerProfile: unknown }) => !!u.customerProfile)
        .map((u: { customerProfile: { id: string; companyName: string } }) => ({
          id: u.customerProfile.id,
          companyName: u.customerProfile.companyName,
        }));
      setCustomers(custs);
      if (custs.length > 0) {
        setFormData((prev) => ({
          ...prev,
          customerId: prev.customerId || custs[0].id,
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          customerId: customers[0]?.id || "",
          managerId: managers[0]?.id || "",
          serviceCategory: "Custom Software Development",
          budget: "",
          priority: "MEDIUM",
          status: "PLANNING",
          deliveryDate: "",
          techStack: "",
          description: "",
          engineerIds: [],
        });
        fetchProjects();
      } else {
        alert(data.error || "Failed to create project");
      }
    } catch {
      alert("Error creating project");
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowEditModal(false);
        fetchProjects();
      } else {
        alert(data.error || "Failed to update project");
      }
    } catch {
      alert("Error updating project");
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project "${name}" and all its sprint tasks? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowEditModal(false);
        fetchProjects();
      } else {
        alert(data.error || "Failed to delete project");
      }
    } catch {
      alert("Error deleting project");
    }
  };

  const openEdit = (p: Project) => {
    setSelectedProject(p);
    setFormData({
      name: p.name,
      customerId: p.customer.id,
      managerId: p.manager?.id || "",
      serviceCategory: p.serviceCategory,
      budget: String(p.budget),
      priority: p.priority,
      status: p.status,
      deliveryDate: p.deliveryDate ? p.deliveryDate.split("T")[0] : "",
      techStack: p.techStack || "",
      description: p.description || "",
      engineerIds: p.members.filter((m) => m.user.role === "ENGINEER").map((m) => m.user.id),
    });
    setShowEditModal(true);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.projectId.toLowerCase().includes(search.toLowerCase()) ||
      p.customer.companyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Enterprise Projects & Sprint Deliveries
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee project lifecycle, milestone progress, budgets, assigned delivery managers, and engineering squads.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: "",
              customerId: customers[0]?.id || "",
              managerId: managers[0]?.id || "",
              serviceCategory: "Custom Software Development",
              budget: "500000",
              priority: "MEDIUM",
              status: "PLANNING",
              deliveryDate: "",
              techStack: "Next.js, TypeScript, PostgreSQL",
              description: "",
              engineerIds: [],
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Scaffold New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by project name, ID, or client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="ALL">All Statuses ({projects.length})</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 block">
                    {p.projectId}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{p.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">{p.customer.companyName}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    p.status === "COMPLETED"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : p.status === "IN_PROGRESS"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {p.status}
                </span>
              </div>

              {p.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">Sprint Progress</span>
                  <span className="font-bold text-slate-800">{p.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              {/* Project Meta Details */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Budget</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(p.budget)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Delivery</span>
                  <span className="font-semibold text-slate-800">{formatDate(p.deliveryDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Delivery Manager</span>
                  <span className="font-semibold text-slate-800">{p.manager?.name || "Unassigned"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Active Tasks</span>
                  <span className="font-semibold text-slate-800">{p._count.tasks} Tasks</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {p.stagingUrl ? (
                <a
                  href={p.stagingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Staging Sandbox</span>
                </a>
              ) : (
                <span className="text-[11px] text-slate-400">No staging URL</span>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEdit(p)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1 text-xs font-medium cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeleteProject(p.id, p.name)}
                  className="p-1.5 rounded-lg border border-rose-100 bg-rose-50/50 hover:bg-rose-100 text-rose-600 flex items-center gap-1 text-xs font-medium cursor-pointer"
                  title="Delete Project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Scaffold New Project</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Health EHR Portal"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Client *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">Select Client...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="">Select Manager...</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget (INR) *</label>
                  <input
                    type="number"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="1200000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Delivery Target Date</label>
                  <input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Category</label>
                <select
                  value={formData.serviceCategory}
                  onChange={(e) => setFormData({ ...formData, serviceCategory: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="Custom Software Development">Custom Software Development</option>
                  <option value="ERP & Custom Software">ERP & Supply Chain Software</option>
                  <option value="Mobile Application Development">Mobile Application Development</option>
                  <option value="AI and Machine Learning Solutions">AI & Machine Learning Solutions</option>
                  <option value="Web Application Development">Web Application Development</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Lead Engineers</label>
                <div className="space-y-1 max-h-24 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {engineers.map((eng) => (
                    <label key={eng.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.engineerIds.includes(eng.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, engineerIds: [...formData.engineerIds, eng.id] });
                          } else {
                            setFormData({
                              ...formData,
                              engineerIds: formData.engineerIds.filter((id) => id !== eng.id),
                            });
                          }
                        }}
                      />
                      <span>{eng.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700"
                >
                  Initialize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditModal && selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Manage {selectedProject.projectId}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget (INR)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                {selectedProject && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(selectedProject.id, selectedProject.name)}
                    className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Project</span>
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer"
                  >
                    Save Changes
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
