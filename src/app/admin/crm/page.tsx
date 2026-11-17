"use client";

import { useEffect, useState } from "react";
import {
  Target,
  Search,
  Filter,
  Plus,
  ArrowRight,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  Users,
  Sparkles,
  Building,
  UserCheck,
  X,
  FileText,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Lead {
  id: string;
  leadNumber: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  serviceInterested: string | null;
  budgetRange: string | null;
  preferredContact: string;
  message: string | null;
  status: string;
  score: number;
  createdAt: string;
  assignedManager: { id: string; name: string } | null;
  activities: Array<{ id: string; activityType: string; notes: string; createdAt: string }>;
}

export default function AdminCrmPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [noteText, setNoteText] = useState("");
  const [converting, setConverting] = useState(false);

  // New Lead Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    serviceInterested: "Custom Enterprise Software",
    budgetRange: "₹5,00,000 - ₹15,00,000",
    message: "",
  });
  const [submittingLead, setSubmittingLead] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.email) return;

    setSubmittingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setNewLead({
          name: "",
          email: "",
          phone: "",
          companyName: "",
          serviceInterested: "Custom Enterprise Software",
          budgetRange: "₹5,00,000 - ₹15,00,000",
          message: "",
        });
        fetchLeads();
      } else {
        alert(data.error || "Failed to create lead");
      }
    } catch {
      alert("Error adding lead");
    } finally {
      setSubmittingLead(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete lead "${name}"?`)) return;

    try {
      const res = await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedLead(null);
        fetchLeads();
      } else {
        alert(data.error || "Failed to delete lead");
      }
    } catch {
      alert("Error deleting lead");
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      if (res.ok) fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConvertToCustomer = async (leadId: string) => {
    if (!confirm("Convert this lead into an active Customer Account and initialize Project workspace?")) return;

    setConverting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, action: "CONVERT_TO_CUSTOMER" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setSelectedLead(null);
        fetchLeads();
      } else {
        alert(data.error || "Failed to convert lead");
      }
    } catch {
      alert("Error converting lead");
    } finally {
      setConverting(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !noteText) return;

    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedLead.id, notes: noteText }),
      });

      if (res.ok) {
        setNoteText("");
        fetchLeads();
        // Update selected lead state
        setSelectedLead((prev) =>
          prev
            ? {
                ...prev,
                activities: [
                  {
                    id: String(Date.now()),
                    activityType: "NOTE",
                    notes: noteText,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev.activities,
                ],
              }
            : null
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const stages = [
    { key: "NEW_LEAD", label: "New Inquiries", color: "border-sky-500 bg-sky-50 text-sky-700" },
    { key: "DISCOVERY", label: "Discovery Call", color: "border-blue-500 bg-blue-50 text-blue-700" },
    { key: "QUOTATION_SENT", label: "Quotation Sent", color: "border-amber-500 bg-amber-50 text-amber-700" },
    { key: "NEGOTIATION", label: "In Negotiation", color: "border-purple-500 bg-purple-50 text-purple-700" },
    { key: "CONVERTED", label: "Converted Clients", color: "border-emerald-500 bg-emerald-50 text-emerald-700" },
  ];

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      l.leadNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Enterprise CRM & Sales Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated lead capture, quotation follow-ups, and one-click conversion to Client Account + Project Workspace.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            {leads.filter((l) => l.status === "CONVERTED").length} Converted to Customers
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inbound Lead</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, company, or lead ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.status === stage.key);
          return (
            <div
              key={stage.key}
              className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[230px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${stage.color}`}>
                  {stage.label}
                </span>
                <span className="text-xs font-extrabold text-slate-600">{stageLeads.length}</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-sky-400 hover:shadow-md transition-all cursor-pointer space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">{lead.leadNumber}</span>
                      <span className="text-[10px] font-bold text-sky-600 px-1.5 py-0.2 rounded bg-sky-50">
                        Score: {lead.score}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{lead.name}</h4>
                      {lead.companyName && (
                        <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3" />
                          <span className="truncate">{lead.companyName}</span>
                        </p>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {lead.serviceInterested}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>{lead.budgetRange || "Flexible"}</span>
                      {lead.preferredContact === "WHATSAPP" ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <MessageSquare className="w-3 h-3" />
                          WA
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sky-600 font-bold">
                          <Mail className="w-3 h-3" />
                          Email
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* LEAD DETAILS & ACTIONS MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                  {selectedLead.leadNumber}
                </span>
                <h3 className="text-xl font-bold text-slate-900">{selectedLead.name}</h3>
                <p className="text-xs text-slate-500">{selectedLead.companyName || "Direct Inquiry"}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDeleteLead(selectedLead.id, selectedLead.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                  title="Delete Lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Stage:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="NEW_LEAD">New Lead</option>
                  <option value="DISCOVERY">Discovery Call</option>
                  <option value="QUOTATION_SENT">Quotation Sent</option>
                  <option value="NEGOTIATION">In Negotiation</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>

              {selectedLead.status !== "CONVERTED" && (
                <button
                  disabled={converting}
                  onClick={() => handleConvertToCustomer(selectedLead.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{converting ? "Provisioning..." : "Convert to Customer & Project"}</span>
                </button>
              )}
            </div>

            {/* Inbound Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Email</span>
                <span className="font-semibold text-slate-800">{selectedLead.email}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Phone</span>
                <span className="font-semibold text-slate-800">{selectedLead.phone || "N/A"}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Budget Range</span>
                <span className="font-semibold text-slate-800">{selectedLead.budgetRange}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Lead Score</span>
                <span className="font-semibold text-sky-600">{selectedLead.score} / 100</span>
              </div>
            </div>

            {selectedLead.message && (
              <div className="text-xs">
                <span className="font-bold text-slate-700 block mb-1">Requirement Brief:</span>
                <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedLead.message}
                </p>
              </div>
            )}

            {/* Follow-up Activities & Notes */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Activity & Conversation Notes
              </h4>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Log call notes, client meeting summary, next steps..."
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700 shrink-0"
                >
                  Add Note
                </button>
              </form>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedLead.activities && selectedLead.activities.length > 0 ? (
                  selectedLead.activities.map((act) => (
                    <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <p className="text-slate-800 leading-relaxed">{act.notes}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {formatDate(act.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-2">No notes logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Add New Inbound Lead</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="e.g. Vikram Singhania"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={newLead.companyName}
                    onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
                    placeholder="Singhania Logistics Ltd"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="vikram@singhania.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+91 98200 12345"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Service Interested</label>
                  <select
                    value={newLead.serviceInterested}
                    onChange={(e) => setNewLead({ ...newLead, serviceInterested: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Custom Enterprise Software">Custom Enterprise Software</option>
                    <option value="ERP & Supply Chain Solutions">ERP & Supply Chain Solutions</option>
                    <option value="Web & Mobile App Development">Web & Mobile App Development</option>
                    <option value="AI & Machine Learning Solutions">AI & Machine Learning Solutions</option>
                    <option value="Software Maintenance & Support">Software Maintenance & Support</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Budget Expectation</label>
                  <select
                    value={newLead.budgetRange}
                    onChange={(e) => setNewLead({ ...newLead, budgetRange: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="₹1,00,000 - ₹3,00,000">₹1,00,000 - ₹3,00,000</option>
                    <option value="₹3,00,000 - ₹5,00,000">₹3,00,000 - ₹5,00,000</option>
                    <option value="₹5,00,000 - ₹15,00,000">₹5,00,000 - ₹15,00,000</option>
                    <option value="₹15,00,000 - ₹50,00,000">₹15,00,000 - ₹50,00,000</option>
                    <option value="₹50,00,000+ Enterprise">₹50,00,000+ Enterprise</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requirement Notes</label>
                <textarea
                  rows={3}
                  value={newLead.message}
                  onChange={(e) => setNewLead({ ...newLead, message: e.target.value })}
                  placeholder="Client requirements, business workflow summary, target launch date..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="px-5 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer"
                >
                  {submittingLead ? "Adding..." : "Save CRM Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
