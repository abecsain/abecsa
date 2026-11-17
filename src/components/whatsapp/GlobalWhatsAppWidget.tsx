"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  ExternalLink,
  CheckCircle2,
  QrCode,
  Sparkles,
  PhoneCall,
  Clock,
  ChevronDown,
} from "lucide-react";

interface GlobalWhatsAppWidgetProps {
  role: string;
}

export default function GlobalWhatsAppWidget({ role }: GlobalWhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Only display for Admin and Manager
  if (!["ADMIN", "MANAGER"].includes(role)) {
    return null;
  }

  // Load account data when widget opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const type = role === "ADMIN" ? "COMPANY_CENTRAL" : "MANAGER_PERSONAL";
      const res = await fetch(`/api/whatsapp?type=${type}`);
      const data = await res.json();
      if (data.account) setAccount(data.account);
      if (data.customers) setCustomers(data.customers);
      if (data.templates) setTemplates(data.templates);
    } catch (e) {
      console.error("WhatsApp widget error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setRecipientName(cust.user.name);
      setRecipientPhone(cust.user.phone || "");
    }
  };

  const handleQuickTemplate = (tmpl: any) => {
    let text = tmpl.bodyText || tmpl;
    text = text.replace(/{{customer_name}}/g, recipientName || "Valued Client");
    text = text.replace(/{{project_name}}/g, "Enterprise Suite");
    text = text.replace(/{{amount}}/g, "₹2,50,000");
    text = text.replace(/{{invoice_id}}/g, "INV-2026-001");
    text = text.replace(/{{link}}/g, "https://abecsa.in/customer");
    setMessageText(text);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !messageText) return;

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account?.id,
          recipientPhone,
          recipientName: recipientName || "Client",
          content: messageText,
          messageType: "CUSTOM_TEXT",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessToast(`Dispatched to ${recipientPhone}`);
        setMessageText("");
        setTimeout(() => setSuccessToast(null), 3000);
        loadData();
      } else {
        alert(data.error || "Failed to dispatch message");
      }
    } catch {
      alert("Error sending WhatsApp message");
    } finally {
      setSending(false);
    }
  };

  const openWhatsAppWeb = () => {
    if (!recipientPhone) {
      window.open("https://web.whatsapp.com", "_blank");
      return;
    }
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, "");
    const encodedText = encodeURIComponent(messageText || "Hello from ABECSA Software Solutions!");
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, "_blank");
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 font-bold text-xs transition-all transform hover:scale-105 cursor-pointer"
            title="Open WhatsApp Web Messenger"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <MessageSquare className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">WhatsApp Web</span>
          </button>
        )}
      </div>

      {/* Floating Drawer / Chat Assistant Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-fade-in max-h-[85vh]">
          {/* Header */}
          <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">
                  {role === "ADMIN" ? "ABECSA Official WhatsApp" : "Manager WhatsApp Web"}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>{account?.connectionStatus || "Connected"}</span>
                  <span>•</span>
                  <span>{account?.phoneNumber || "+91 98765 00000"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <a
                href={role === "ADMIN" ? "/admin/whatsapp" : "/manager/whatsapp"}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white"
                title="Full WhatsApp Console"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Success Banner */}
          {successToast && (
            <div className="bg-emerald-50 border-b border-emerald-100 text-emerald-800 px-4 py-2 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("compose")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === "compose"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Compose Message
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Recent Logs ({account?.messages?.length || 0})
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3.5 text-xs">
            {activeTab === "compose" ? (
              <form onSubmit={handleSendMessage} className="space-y-3">
                {/* Customer Directory Lookup */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Customer
                  </label>
                  <select
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="">Quick select from CRM customers...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.user.name} - {c.user.phone || "No phone"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Phone & Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Recipient Phone *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43214"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rajesh"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {/* Quick Templates */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quick Template
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      {
                        title: "Greeting",
                        bodyText: "Hello {{customer_name}}, welcome to ABECSA Software Solutions! Your client portal is ready at https://abecsa.in/customer.",
                      },
                      {
                        title: "Sprint Update",
                        bodyText: "Dear {{customer_name}}, your sprint for {{project_name}} is progressing smoothly. Check updates: https://abecsa.in/customer.",
                      },
                      {
                        title: "Quotation Link",
                        bodyText: "Hi {{customer_name}}, your detailed project quotation is ready for review: https://abecsa.in/customer/quotations.",
                      },
                      {
                        title: "Invoice Due",
                        bodyText: "Friendly reminder {{customer_name}}: Invoice for {{project_name}} is ready. View details: https://abecsa.in/customer/invoices.",
                      },
                    ].map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleQuickTemplate(t)}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition-colors"
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Body */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Message Content *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type WhatsApp message..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                {/* Dual Dispatch Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={sending || !recipientPhone || !messageText}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? "..." : "Send Cloud"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={openWhatsAppWeb}
                    className="py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>WhatsApp Web</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {account?.messages && account.messages.length > 0 ? (
                  account.messages.slice(0, 8).map((m: any) => (
                    <div key={m.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-[11px]">
                          {m.recipientName || "Client"} ({m.recipientPhone})
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[10px] line-clamp-2">{m.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-400 py-6 text-xs">No messages logged yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
