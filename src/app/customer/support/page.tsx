"use client";

import { useEffect, useState } from "react";
import {
  LifeBuoy,
  Plus,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function CustomerSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // New Ticket State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("BUG");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchProjects();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
        if (selectedTicket) {
          const updated = data.tickets.find((t: any) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) setProjectId(data.projects[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          description,
          category,
          priority,
          projectId: projectId || undefined,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSubject("");
        setDescription("");
        fetchTickets();
      }
    } catch {
      alert("Error creating ticket");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText) return;

    setSubmittingReply(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          message: replyText,
          isInternal: false,
        }),
      });

      if (res.ok) {
        setReplyText("");
        fetchTickets();
      }
    } catch {
      alert("Error sending message");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Client Support & Change Requests
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit bug reports, feature change requests, or speak directly with the engineers assigned to your platform.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[550px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              My Support Tickets ({tickets.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-4 cursor-pointer transition-colors space-y-1.5 ${
                  selectedTicket?.id === t.id ? "bg-sky-50/70 border-l-4 border-l-sky-600" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-sky-600">{t.ticketNumber}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full border ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                <p className="text-[10px] text-slate-400">{t.category} • {formatDateTime(t.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Ticket Conversation */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[550px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-slate-100">
                <span className="text-[10px] font-bold text-sky-600 uppercase">
                  {selectedTicket.ticketNumber} • {selectedTicket.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h3>
                <span className="text-[10px] text-slate-400">
                  Assigned Engineer: {selectedTicket.assignedTo?.name || "Support Squad"}
                </span>
              </div>

              {/* Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                      m.sender.role === "CUSTOMER"
                        ? "bg-sky-600 text-white ml-auto"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-80">
                      <span className="font-bold">{m.sender.name}</span>
                      <span>{formatDateTime(m.createdAt)}</span>
                    </div>
                    <p className="leading-relaxed">{m.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type message to assigned engineers..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                />
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a ticket on the left to view response history.
            </div>
          )}
        </div>
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-base font-bold text-slate-900">Raise Support Ticket</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Camera autofocus calibration on tablet"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="BUG">Bug Report</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="TECHNICAL">Technical Question</option>
                    <option value="BILLING">Billing / Invoicing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent Blocker</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what occurred, steps to reproduce, or requested adjustment..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-600 text-white font-bold"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
