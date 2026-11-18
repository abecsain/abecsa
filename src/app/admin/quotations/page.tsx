"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  ShieldCheck,
  UserCheck,
  Building2,
  Sparkles,
  Layers,
  ExternalLink,
  PenTool,
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
  termsConditions: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
    address: string | null;
    user: { name: string; email: string; phone: string | null };
  };
  project: { id: string; projectId: string; name: string; manager?: { name: string } } | null;
  items: QuotationItem[];
  metadata?: {
    agreementTitle?: string;
    assignedManagerId?: string;
    assignedManagerName?: string;
    eSignature?: string;
    signedByName?: string;
    signedAt?: string;
    signedDesignation?: string;
    signedByDesignation?: string;
    signedIp?: string;
    verificationHash?: string;
  };
}

export default function AdminQuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningQuotation, setAssigningQuotation] = useState<Quotation | null>(null);
  const [selectedNewManagerId, setSelectedNewManagerId] = useState("");
  const [selectedNewCustomerId, setSelectedNewCustomerId] = useState("");

  // Create Form State
  const [createStep, setCreateStep] = useState<"DETAILS" | "ITEMS" | "AGREEMENT">("DETAILS");
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    newClient: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      gstNumber: "",
      address: "",
      businessType: "Corporate Enterprise",
    },
    projectId: "",
    newProject: {
      name: "",
      serviceCategory: "Custom Web Application",
      techStack: "Next.js 16, React 19, TypeScript, PostgreSQL",
      budget: 500000,
      deliveryDate: "",
      description: "",
    },
    managerId: "",
    title: "",
    agreementTitle: "Master Software Services & Cloud Engineering Agreement",
    discount: 0,
    taxRate: 18,
    paymentTerms: "30% Advance Mobilization, 40% Milestone 2 Delivery, 30% Final Sign-off",
    validUntil: "",
    notes: "Includes 12 months comprehensive warranty, cloud deployment, and 99.9% uptime SLA.",
    termsConditions: getDefaultAgreementTerms(),
    items: [
      { description: "Phase 1: Architecture, UI/UX System & Database Modeling", quantity: 1, unitPrice: 250000 },
      { description: "Phase 2: Core Platform Development & API Integrations", quantity: 1, unitPrice: 350000 },
    ],
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.quotations) setQuotations(data.quotations);
      if (data.customers) setCustomers(data.customers);
      if (data.managers) setManagers(data.managers);
      if (data.projects) setProjects(data.projects);

      // Pre-fill manager if exists
      if (data.managers?.length > 0 && !formData.managerId) {
        setFormData((prev) => ({ ...prev, managerId: data.managers[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Add Item to Line Items Table
  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: "", quantity: 1, unitPrice: 50000 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // Compute live subtotal & grand total
  const computeSubtotal = () =>
    formData.items.reduce((sum, it) => sum + Number(it.quantity || 1) * Number(it.unitPrice || 0), 0);
  const computeTaxable = () => Math.max(0, computeSubtotal() - Number(formData.discount || 0));
  const computeTax = () => Math.round((computeTaxable() * Number(formData.taxRate || 18)) / 100);
  const computeGrandTotal = () => computeTaxable() + computeTax();

  // Create Quotation Handler
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a Proposal Title.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        agreementTitle: formData.agreementTitle,
        managerId: formData.managerId || undefined,
        discount: Number(formData.discount),
        taxRate: Number(formData.taxRate),
        paymentTerms: formData.paymentTerms,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes,
        termsConditions: formData.termsConditions,
        items: formData.items,
        status: "SENT",
      };

      if (isNewClient) {
        payload.newClient = formData.newClient;
      } else {
        payload.customerId = formData.customerId;
      }

      if (isNewProject) {
        payload.newProject = formData.newProject;
      } else if (formData.projectId) {
        payload.projectId = formData.projectId;
      }

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        fetchData();
        alert(`Quotation ${data.quotation.quotationNumber} successfully created and presented!`);
      } else {
        alert(data.error || "Failed to create quotation.");
      }
    } catch {
      alert("Error creating quotation proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  // Assign / Reassign Handler
  const handleReassign = async () => {
    if (!assigningQuotation) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assigningQuotation.id,
          action: "ASSIGN",
          managerId: selectedNewManagerId || undefined,
          customerId: selectedNewCustomerId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAssignModal(false);
        fetchData();
        alert("Assignment updated successfully!");
      } else {
        alert(data.error || "Failed to update assignment.");
      }
    } catch {
      alert("Error updating assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Convert Quotation to Tax Invoice
  const handleConvertToInvoice = async (quotationId: string) => {
    if (!confirm("Generate a formal Tax Invoice from this quotation?")) return;
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotationId,
          convertToInvoice: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Quotation converted to Invoice!");
        fetchData();
      } else {
        alert(data.error || "Conversion failed.");
      }
    } catch {
      alert("Error converting to invoice.");
    }
  };

  // Convert Quotation to Active Project
  const handleConvertToProject = async (quotationId: string) => {
    if (!confirm("Activate this proposal as a live project with milestone tracking?")) return;
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotationId,
          convertToProject: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Project activated!");
        fetchData();
      } else {
        alert(data.error || "Conversion failed.");
      }
    } catch {
      alert("Error activating project.");
    }
  };

  // Delete Quotation
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/quotations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete quotation.");
      }
    } catch {
      alert("Network error.");
    }
  };

  // Download PDF
  const handleDownloadPdf = (q: Quotation) => {
    const meta = q.metadata || {};
    const doc = generateQuotationPdf({
      quotationNumber: q.quotationNumber,
      title: q.title,
      customerName: q.customer?.user?.name || "Client",
      companyName: q.customer?.companyName || "Organization",
      customerAddress: q.customer?.address || undefined,
      customerPhone: q.customer?.user?.phone || undefined,
      customerEmail: q.customer?.user?.email,
      managerName: meta.assignedManagerName || q.project?.manager?.name || undefined,
      date: formatDate(q.createdAt),
      validUntil: formatDate(q.validUntil),
      items: q.items || [],
      subtotal: q.subtotal,
      discount: q.discount,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      totalAmount: q.totalAmount,
      paymentTerms: q.paymentTerms || undefined,
      notes: q.notes || undefined,
      termsConditions: q.termsConditions || undefined,
      eSignature: meta.eSignature || undefined,
      signedByName: meta.signedByName || undefined,
      signedAt: meta.signedAt ? formatDate(meta.signedAt) : undefined,
      signedDesignation: meta.signedByDesignation || undefined,
      signedIp: meta.signedIp || undefined,
      verificationHash: meta.verificationHash || undefined,
    });
    doc.save(`${q.quotationNumber}_Agreement_ABECSA.pdf`);
  };

  // Filtered Quotations
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (q.metadata?.assignedManagerName || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && q.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              COMMERCIAL OPERATING SYSTEM
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Quotation, Agreement & E-Sign Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build proposals, assign Delivery Managers & Clients, generate Master T&C Agreements, and collect digital E-Signatures online.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateStep("DETAILS");
            setShowCreateModal(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Quotation & Agreement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search quotation #, client, manager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "SENT", "APPROVED", "CONVERTED_TO_INVOICE", "CONVERTED_TO_PROJECT", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-sky-500 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List */}
      <div className="space-y-4">
        {filteredQuotations.map((q) => {
          const meta = q.metadata || {};
          const isSigned = Boolean(meta.signedByName || meta.eSignature);
          const managerName = meta.assignedManagerName || q.project?.manager?.name || "Unassigned";

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-sky-300 transition-all space-y-4"
            >
              {/* Row 1: Quotation Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-sky-600 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200">
                      {q.quotationNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        q.status === "APPROVED" || q.status === "CONVERTED_TO_INVOICE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {q.status}
                    </span>

                    {/* E-Signature Seal Badge */}
                    {isSigned ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>E-Signed by {meta.signedByName}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Pending E-Sign</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400">Total Contract Value</p>
                  <p className="text-lg font-black text-sky-600">{formatCurrency(q.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400">Valid: {formatDate(q.validUntil)}</p>
                </div>
              </div>

              {/* Row 2: Stakeholders (Client + Manager) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Client Organization</p>
                  <p className="font-bold text-slate-900">{q.customer.companyName}</p>
                  <p className="text-slate-500 text-[11px]">{q.customer.user.name} ({q.customer.user.email})</p>
                </div>

                <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100 space-y-1">
                  <p className="text-[10px] font-bold text-sky-700 uppercase">Assigned Delivery Manager</p>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>{managerName}</span>
                  </p>
                  <p className="text-slate-500 text-[11px]">Oversees sprint deliverables & client sync</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Linked Project</p>
                  <p className="font-bold text-slate-900 truncate">
                    {q.project?.name || "Not yet linked to active project"}
                  </p>
                  <p className="text-slate-500 text-[11px]">{q.items?.length || 0} scope milestones defined</p>
                </div>
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {/* Reassign Button */}
                  <button
                    onClick={() => {
                      setAssigningQuotation(q);
                      setSelectedNewManagerId(meta.assignedManagerId || "");
                      setSelectedNewCustomerId(q.customer.id);
                      setShowAssignModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Assign / Reassign</span>
                  </button>

                  {/* Public Web Presentation Link */}
                  <Link
                    href={`/quotations/${q.id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-50 text-xs font-semibold text-sky-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Present on Website</span>
                  </Link>

                  {/* PDF Download */}
                  <button
                    onClick={() => handleDownloadPdf(q)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Convert to Project */}
                  {q.status !== "CONVERTED_TO_PROJECT" && (
                    <button
                      onClick={() => handleConvertToProject(q.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Activate Project</span>
                    </button>
                  )}

                  {/* Convert to Invoice */}
                  {q.status !== "CONVERTED_TO_INVOICE" && (
                    <button
                      onClick={() => handleConvertToInvoice(q.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Generate Invoice</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete Quotation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  COMMERCIAL ENGINE
                </span>
                <h3 className="text-base font-bold text-white">Create Quotation & Master Agreement</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => setCreateStep("DETAILS")}
                className={`py-3 transition-colors cursor-pointer ${
                  createStep === "DETAILS" ? "bg-white text-sky-600 border-b-2 border-sky-600" : "text-slate-500"
                }`}
              >
                1. Project & Client
              </button>
              <button
                type="button"
                onClick={() => setCreateStep("ITEMS")}
                className={`py-3 transition-colors cursor-pointer ${
                  createStep === "ITEMS" ? "bg-white text-sky-600 border-b-2 border-sky-600" : "text-slate-500"
                }`}
              >
                2. Scope & Pricing
              </button>
              <button
                type="button"
                onClick={() => setCreateStep("AGREEMENT")}
                className={`py-3 transition-colors cursor-pointer ${
                  createStep === "AGREEMENT" ? "bg-white text-sky-600 border-b-2 border-sky-600" : "text-slate-500"
                }`}
              >
                3. T&C & Agreement
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-5 text-xs">
              {/* STEP 1: PROJECT & CLIENT DETAILS */}
              {createStep === "DETAILS" && (
                <div className="space-y-4">
                  {/* Proposal Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proposal / Quotation Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Enterprise ERP & Automated WhatsApp Suite"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  {/* Assign Delivery Manager */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designate Delivery Manager *
                    </label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="">-- Select Manager --</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role} - {m.jobTitle || m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Client Details Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        <span>Client Information</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewClient(false)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            !isNewClient ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-500"
                          }`}
                        >
                          Select Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNewClient(true)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            isNewClient ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-500"
                          }`}
                        >
                          + New Client
                        </button>
                      </div>
                    </div>

                    {!isNewClient ? (
                      <div>
                        <select
                          value={formData.customerId}
                          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                        >
                          <option value="">-- Choose Client Profile --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.companyName} ({c.user?.name} - {c.user?.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Company Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Acme Global Logistics Ltd"
                            value={formData.newClient.companyName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, companyName: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Representative Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Ramesh Sharma"
                            value={formData.newClient.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, name: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email Address *</label>
                          <input
                            type="email"
                            placeholder="e.g. ramesh@acme.com"
                            value={formData.newClient.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, email: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Phone / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="e.g. +91 98765 43210"
                            value={formData.newClient.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, phone: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Project Details Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-sky-600" />
                        <span>Project Specification</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewProject(false)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            !isNewProject ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-500"
                          }`}
                        >
                          Link Existing Project
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNewProject(true)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            isNewProject ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-500"
                          }`}
                        >
                          + New Project
                        </button>
                      </div>
                    </div>

                    {!isNewProject ? (
                      <div>
                        <select
                          value={formData.projectId}
                          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                        >
                          <option value="">-- None (Stand-alone proposal) --</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.projectId}: {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Project Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. NextGen Unified Freight Telemetry"
                            value={formData.newProject.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newProject: { ...formData.newProject, name: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Service Category</label>
                          <select
                            value={formData.newProject.serviceCategory}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newProject: { ...formData.newProject, serviceCategory: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          >
                            <option value="Custom Web Application">Custom Web Application / SaaS</option>
                            <option value="Mobile App (iOS & Android)">Mobile App (iOS & Android)</option>
                            <option value="Enterprise Custom ERP & CRM">Enterprise Custom ERP & CRM</option>
                            <option value="Automated WhatsApp Engine & Bots">Automated WhatsApp Engine & Bots</option>
                            <option value="Cloud Infrastructure & DevOps">Cloud Infrastructure & DevOps</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: ITEMS & PRICING */}
              {createStep === "ITEMS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">Itemized Scope & Deliverables</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Deliverable Item</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formData.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-2"
                      >
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Description of milestone or module scope..."
                            value={it.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div className="w-16">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity}
                            onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                            className="w-full px-2 py-2 text-xs rounded-xl border border-slate-300 bg-white text-center focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={it.unitPrice}
                            onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-right focus:outline-none focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Financial Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Commercial Discount (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.discount}
                          onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Payment Milestones & Invoicing Terms
                        </label>
                        <input
                          type="text"
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-right self-end">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(computeSubtotal())}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>GST (18%):</span>
                        <span>{formatCurrency(computeTax())}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-slate-900 border-t pt-1">
                        <span>Grand Total:</span>
                        <span className="text-sky-600">{formatCurrency(computeGrandTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: T&C & MASTER AGREEMENT */}
              {createStep === "AGREEMENT" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Master Agreement Title
                    </label>
                    <input
                      type="text"
                      value={formData.agreementTitle}
                      onChange={(e) => setFormData({ ...formData, agreementTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Terms & Conditions / Master Contract Clauses (Editable)
                    </label>
                    <textarea
                      rows={10}
                      value={formData.termsConditions}
                      onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                      className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>
                      E-Sign requirement is enabled. The Client will be able to review all clauses and digitally sign this agreement.
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  {createStep !== "DETAILS" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (createStep === "AGREEMENT") setCreateStep("ITEMS");
                        else if (createStep === "ITEMS") setCreateStep("DETAILS");
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      ← Back
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {createStep !== "AGREEMENT" ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (createStep === "DETAILS") setCreateStep("ITEMS");
                        else if (createStep === "ITEMS") setCreateStep("AGREEMENT");
                      }}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer transition-colors"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/30 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                    >
                      {submitting ? "Generating..." : "Generate Proposal & Send to Client"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign / Reassign Modal */}
      {showAssignModal && assigningQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase">Assignment Controller</span>
                <h3 className="text-sm font-bold text-slate-900">
                  Assign {assigningQuotation.quotationNumber}
                </h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reassign Delivery Manager
                </label>
                <select
                  value={selectedNewManagerId}
                  onChange={(e) => setSelectedNewManagerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">-- Unassigned --</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reassign Client Profile
                </label>
                <select
                  value={selectedNewCustomerId}
                  onChange={(e) => setSelectedNewCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.user?.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                {submitting ? "Updating..." : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultAgreementTerms(): string {
  return `MASTER SOFTWARE SERVICES & CLOUD ENGINEERING AGREEMENT

1. SCOPE OF SERVICES & DELIVERABLES:
ABECSA Software Solutions ("Service Provider") agrees to design, architect, engineer, and deploy the bespoke software system specified in this proposal for the Client. All development sprints will be delivered according to agreed technical specifications, acceptance criteria, and mobile-first responsive standards.

2. COMMERCIAL CONSIDERATION & PAYMENT SCHEDULE:
The Client agrees to remit payment in accordance with the payment milestones detailed in this quotation.
- Mobilization Advance: Due upon formal execution of this agreement.
- Staging & Intermediate Sprints: Due upon milestone staging deployment and client demonstration.
- Final Acceptance & Code Handover: Due upon complete QA verification and production deployment.
All statutory taxes (GST @ 18%) are applied as indicated.

3. INTELLECTUAL PROPERTY & SOURCE CODE OWNERSHIP:
Upon full and final settlement of all commercial invoices, 100% unrestricted intellectual property (IP) rights, proprietary source code, software architecture artifacts, and database schemas shall be transferred exclusively to the Client. The Service Provider retains no residual rights except the non-exclusive privilege to reference the delivered project in professional engineering portfolios.

4. CONFIDENTIALITY & NON-DISCLOSURE (NDA):
Both parties mutually pledge to protect all proprietary business logic, financial data, API credentials, customer records, and trade secrets with utmost confidentiality. No confidential information shall be disclosed to any third party without express written authorization.

5. SERVICE LEVEL AGREEMENT (SLA) & 12-MONTH WARRANTY:
The Service Provider provides a comprehensive 12-month post-launch warranty covering all reproducible defects, software bugs, and security vulnerability patches without additional assessment charges. Technical support is guaranteed under standard business SLA (response within 4 hours; critical resolution within 24 hours).

6. LEGAL JURISDICTION & DIGITAL EXECUTION:
This agreement is governed by the laws of India. Any unresolved dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka. Execution of this document via electronic signature (E-Sign) shall carry the full legal validity, binding power, and admissibility of an original handwritten wet-ink signature.`;
}
