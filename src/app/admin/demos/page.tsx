"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Monitor,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Sparkles,
  Play,
  Layers,
  Image as ImageIcon,
} from "lucide-react";

interface DemoItem {
  id: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  techStack: string;
  keyFeatures: string;
  previewUrl: string;
  imageUrl?: string | null;
  metrics?: string | null;
  orderIndex: number;
  isActive: boolean;
}

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<DemoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDemo, setEditingDemo] = useState<DemoItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "Business Management",
    tagline: "",
    description: "",
    previewUrl: "",
    imageUrl: "",
    techStack: "Next.js 16, React 19, Tailwind CSS, PostgreSQL",
    keyFeatures: "Instant barcode checkout, GST Tax Invoices, Real-time stock sync",
    metrics: "98 Lighthouse Speed Score • 60fps Native Animations",
    orderIndex: 0,
  });

  useEffect(() => {
    fetchDemos();
  }, []);

  const fetchDemos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/demos");
      const data = await res.json();
      if (res.ok && data.demos) {
        setDemos(data.demos);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingDemo(null);
    setFormData({
      title: "",
      category: "Business Management",
      tagline: "",
      description: "",
      previewUrl: "/shop",
      imageUrl: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80",
      techStack: "Next.js, React, Tailwind, PostgreSQL",
      keyFeatures: "Sub-second response, Automated GST billing, WhatsApp dispatch",
      metrics: "Sub-100ms API Latency • Enterprise SLA",
      orderIndex: demos.length + 1,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (demo: DemoItem) => {
    setEditingDemo(demo);

    let tech = demo.techStack;
    try {
      const parsed = JSON.parse(demo.techStack);
      if (Array.isArray(parsed)) tech = parsed.join(", ");
    } catch {}

    let feat = demo.keyFeatures;
    try {
      const parsed = JSON.parse(demo.keyFeatures);
      if (Array.isArray(parsed)) feat = parsed.join(", ");
    } catch {}

    setFormData({
      title: demo.title,
      category: demo.category,
      tagline: demo.tagline || "",
      description: demo.description,
      previewUrl: demo.previewUrl,
      imageUrl: demo.imageUrl || "",
      techStack: tech,
      keyFeatures: feat,
      metrics: demo.metrics || "",
      orderIndex: demo.orderIndex || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.previewUrl || !formData.description) return;

    setSubmitting(true);
    try {
      const techArr = formData.techStack.split(",").map((s) => s.trim()).filter(Boolean);
      const featArr = formData.keyFeatures.split(",").map((s) => s.trim()).filter(Boolean);

      const payload = {
        ...formData,
        techStack: JSON.stringify(techArr),
        keyFeatures: JSON.stringify(featArr),
        id: editingDemo?.id,
      };

      const res = await fetch("/api/demos", {
        method: editingDemo ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setStatusMsg(editingDemo ? "Demo updated successfully!" : "New demo published successfully!");
        setTimeout(() => setStatusMsg(""), 3500);
        fetchDemos();
      } else {
        alert(data.error || "Failed to save demo");
      }
    } catch {
      alert("Error saving demo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete demo "${title}"?`)) return;

    try {
      const res = await fetch(`/api/demos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMsg(`Demo "${title}" removed.`);
        setTimeout(() => setStatusMsg(""), 3000);
        fetchDemos();
      } else {
        alert("Failed to delete demo");
      }
    } catch {
      alert("Error deleting demo");
    }
  };

  const filteredDemos = demos.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-sky-50 text-sky-600">
              <Monitor className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Interactive Demos & Live Sandbox Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Add, update, or remove live demonstration instances, customize live sandbox links, descriptions, and demo card images shown on the public <Link href="/demos" target="_blank" className="text-sky-600 font-semibold underline">/demos</Link> portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/demos"
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <span>Public Demo View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Demo</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Search & Counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search demos by title, category, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredDemos.length}</strong> Demonstrations
        </div>
      </div>

      {/* Demos Management Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading demo catalogue...
        </div>
      ) : filteredDemos.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <Monitor className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Interactive Demos Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &ldquo;Add New Demo&rdquo; above to publish your first software preview card with live links and demo images.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDemos.map((demo) => (
            <div
              key={demo.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Demo Card Image Preview */}
                <div className="relative h-40 w-full bg-slate-900 overflow-hidden">
                  {demo.imageUrl ? (
                    <Image
                      src={demo.imageUrl}
                      alt={demo.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-sky-300 border border-slate-700">
                      {demo.category}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5">
                    <a
                      href={demo.previewUrl}
                      target={demo.previewUrl.startsWith("http") ? "_blank" : "_self"}
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-sky-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md hover:bg-sky-500"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{demo.title}</h3>
                  {demo.tagline && (
                    <p className="text-[11px] font-semibold text-sky-700 line-clamp-1">
                      {demo.tagline}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {demo.description}
                  </p>

                  <div className="pt-2 text-[11px] text-slate-500 font-mono truncate">
                    Live URL: <span className="text-slate-800 font-semibold">{demo.previewUrl}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400">Order #{demo.orderIndex}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(demo)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Edit demo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(demo.id, demo.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete demo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT DEMO MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-4 my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDemo ? "Edit Interactive Demo" : "Add New Interactive Demo"}
                  </h3>
                  <p className="text-xs text-slate-500">Configure public card image, live link & descriptions</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Demo Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NovaStore Omnichannel E-Commerce Suite"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Healthcare, Retail POS, Logistics"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. High-speed storefront with 1-click UPI & automated dispatch"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed description of the demo application capabilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Live Demo Preview URL *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. /shop, /customer, or https://demo.abecsa.in"
                    value={formData.previewUrl}
                    onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Demo Card Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Next.js 16, React 19, Tailwind CSS, PostgreSQL"
                  value={formData.techStack}
                  onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Features (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Instant search, Cart drawer, WhatsApp order alerts"
                  value={formData.keyFeatures}
                  onChange={(e) => setFormData({ ...formData, keyFeatures: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Performance Metric Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. 98 Lighthouse Speed Score • 60fps"
                    value={formData.metrics}
                    onChange={(e) => setFormData({ ...formData, metrics: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                >
                  {submitting ? "Saving..." : editingDemo ? "Update Demo" : "Publish Demo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
