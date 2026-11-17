"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Smartphone,
  CheckCheck,
  ExternalLink,
  ShieldCheck,
  Save,
  Server,
  Zap,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface WhatsAppMessage {
  id: string;
  recipientPhone: string;
  recipientName: string | null;
  content: string;
  status: string;
  sentAt: string;
}

interface WhatsAppAccount {
  id: string;
  accountType: string;
  phoneNumber: string | null;
  connectionStatus: string;
  lastHeartbeat: string | null;
  messages?: WhatsAppMessage[];
}

interface CustomerItem {
  id: string;
  companyName: string;
  user: {
    name: string;
    phone: string | null;
  };
  projects: Array<{ id: string; name: string }>;
}

export default function ManagerWhatsAppPage() {
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Phone Configuration
  const [customPhone, setCustomPhone] = useState("+91 98765 11111");
  const [savingPhone, setSavingPhone] = useState(false);

  // Quick Action Templates
  const quickTemplates = [
    {
      title: "Welcome Greeting",
      text: "Hello {{customer_name}}, welcome to ABECSA Software Solutions! I am Vikram Malhotra, your dedicated Project Delivery Manager. Your client portal is ready at https://abecsa.in/customer.",
    },
    {
      title: "Sprint Kickoff",
      text: "Dear {{customer_name}}, Sprint 1 for {{project_name}} has officially commenced! You can track live daily tasks and milestones in your portal.",
    },
    {
      title: "Milestone Completed",
      text: "Great news {{customer_name}}! Our engineering squad has completed the milestone for {{project_name}}. The staging sandbox is ready for your review: https://abecsa.in/customer.",
    },
    {
      title: "Quotation Shared",
      text: "Hi {{customer_name}}, we have uploaded your detailed quotation for {{project_name}}. Please review and approve directly in your portal: https://abecsa.in/customer/quotations.",
    },
    {
      title: "Payment Reminder",
      text: "Friendly reminder {{customer_name}}: Invoice for {{project_name}} is due on {{due_date}}. You can view bank remittance details online: https://abecsa.in/customer/invoices.",
    },
    {
      title: "Meeting Sync Reminder",
      text: "Hi {{customer_name}}, looking forward to our sprint sync today at 3:30 PM IST. Talk soon!",
    },
  ];

  // Composer State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [recipientPhone, setRecipientPhone] = useState("+91 98765 43214");
  const [recipientName, setRecipientName] = useState("Ananya Deshmukh");
  const [projectName, setProjectName] = useState("Enterprise ERP Suite");
  const [dueDate, setDueDate] = useState("15-Dec-2026");
  const [messageContent, setMessageContent] = useState("");
  const [autoOpenWeb, setAutoOpenWeb] = useState(true);
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchWhatsApp();
  }, []);

  const fetchWhatsApp = async () => {
    try {
      const res = await fetch("/api/whatsapp?type=MANAGER_PERSONAL");
      const data = await res.json();
      if (data.account) {
        setAccount(data.account);
        setCustomPhone(data.account.phoneNumber || "+91 98765 11111");
      }
      if (data.customers) {
        setCustomers(data.customers);
        if (data.customers.length > 0) {
          applyCustomer(data.customers[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const applyCustomer = (c: CustomerItem) => {
    setSelectedCustomer(c);
    setRecipientName(c.user.name);
    setRecipientPhone(c.user.phone || "+91 98765 43214");
    if (c.projects && c.projects.length > 0) {
      setProjectName(c.projects[0].name);
    }
  };

  const applyTemplate = (templateText: string) => {
    const replaced = templateText
      .replace(/{{customer_name}}/g, recipientName || "Valued Client")
      .replace(/{{manager_name}}/g, "Vikram Malhotra")
      .replace(/{{company_name}}/g, selectedCustomer?.companyName || "NexaCorp")
      .replace(/{{project_name}}/g, projectName || "Enterprise Project")
      .replace(/{{due_date}}/g, dueDate);

    setMessageContent(replaced);
  };

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleSavePhone = async () => {
    if (!account || !customPhone) return;
    setSavingPhone(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: account.id, phoneNumber: customPhone }),
      });
      const data = await res.json();
      if (res.ok && data.account) {
        setAccount(data.account);
        showNotification("Manager phone number updated & active across all devices!");
      }
    } catch {
      alert("Failed to update phone number");
    } finally {
      setSavingPhone(false);
    }
  };

  const launchWhatsAppWebTab = (phoneTarget: string, messageBody: string) => {
    const cleanPhone = phoneTarget.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(messageBody);
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !messageContent) return;

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account?.id,
          recipientPhone,
          recipientName,
          content: messageContent,
          messageType: "GREETING",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Greeting dispatched to ${recipientPhone}!`);

        if (autoOpenWeb) {
          launchWhatsAppWebTab(recipientPhone, messageContent);
        }

        setMessageContent("");
        fetchWhatsApp();
      } else {
        alert(data.error || "Failed to send");
      }
    } catch {
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const messagesList = account?.messages || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {successNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Manager WhatsApp Web Gateway
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Dedicated operations channel for Vikram Malhotra. Centrally authenticated on ABECSA Enterprise Server. Usable from any device you sign in from.
          </p>
        </div>

        {/* Server Status & Web Link */}
        <div className="flex items-center gap-3">
          <a
            href="https://web.whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch WhatsApp Web</span>
          </a>

          <span className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>CONNECTED & ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Server Card & Message Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device & Central Server Details */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Manager Server Session</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Permanent Auth
              </span>
            </div>

            {/* Permanent Verified Connection Status */}
            <div className="p-5 bg-gradient-to-b from-emerald-50/70 to-emerald-50/20 rounded-2xl border border-emerald-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Linked to Manager Account</h4>
                  <p className="text-[11px] text-slate-500">
                    Active for <span className="font-semibold text-slate-700">manager@abecsa.in</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 pt-1 border-t border-emerald-100/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gateway Mode:</span>
                  <span className="font-bold text-slate-800">Multi-Device Server</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cross-Device Mobility:</span>
                  <span className="font-bold text-emerald-700">Any Device (Mobile / Laptop)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Connection Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Synchronized & Active
                  </span>
                </div>
              </div>
            </div>

            {/* Custom Phone Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Your Manager WhatsApp Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="+91 98765 11111"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-semibold"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPhone ? "..." : "Save"}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Messages dispatched from this console will be routed with this sender number.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Greetings Composer & 1-Click Templates */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="text-sm font-bold text-slate-900">1-Click Client Communications</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Smart Variable Insertion
            </span>
          </div>

          {/* Quick Template Pills */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
              Select Quick Greeting or Notification:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTemplates.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyTemplate(t.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-3.5 text-xs">
            {/* Target Client */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Client from Your Portfolio *
              </label>
              <select
                onChange={(e) => {
                  const found = customers.find((c) => c.id === e.target.value);
                  if (found) applyCustomer(found);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.user.name} - {c.user.phone || "No phone"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Phone *</label>
                <input
                  type="text"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name Variable</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date Variable</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
              <textarea
                rows={4}
                required
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Click any template above or type custom greeting..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Auto Launch Checkbox */}
            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={autoOpenWeb}
                  onChange={(e) => setAutoOpenWeb(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Also launch WhatsApp Web / App chat on send</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                Recommended
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="submit"
                disabled={sending || !messageContent || !recipientPhone}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? "Transmitting..." : "Send via Central Gateway"}</span>
              </button>

              <button
                type="button"
                onClick={() => launchWhatsAppWebTab(recipientPhone, messageContent)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in WhatsApp Web / App</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sent Message Logs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 pb-2 border-b">
          Manager Communication History ({messagesList.length})
        </h3>
        <div className="divide-y divide-slate-100">
          {messagesList.length > 0 ? (
            messagesList.map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{m.recipientName || m.recipientPhone}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">{m.content}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {m.status}
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{formatDateTime(m.sentAt)}</span>
                  </div>
                  <a
                    href={`https://web.whatsapp.com/send?phone=${m.recipientPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600"
                    title="Open in WhatsApp Web"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No recent messages sent.</p>
          )}
        </div>
      </div>
    </div>
  );
}
