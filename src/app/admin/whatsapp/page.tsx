"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  PhoneCall,
  Save,
  CheckCheck,
  Server,
  Zap,
  Globe,
  Radio,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface WhatsAppMessage {
  id: string;
  recipientPhone: string;
  recipientName: string | null;
  messageType: string;
  templateName: string | null;
  content: string;
  status: string;
  sentAt: string;
  deliveredAt: string | null;
  readAt: string | null;
}

interface WhatsAppAccount {
  id: string;
  accountType: string;
  phoneNumber: string | null;
  connectionStatus: string;
  lastHeartbeat: string | null;
  webhookUrl: string | null;
  messages?: WhatsAppMessage[];
}

interface Template {
  id: string;
  templateName: string;
  category: string;
  bodyText: string;
}

interface CustomerOption {
  id: string;
  companyName: string;
  user: {
    name: string;
    phone: string | null;
    email: string;
  };
}

export default function AdminWhatsAppPage() {
  const [account, setAccount] = useState<WhatsAppAccount | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Phone number configuration
  const [customPhone, setCustomPhone] = useState("+91 98765 43210");
  const [savingPhone, setSavingPhone] = useState(false);

  // Message Composer State
  const [recipientPhone, setRecipientPhone] = useState("+91 98765 43214");
  const [recipientName, setRecipientName] = useState("Ananya Deshmukh");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customText, setCustomText] = useState(
    "Hello Ananya! This is an official communication from ABECSA Software Solutions regarding your Enterprise Suite."
  );
  const [autoOpenWeb, setAutoOpenWeb] = useState(true);
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchWhatsApp();
  }, []);

  const fetchWhatsApp = async () => {
    try {
      const res = await fetch("/api/whatsapp?type=COMPANY_CENTRAL");
      const data = await res.json();
      if (data.account) {
        setAccount(data.account);
        setCustomPhone(data.account.phoneNumber || "+91 98765 43210");
      }
      if (data.templates) setTemplates(data.templates);
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
        showNotification("Company WhatsApp number updated & active across all devices!");
      }
    } catch {
      alert("Failed to update phone number");
    } finally {
      setSavingPhone(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  const handleSelectCustomer = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (cust) {
      setRecipientName(cust.user.name);
      setRecipientPhone(cust.user.phone || "");
    }
  };

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    const tmpl = templates.find((t) => t.templateName === templateName);
    if (tmpl) {
      let text = tmpl.bodyText;
      text = text.replace(/{{customer_name}}/g, recipientName || "Valued Client");
      text = text.replace(/{{project_name}}/g, "Enterprise Suite");
      text = text.replace(/{{amount}}/g, "₹2,50,000");
      text = text.replace(/{{invoice_id}}/g, "INV-2026-001");
      text = text.replace(/{{link}}/g, "https://abecsa.in/customer");
      setCustomText(text);
    }
  };

  const launchWhatsAppWebTab = (phoneTarget: string, messageBody: string) => {
    const cleanPhone = phoneTarget.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(messageBody);
    window.open(`https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !customText) return;

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account?.id,
          recipientPhone,
          recipientName: recipientName || "Enterprise Client",
          templateName: selectedTemplate || undefined,
          content: customText,
          messageType: selectedTemplate ? "TEMPLATE" : "CUSTOM_TEXT",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Message dispatched successfully via Central Server to ${recipientPhone}!`);

        // If auto-open is enabled, also open WhatsApp Web/App so user sees the message live
        if (autoOpenWeb) {
          launchWhatsAppWebTab(recipientPhone, customText);
        }

        fetchWhatsApp();
      } else {
        alert(data.error || "Failed to dispatch message");
      }
    } catch {
      alert("Error sending message via central server");
    } finally {
      setSending(false);
    }
  };

  const messagesList = account?.messages || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {successNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ABECSA Central WhatsApp Server Gateway
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Centrally authenticated on ABECSA Enterprise Server. Persistent connection linked to your company admin session. Usable from any device you log into.
          </p>
        </div>

        {/* Server Status Pill & Web Link */}
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

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Central Server Status
            </span>
            <span className="text-xs font-bold inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CONNECTED & READY</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Server Connection Card & Messaging Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Central Server Session Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Central Server Session</h3>
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
                  <h4 className="text-sm font-bold text-slate-900">Logged in via Company Email</h4>
                  <p className="text-[11px] text-slate-500">
                    Linked to <span className="font-semibold text-slate-700">admin@abecsa.in</span>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 pt-1 border-t border-emerald-100/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gateway Mode:</span>
                  <span className="font-bold text-slate-800">Central Cloud Server</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Device Mobility:</span>
                  <span className="font-bold text-emerald-700">Any Device (Mobile / PC)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sync Status:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Synchronized & Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Configured Company WhatsApp Number */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Official Company WhatsApp Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="+91 98765 43210"
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
                All dispatches from this console and client notifications will be sent from this active number.
              </p>
            </div>

            {/* Quick Test Action */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Instant Verification:</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Send a live test message to verify outbound delivery and central server message logging.
              </p>
              <button
                type="button"
                onClick={() => {
                  setRecipientPhone("+91 98765 43214");
                  setRecipientName("Ananya Deshmukh");
                  setCustomText("Hello! This is a real-time verification message from ABECSA Central WhatsApp Gateway.");
                }}
                className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Pre-fill Live Test Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Messaging Console */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <h3 className="text-sm font-bold text-slate-900">Company Dispatch Console</h3>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Meta Cloud API & Web Dispatch
            </span>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
            {/* Quick Customer Directory Lookup */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Select Customer from Directory (Auto-Fill)
              </label>
              <select
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">Select client from database...</option>
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
                  placeholder="+91 98765 43214"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Deshmukh"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pre-Approved Business Template (Optional)
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">Select official template or write custom text...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.templateName}>
                    {t.templateName} ({t.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Content Composer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
              <textarea
                rows={4}
                required
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your message or edit template variables..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-sans text-xs"
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

            {/* Dual Send Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="submit"
                disabled={sending || !customText || !recipientPhone}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? "Transmitting..." : "Send via Central Gateway"}</span>
              </button>

              <button
                type="button"
                onClick={() => launchWhatsAppWebTab(recipientPhone, customText)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in WhatsApp Web / App</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dispatched Messages History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Central Server Message History ({messagesList.length})
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live DB Records
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Available across all devices</span>
        </div>

        <div className="divide-y divide-slate-100">
          {messagesList.length > 0 ? (
            messagesList.map((m) => (
              <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      {m.recipientName || "Direct"} ({m.recipientPhone})
                    </span>
                    {m.templateName && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {m.templateName}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed max-w-2xl">{m.content}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        m.status === "READ"
                          ? "bg-sky-50 text-sky-700"
                          : m.status === "DELIVERED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.status === "READ" ? (
                        <CheckCheck className="w-3 h-3 text-sky-600" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{m.status}</span>
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {formatDateTime(m.sentAt)}
                    </span>
                  </div>

                  <a
                    href={`https://web.whatsapp.com/send?phone=${m.recipientPhone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300"
                    title="Open chat in WhatsApp Web"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No messages logged yet. Use the composer above to dispatch notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
