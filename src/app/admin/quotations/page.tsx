"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Receipt,
  X,
  Edit2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateQuotationPdf } from "@/lib/pdf";

interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  title: string;
  currency: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string | null;
  validUntil: string | null;
  status: string;
  clientResponse: string | null;
  notes: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
    address: string | null;
    user: { name: string; email: string; phone: string | null };
  };
  project: { id: string; name: string } | null;
  items: QuotationItem[];
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Edit Quotation Form State
  const [editFormData, setEditFormData] = useState({
    title: "",
    status: "DRAFT",
    discount: 0,
    validUntil: "",
    paymentTerms: "",
    notes: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    customerId: "",
    title: "",
    discount: 0,
    taxRate: 18,
    paymentTerms: "30% Advance Mobilization, 40% Milestone 2 Delivery, 30% Final Sign-off",
    notes: "Includes 12 months comprehensive maintenance and 99.9% uptime SLA.",
    items: [
      { description: "Phase 1: Architecture, UI/UX System & Database Modeling", quantity: 1, unitPrice: 350000 },
      { description: "Phase 2: Core Platform Development & API Integrations", quantity: 1, unitPrice: 500000 },
    ],
  });

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.quotations) setQuotations(data.quotations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/users?role=CUSTOMER");
      const data = await res.json();
      if (data.users) {
        const custs = data.users
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = (q: Quotation) => {
    const doc = generateQuotationPdf({
      quotationNumber: q.quotationNumber,
      title: q.title,
      customerName: q.customer.user.name,
      companyName: q.customer.companyName,
      customerAddress: q.customer.address || undefined,
      customerEmail: q.customer.user.email,
      date: formatDate(q.createdAt),
      validUntil: formatDate(q.validUntil),
      items: q.items,
      subtotal: q.subtotal,
      discount: q.discount,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      totalAmount: q.totalAmount,
      paymentTerms: q.paymentTerms || undefined,
      notes: q.notes || undefined,
    });
    doc.save(`${q.quotationNumber}_ABECSA.pdf`);
  };

  const handleConvertToInvoice = async (quotationId: string) => {
    if (!confirm("Convert this approved quotation into a Tax Invoice?")) return;

    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: quotationId, convertToInvoice: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to convert to invoice");
      }
    } catch {
      alert("Error converting quotation");
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to create quotation");
      }
    } catch {
      alert("Error creating quotation");
    }
  };

  const handleDeleteQuotation = async (id: string, quotationNumber: string) => {
    if (!confirm(`Are you sure you want to delete quotation "${quotationNumber}"?`)) return;

    try {
      const res = await fetch(`/api/quotations?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchQuotations();
      } else {
        alert(data.error || "Failed to delete quotation");
      }
    } catch {
      alert("Error deleting quotation");
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchQuotations();
      } else {
        alert(data.error || "Failed to update quotation status");
      }
    } catch {
      alert("Error updating quotation status");
    }
  };

  const openEditQuotation = (q: Quotation) => {
    setEditingQuotation(q);
    setEditFormData({
      title: q.title || "",
      status: q.status || "DRAFT",
      discount: q.discount || 0,
      validUntil: q.validUntil ? new Date(q.validUntil).toISOString().split("T")[0] : "",
      paymentTerms: q.paymentTerms || "",
      notes: q.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEditQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;

    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingQuotation.id,
          title: editFormData.title,
          status: editFormData.status,
          discount: Number(editFormData.discount),
          validUntil: editFormData.validUntil,
          paymentTerms: editFormData.paymentTerms,
          notes: editFormData.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowEditModal(false);
        setEditingQuotation(null);
        fetchQuotations();
      } else {
        alert(data.error || "Failed to update quotation");
      }
    } catch {
      alert("Error updating quotation");
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItemField = (index: number, field: string, val: string | number) => {
    const updated = [...formData.items];
    updated[index] = { ...updated[index], [field]: val };
    setFormData({ ...formData, items: updated });
  };

  // Live total computation for builder modal
  const subtotalComputed = formData.items.reduce(
    (acc, it) => acc + Number(it.quantity || 1) * Number(it.unitPrice || 0),
    0
  );
  const taxableComputed = Math.max(0, subtotalComputed - Number(formData.discount || 0));
  const taxComputed = Math.round((taxableComputed * Number(formData.taxRate || 18)) / 100);
  const grandTotalComputed = taxableComputed + taxComputed;

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.customer.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Commercial Quotations & Proposals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate formal itemized quotations, push directly to Customer Portal for e-signoff, and export high-resolution PDFs.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              customerId: customers[0]?.id || "",
              title: "",
              discount: 0,
              taxRate: 18,
              paymentTerms: "30% Advance Mobilization, 40% Milestone 2 Delivery, 30% Final Sign-off",
              notes: "Includes 12 months comprehensive maintenance and 99.9% uptime SLA.",
              items: [
                { description: "Phase 1: Architecture, UI/UX System & Database Modeling", quantity: 1, unitPrice: 350000 },
                { description: "Phase 2: Core Platform Development & API Integrations", quantity: 1, unitPrice: 500000 },
              ],
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Quotation</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quote number, title, or client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Quotation No / Title</th>
                <th className="py-3.5 px-4">Customer Client</th>
                <th className="py-3.5 px-4">Gross Total (Inc GST)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Valid Until</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotations.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-sky-600 block">{q.quotationNumber}</span>
                    <span className="font-semibold text-slate-800 text-xs">{q.title}</span>
                    {q.project && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Project: {q.project.name}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{q.customer.companyName}</p>
                    <p className="text-[11px] text-slate-400">{q.customer.user.name}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 text-sm block">
                      {formatCurrency(q.totalAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Subtotal: {formatCurrency(q.subtotal)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={q.status}
                      onChange={(e) => handleQuickStatusChange(q.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                        q.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : q.status === "CONVERTED_TO_INVOICE"
                          ? "bg-purple-50 text-purple-700 border-purple-300"
                          : q.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border-rose-300"
                          : q.status === "SENT"
                          ? "bg-sky-50 text-sky-700 border-sky-300"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}
                      title="Click to quickly modify quotation status"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="SENT">SENT</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="CONVERTED_TO_INVOICE">CONVERTED_TO_INVOICE</option>
                    </select>
                    {q.clientResponse && (
                      <p className="text-[10px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                        &quot;{q.clientResponse}&quot;
                      </p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{formatDate(q.validUntil)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownloadPdf(q)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => openEditQuotation(q)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        title="Modify Quotation Details"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                        <span>Edit</span>
                      </button>

                      {q.status === "APPROVED" && (
                        <button
                          onClick={() => handleConvertToInvoice(q.id)}
                          className="px-2 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                          title="Convert to Tax Invoice"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Convert</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteQuotation(q.id, q.quotationNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Delete Quotation"
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
      </div>

      {/* CREATE QUOTATION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Build Commercial Quotation</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Customer *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select Customer...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quotation Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. ERP Development & Fleet Suite"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Service Line Items & Deliverables
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-sky-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        required
                        placeholder="Deliverable description..."
                        value={item.description}
                        onChange={(e) => updateItemField(idx, "description", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItemField(idx, "quantity", Number(e.target.value))}
                        className="w-16 px-2 py-1.5 rounded border border-slate-300 text-xs text-center"
                      />
                      <input
                        type="number"
                        placeholder="Rate (INR)"
                        value={item.unitPrice}
                        onChange={(e) => updateItemField(idx, "unitPrice", Number(e.target.value))}
                        className="w-28 px-2 py-1.5 rounded border border-slate-300 text-xs text-right"
                      />
                      <span className="w-24 text-right font-bold text-slate-800">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5">Discount Amount (INR)</label>
                    <input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5">Payment Milestones</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="text-right space-y-1.5 pt-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(subtotalComputed)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (18%):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(taxComputed)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm border-t pt-1">
                    <span>Total Amount:</span>
                    <span className="text-sky-600 font-extrabold">{formatCurrency(grandTotalComputed)}</span>
                  </div>
                </div>
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
                  Issue & Push to Client Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODIFY / EDIT QUOTATION MODAL */}
      {showEditModal && editingQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modify Commercial Quotation</h3>
                <p className="text-xs text-slate-500">Quote: {editingQuotation.quotationNumber} • {editingQuotation.customer.companyName}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditQuotation} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">SUBTOTAL</span>
                  <span className="font-bold text-slate-900 text-xs">{formatCurrency(editingQuotation.subtotal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">TOTAL AMOUNT</span>
                  <span className="font-bold text-sky-600 text-xs">{formatCurrency(editingQuotation.totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposal Title *</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status *</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="CONVERTED_TO_INVOICE">CONVERTED_TO_INVOICE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={editFormData.validUntil}
                    onChange={(e) => setEditFormData({ ...editFormData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editFormData.discount}
                  onChange={(e) => setEditFormData({ ...editFormData, discount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Commercial Payment Terms</label>
                <textarea
                  rows={2}
                  value={editFormData.paymentTerms}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">SLA & Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    handleDeleteQuotation(editingQuotation.id, editingQuotation.quotationNumber);
                  }}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Quotation</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 text-xs cursor-pointer shadow-xs"
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
