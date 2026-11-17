"use client";

import { useEffect, useState } from "react";
import {
  LifeBuoy,
  Search,
  MessageSquare,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Send,
  Lock,
  Trash2,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  customer: { companyName: string; user: { name: string; email: string } };
  project: { name: string } | null;
  assignedTo: { id: string; name: string } | null;
  messages: Array<{
    id: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
    sender: { name: string; role: string };
  }>;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [engineers, setEngineers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchEngineers();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
        if (selectedTicket) {
          const updated = data.tickets.find((t: SupportTicket) => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await fetch("/api/users?role=ENGINEER");
      const data = await res.json();
      if (data.users) setEngineers(data.users);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignTicket = async (ticketId: string, engineerId: string) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, assignedToId: engineerId }),
      });
      if (res.ok) fetchTickets();
    } catch {
      alert("Error assigning ticket");
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, status: newStatus }),
      });
      if (res.ok) fetchTickets();
    } catch {
      alert("Error updating status");
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNum: string) => {
    if (!confirm(`Are you sure you want to delete ticket "${ticketNum}"?`)) return;
    try {
      const res = await fetch(`/api/tickets?id=${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedTicket(null);
        fetchTickets();
      } else {
        alert("Failed to delete ticket");
      }
    } catch {
      alert("Error deleting ticket");
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
          isInternal: isInternalNote,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setIsInternalNote(false);
        fetchTickets();
      }
    } catch {
      alert("Error sending response");
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Client Support & Issue Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Triage incoming client inquiries, assign bug fixes to lead software engineers, and respond with transparent resolution updates.
        </p>
      </div>

      {/* Two Column Workspace: Ticket List & Conversation Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tickets Queue ({tickets.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTicket(t)}
                className={`p-4 cursor-pointer transition-colors space-y-2 ${
                  selectedTicket?.id === t.id ? "bg-sky-50/70 border-l-4 border-l-sky-600" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-sky-600">{t.ticketNumber}</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full border ${
                      t.status === "RESOLVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : t.status === "IN_PROGRESS"
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{t.subject}</h4>
                <p className="text-[11px] text-slate-500">{t.customer.companyName}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Assigned: {t.assignedTo?.name || "Unassigned"}</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Ticket Conversation */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px]">
          {selectedTicket ? (
            <>
              {/* Ticket Top Info */}
              <div className="p-4 border-b border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 uppercase">
                      {selectedTicket.ticketNumber} • {selectedTicket.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h3>
                    <p className="text-[11px] text-slate-500">
                      Client: {selectedTicket.customer.companyName} ({selectedTicket.customer.user.name})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTicket.assignedTo?.id || ""}
                      onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                      className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="">Assign Engineer...</option>
                      {engineers.map((eng) => (
                        <option key={eng.id} value={eng.id}>{eng.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="OPEN">Open</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id, selectedTicket.ticketNumber)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete Ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl text-xs space-y-1 max-w-[85%] ${
                      msg.isInternal
                        ? "bg-amber-50 border border-amber-200 text-amber-900 ml-auto"
                        : msg.sender.role === "CUSTOMER"
                        ? "bg-slate-100 text-slate-800"
                        : "bg-sky-50 border border-sky-200 text-sky-950 ml-auto"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-bold flex items-center gap-1">
                        {msg.isInternal && <Lock className="w-3 h-3 text-amber-700" />}
                        {msg.sender.name} ({msg.sender.role})
                      </span>
                      <span>{formatDateTime(msg.createdAt)}</span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-100 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Write Response / Internal Note:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-800 font-semibold text-[11px]">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                    />
                    <span>Internal Note (Hidden from Customer)</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? "Add private internal engineering note..."
                        : "Send reply to customer..."
                    }
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className={`px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1 shrink-0 ${
                      isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-sky-600 hover:bg-sky-700"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a ticket from the left queue to view messages and respond.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
