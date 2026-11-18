"use client";

import { useEffect, useState, useRef } from "react";
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
  QrCode,
  KeyRound,
  RefreshCw,
  LogOut,
  AlertCircle,
  Copy,
  Receipt,
  BellRing,
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

  // Baileys Socket Engine State
  const [engineStatus, setEngineStatus] = useState<string>("DISCONNECTED");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"QR" | "PAIRING_CODE">("PAIRING_CODE");
  const [phoneForPairing, setPhoneForPairing] = useState<string>("9876543210");
  const [requestingCode, setRequestingCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [statusPolling, setStatusPolling] = useState(false);

  // Phone number configuration
  const [customPhone, setCustomPhone] = useState("+91 98765 43210");
  const [savingPhone, setSavingPhone] = useState(false);

  // Message Composer State
  const [recipientPhone, setRecipientPhone] = useState("+91 98765 43214");
  const [recipientName, setRecipientName] = useState("Ananya Deshmukh");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customText, setCustomText] = useState(
    "Hello Ananya! This is an official automated communication from ABECSA Software Solutions."
  );
  const [sending, setSending] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Poll status every 4 seconds when waiting for QR or pairing
  useEffect(() => {
    fetchInitialData();
    pollEngineStatus();

    const interval = setInterval(() => {
      pollEngineStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
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

  const pollEngineStatus = async () => {
    try {
      setStatusPolling(true);
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      if (data.success) {
        setEngineStatus(data.status);
        if (data.qr) setQrCodeDataUrl(data.qr);
        if (data.pairingCode) setPairingCode(data.pairingCode);
        if (data.phone) setCustomPhone(data.phone.startsWith("+") ? data.phone : `+${data.phone}`);
      }
    } catch (e) {
      // silent polling error
    } finally {
      setStatusPolling(false);
    }
  };

  const handleFetchQr = async () => {
    try {
      setEngineStatus("CONNECTING");
      const res = await fetch("/api/whatsapp/qr");
      const data = await res.json();
      if (data.qr) {
        setQrCodeDataUrl(data.qr);
        setEngineStatus("SCAN_QR");
      }
    } catch {
      showError("Failed to initialize QR code");
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneForPairing) return;

    setRequestingCode(true);
    setPairingCode(null);
    try {
      const res = await fetch("/api/whatsapp/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneForPairing }),
      });
      const data = await res.json();
      if (data.success && data.pairingCode) {
        setPairingCode(data.pairingCode);
        setEngineStatus("WAITING_FOR_PAIRING");
        showNotification("8-Digit pairing code generated! Enter this code on your mobile WhatsApp.");
      } else {
        showError(data.error || "Failed to generate pairing code. Please retry.");
      }
    } catch (err: any) {
      showError(err.message || "Network error while requesting pairing code");
    } finally {
      setRequestingCode(false);
    }
  };

  const handleCopyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode.replace("-", ""));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out and clear the active WhatsApp session?")) return;
    try {
      const res = await fetch("/api/whatsapp/logout", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setEngineStatus("DISCONNECTED");
        setQrCodeDataUrl(null);
        setPairingCode(null);
        showNotification("WhatsApp session disconnected. All credentials cleared.");
        fetchInitialData();
      }
    } catch {
      showError("Failed to disconnect session");
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
      showError("Failed to update phone number");
    } finally {
      setSavingPhone(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setErrorNotice(null);
    setTimeout(() => setSuccessNotice(null), 6000);
  };

  const showError = (msg: string) => {
    setErrorNotice(msg);
    setTimeout(() => setErrorNotice(null), 6000);
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
      text = text.replace(/{{link}}/g, "https://abecsa.site/customer");
      setCustomText(text);
    }
  };

  const handlePreFillBill = () => {
    setRecipientPhone("+91 98765 43214");
    setRecipientName("Ananya Deshmukh");
    setCustomText(
      `*ABECSA Software Solutions*
🧾 *TAX INVOICE / बिल रसीद*

*बिल क्र.*: #INV-2026-003
*ग्राहक*: Ananya Deshmukh (NexaCorp Global Logistics)
*दिनांक*: 18 Nov 2026
*स्थिति*: [PARTIAL / उधारी बाकी]

━━━━━━━━━━━━━━━━━━━━━
📋 *आइटम विवरण (Items):*
  1. *Core ERP Customization & Pipeline* (Qty: 1) - ₹18,00,000
  2. *Cloud Deployment & Telemetry* (Qty: 1) - ₹3,24,000
━━━━━━━━━━━━━━━━━━━━━

*उप-योग (Subtotal)*: ₹18,00,000
*GST (18%)*: ₹3,24,000
*कुल योग (Total)*: *₹21,24,000*
*जमा किया (Paid via Bank Transfer)*: ₹0
*शेष बकाया (Balance Due)*: *₹21,24,000*
*अंतिम देय तिथि*: 2 Dec 2026

💳 *UPI से तुरंत भुगतान करें:*
UPI ID: \`abecsa@okhdfcbank\`

धन्यवाद!
*ABECSA Software Solutions*`
    );
  };

  const handlePreFillReminder = () => {
    setRecipientPhone("+91 98765 43214");
    setRecipientName("Ananya Deshmukh");
    setCustomText(
      `📢 *भुगतान अनुस्मारक / PAYMENT REMINDER (तकादा)*
प्रिय Ananya Deshmukh जी,

*ABECSA Software Solutions* से आपकी इनवॉइस *#INV-2026-003* का शेष भुगतान अभी भी लंबित है।

*बकाया राशि (Due Balance)*: *₹21,24,000*
*अंतिम तिथि (Due Date)*: 2 Dec 2026

कृपया किसी भी रुकावट से बचने के लिए नीचे दिए गए UPI विवरण पर शीघ्र भुगतान करने की कृपा करें:

💳 *UPI ID*: \`abecsa@okhdfcbank\`

भुगतान के उपरांत कृपया स्क्रीनशॉट साझा करें ताकि आपके खाते में प्रविष्टि की जा सके।

धन्यवाद,
*ABECSA लेखा एवं ग्राहक विभाग*`
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientPhone || !customText) return;

    setSending(true);
    setFallbackUrl(null);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: recipientPhone,
          message: customText,
          dedupeKey: `msg_${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`✓ Message dispatched automatically via Baileys engine to ${recipientPhone}!`);
        fetchInitialData();
      } else {
        if (data.fallbackUrl) {
          setFallbackUrl(data.fallbackUrl);
        }
        showError(data.error || "Socket offline. Click fallback link below to send directly via WhatsApp.");
      }
    } catch (err: any) {
      showError(err.message || "Failed to dispatch WhatsApp message");
    } finally {
      setSending(false);
    }
  };

  const isConnected = engineStatus === "READY";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Automated Baileys Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
              Cloud Database Sync
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Central WhatsApp Gateway & Automation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Headless Multi-Device WebSocket connection. Pair once with QR or 8-digit Pairing Code. Never expires across redeployments.
          </p>
        </div>

        {/* Live Engine Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 ${
              isConnected
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : engineStatus === "CONNECTING" || engineStatus === "WAITING_FOR_PAIRING"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? "bg-emerald-500" : "bg-rose-500"
                }`}
              ></span>
            </span>
            <div className="text-left">
              <span className="text-[11px] font-bold block leading-tight">
                {isConnected
                  ? "ENGINE READY / CONNECTED"
                  : engineStatus === "WAITING_FOR_PAIRING"
                  ? "WAITING FOR 8-DIGIT CODE"
                  : engineStatus === "SCAN_QR"
                  ? "SCAN QR CODE"
                  : engineStatus === "CONNECTING"
                  ? "CONNECTING..."
                  : "DISCONNECTED"}
              </span>
              <span className="text-[10px] opacity-75">
                {isConnected ? `Linked: ${customPhone}` : "Cloud credentials ready"}
              </span>
            </div>
          </div>

          <button
            onClick={pollEngineStatus}
            disabled={statusPolling}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-xs"
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${statusPolling ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
          <button onClick={() => setSuccessNotice(null)} className="text-emerald-600 font-bold ml-4">
            Dismiss
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorNotice}</span>
          </div>
          {fallbackUrl && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Send Manually via 1-Click WhatsApp</span>
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Baileys Multi-Device Pairing Cockpit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Dual Pairing & Cloud Sync</span>
                </h3>
                <p className="text-[11px] text-slate-500">Link once, stays persistent in cloud database</p>
              </div>

              {isConnected && (
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Disconnect and log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* If Connected */}
            {isConnected ? (
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <CheckCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900">WhatsApp Multi-Device Active</h4>
                    <p className="text-[11px] text-emerald-700">
                      Connected Phone: <span className="font-mono font-bold">{customPhone}</span>
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1.5 pt-2 border-t border-emerald-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Persistent Sync:</span>
                    <span className="font-bold text-emerald-700">Cloud DB Cached (Never Expires)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Engine Protocol:</span>
                    <span className="font-bold text-slate-800">Baileys WebSocket Headless</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Multi-Device:</span>
                    <span className="font-bold text-slate-800">PC / Android / iOS Independent</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Pairing Options (Dual Mode) */
              <div className="space-y-4">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("PAIRING_CODE")}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === "PAIRING_CODE"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                    <span>8-Digit Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("QR");
                      if (!qrCodeDataUrl) handleFetchQr();
                    }}
                    className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      activeTab === "QR"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                    <span>QR Scanner</span>
                  </button>
                </div>

                {/* TAB 1: 8-DIGIT PAIRING CODE (NO CAMERA NEEDED) */}
                {activeTab === "PAIRING_CODE" && (
                  <div className="space-y-3.5 p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        Link via Mobile Number (No Camera Needed)
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Type your 10-digit WhatsApp number and get an 8-character pairing code:
                      </p>
                    </div>

                    <form onSubmit={handleRequestPairingCode} className="space-y-2.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                          <input
                            type="text"
                            required
                            placeholder="9876543210"
                            value={phoneForPairing}
                            onChange={(e) => setPhoneForPairing(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={requestingCode}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{requestingCode ? "Generating..." : "Get Code"}</span>
                        </button>
                      </div>
                    </form>

                    {/* Display 8-Digit Code */}
                    {pairingCode && (
                      <div className="p-4 bg-white rounded-xl border border-sky-200 text-center space-y-2 animate-fade-in shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Your 8-Digit Pairing Code:
                        </span>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-black font-mono tracking-widest text-sky-700 bg-sky-50 px-4 py-1.5 rounded-lg border border-sky-200">
                            {pairingCode}
                          </span>
                          <button
                            onClick={handleCopyPairingCode}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                            title="Copy Code"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {copiedCode && <span className="text-[10px] font-bold text-emerald-600 block">Copied!</span>}

                        <div className="text-[10px] text-slate-600 text-left pt-2 border-t border-slate-100 space-y-1">
                          <p className="font-bold text-slate-800">How to enter on Mobile:</p>
                          <p>1. Open WhatsApp &gt; Settings &gt; <b>Linked Devices</b></p>
                          <p>2. Tap <b>Link a Device</b></p>
                          <p>3. Tap <b>Link with phone number instead</b> at the bottom</p>
                          <p>4. Type the 8-digit code above</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: QR SCANNER */}
                {activeTab === "QR" && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs font-bold text-slate-900 block">
                      Scan QR Code with WhatsApp
                    </span>

                    {qrCodeDataUrl ? (
                      <div className="inline-block p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrCodeDataUrl}
                          alt="WhatsApp Baileys QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="h-48 w-48 mx-auto rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-2">
                        <QrCode className="w-8 h-8 opacity-40" />
                        <span className="text-xs">Generating fresh QR...</span>
                      </div>
                    )}

                    <div className="flex justify-center gap-2">
                      <button
                        onClick={handleFetchQr}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh QR</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device &gt; Scan this code.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Official Company WhatsApp Number */}
            <div className="space-y-2 pt-2 border-t">
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
            </div>

            {/* 1-Click Fast Pre-fills: POS Bill & Takada Reminder */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Fast Message Actions:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePreFillBill}
                  className="py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pre-fill POS Bill</span>
                </button>
                <button
                  type="button"
                  onClick={handlePreFillReminder}
                  className="py-2 px-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-600" />
                  <span>तकादा (Reminder)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch & Automation Console */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Company Dispatch Console</h3>
              <p className="text-[11px] text-slate-500">
                Direct WebSocket transmission with automatic 30s deduplication protection
              </p>
            </div>
            <span
              className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-full ${
                isConnected
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {isConnected ? "Engine Automated" : "Fallback Ready"}
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
            {templates.length > 0 && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Approved Templates</label>
                <div className="flex flex-wrap gap-2">
                  {templates.slice(0, 4).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTemplate(t.templateName)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                        selectedTemplate === t.templateName
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {t.templateName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Message Body */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Message Content *</label>
              <textarea
                rows={7}
                required
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your WhatsApp message..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400">
                🔒 In-memory 30s deduplication protection active.
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  disabled={sending || !recipientPhone || !customText}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  <Send className="w-4 h-4" />
                  <span>{sending ? "Transmitting..." : "Send via WhatsApp"}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Fallback Action Banner if Offline */}
          {fallbackUrl && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
              <span className="text-xs text-emerald-800 font-semibold">
                Open directly in WhatsApp Web / App:
              </span>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open WhatsApp Now</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
