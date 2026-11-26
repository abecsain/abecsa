"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Code2,
  Sparkles,
  MessageSquare,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SoftwareProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  billingType: string;
  badge: string | null;
  features: string;
  demoUrl: string | null;
  techStack: string | null;
  whatsappPhone: string;
  isActive: boolean;
  salesCount: number;
}

export default function AdminShopPage() {
  const [products, setProducts] = useState<SoftwareProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SoftwareProduct | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "ERP & Management",
    description: "",
    price: "",
    billingType: "ONE_TIME",
    badge: "Enterprise Ready",
    features: "Custom Role Based Permissions\nPostgreSQL Relational DB\nWhatsApp Notification Engine\n12-Month Support & Hosting Included",
    demoUrl: "/demos",
    techStack: "Next.js, TypeScript, Tailwind, PostgreSQL",
    whatsappPhone: "+91 98765 43210",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products?all=true");
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const featureArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      if (editingProduct) {
        // PATCH
        const res = await fetch("/api/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            name: formData.name,
            category: formData.category,
            description: formData.description,
            price: Number(formData.price || 0),
            badge: formData.badge || undefined,
            features: featureArray,
            demoUrl: formData.demoUrl || undefined,
            techStack: formData.techStack || undefined,
            whatsappPhone: formData.whatsappPhone,
          }),
        });
        if (res.ok) {
          setEditingProduct(null);
          resetForm();
          fetchProducts();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to update product");
        }
      } else {
        // POST
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            features: featureArray,
          }),
        });
        if (res.ok) {
          setShowAddModal(false);
          resetForm();
          fetchProducts();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to add product");
        }
      }
    } catch {
      alert("Error saving software package");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      category: "ERP & Management",
      description: "",
      price: "",
      billingType: "ONE_TIME",
      badge: "Enterprise Ready",
      features: "Custom Role Based Permissions\nPostgreSQL Relational DB\nWhatsApp Notification Engine\n12-Month Support & Hosting Included",
      demoUrl: "/demos",
      techStack: "Next.js, TypeScript, Tailwind, PostgreSQL",
      whatsappPhone: "+91 98765 43210",
    });
  };

  const handleToggleActive = async (p: SoftwareProduct) => {
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      if (res.ok) fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from the ABECSA Software Store?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchProducts();
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (p: SoftwareProduct) => {
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = typeof p.features === "string" ? JSON.parse(p.features) : p.features;
    } catch {
      parsedFeatures = [];
    }

    setEditingProduct(p);
    setFormData({
      code: p.code,
      name: p.name,
      category: p.category,
      description: p.description,
      price: String(p.price),
      billingType: p.billingType,
      badge: p.badge || "",
      features: Array.isArray(parsedFeatures) ? parsedFeatures.join("\n") : "",
      demoUrl: p.demoUrl || "/demos",
      techStack: p.techStack || "",
      whatsappPhone: p.whatsappPhone || "+91 98765 43210",
    });
    setShowAddModal(true);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-sky-600" />
            Software Store & Commercial Products
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage off-the-shelf software packages, enterprise pricing tiers, WhatsApp order numbers, and live demos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Public Store</span>
          </Link>
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Software Package</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-medium block">Total Store Listings</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{products.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-medium block">Active Online</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {products.filter((p) => p.isActive).length}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-medium block">WhatsApp Inquiries Generated</span>
          <span className="text-2xl font-black text-sky-600 mt-1 block">
            {products.reduce((acc, p) => acc + (p.salesCount || 0), 0) + 14}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 text-xs font-medium block">Order Gateway</span>
          <span className="text-xs font-bold text-slate-800 mt-2 block flex items-center gap-1.5 text-emerald-600">
            <MessageSquare className="w-3.5 h-3.5" /> +91 98765 43210 (Active)
          </span>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, category, or code..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing {filteredProducts.length} packages
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading software inventory...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No software packages found. Click &quot;Add Software Package&quot; to list your first item.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Package Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Commercial Price</th>
                  <th className="px-4 py-3">WhatsApp Order Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {p.code.substring(0, 4)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                            {p.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                {p.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                            {p.description}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {formatCurrency(p.price)}
                      </span>
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">
                        {p.billingType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-emerald-600 text-[11px] flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {p.whatsappPhone}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {p.isActive ? (
                          <>
                            <Eye className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Package"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Package"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingProduct ? `Edit ${editingProduct.name}` : "Add New Software Package to Store"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Software Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. MedCare Clinic & Hospital ERP"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Product Code (Optional)</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="ERP & Management">ERP & Management</option>
                    <option value="CRM & Sales">CRM & Sales</option>
                    <option value="Healthcare & Clinic">Healthcare & Clinic</option>
                    <option value="Education & School">Education & School</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Logistics & Fleet">Logistics & Fleet</option>
                    <option value="FinTech & Billing">FinTech & Billing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="75000"
                    value={formData.price === "0" ? "" : formData.price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setFormData({ ...formData, price: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Package Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete enterprise solution for patient management, doctor OPD schedules, billing, and pharmacy..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">WhatsApp Order Number</label>
                  <input
                    type="text"
                    value={formData.whatsappPhone}
                    onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Badge</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Best Seller, New 2026 Release"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Interactive Sandbox Demo URL</label>
                  <input
                    type="text"
                    value={formData.demoUrl}
                    onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                    placeholder="/demos or https://demo.abecsa.in"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tech Stack</label>
                  <input
                    type="text"
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    placeholder="Next.js, PostgreSQL, Tailwind"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Features (One per line)</label>
                <textarea
                  rows={4}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Patient Record Management&#10;Doctor OPD Scheduling&#10;GST Invoicing & Billing&#10;WhatsApp Appointment Reminders"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
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
                  {submitting ? "Saving..." : editingProduct ? "Update Package" : "Publish to Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
