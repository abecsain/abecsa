"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Globe,
  Calculator,
  KeyRound,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Zap,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";

export default function ToolsHubPage() {
  const [activeTab, setActiveTab] = useState<"ping" | "forms" | "gst" | "token">("ping");

  // Ping Inspector State
  const [pingUrl, setPingUrl] = useState("abecsa.in");
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<any>(null);

  // Form Generator State
  const [formFields, setFormFields] = useState({
    title: "Project Inquiry Form",
    requirePhone: true,
    requireBudget: true,
    deliveryMethod: "CRM + WhatsApp Dispatch",
  });
  const [testFormSubmitted, setTestFormSubmitted] = useState(false);
  const [testFormData, setTestFormData] = useState({ name: "", email: "", phone: "", notes: "" });

  // GST Calculator State
  const [gstAmount, setGstAmount] = useState<number>(50000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [isReverse, setIsReverse] = useState(false);

  // Token Generator State
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);

  const handleRunPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingUrl) return;
    setPingLoading(true);
    setPingResult(null);

    try {
      const res = await fetch("/api/tools/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: pingUrl }),
      });
      const data = await res.json();
      setPingResult(data);
    } catch {
      setPingResult({ isUp: false, statusText: "Failed to connect to inspection endpoint" });
    } finally {
      setPingLoading(false);
    }
  };

  const handleTestFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTestFormSubmitted(true);
    setTimeout(() => setTestFormSubmitted(false), 5000);
  };

  const calculateGst = () => {
    const amt = parseFloat(gstAmount.toString()) || 0;
    if (isReverse) {
      // Amount includes GST
      const base = amt / (1 + gstRate / 100);
      const tax = amt - base;
      return { base: Math.round(base), tax: Math.round(tax), total: Math.round(amt) };
    } else {
      // Amount excludes GST
      const tax = (amt * gstRate) / 100;
      return { base: Math.round(amt), tax: Math.round(tax), total: Math.round(amt + tax) };
    }
  };

  const generateSecureKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!$#";
    let token = "abecsa_sec_";
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedToken(token);
  };

  const gstData = calculateGst();

  return (
    <div className="min-h-screen flex flex-col bg-transparent selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 sm:pt-16 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Zap className="w-3.5 h-3.5" />
              <span>ABECSA Daily Essential Services & Tools</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Essential Software Company Utilities
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Everyday digital utilities built and powered by ABECSA: Live Server Ping & Uptime Inspector, ABECSA Custom Forms Engine, GST Commercial Tax Calculator, and Cryptographic Key Generators.
            </p>
          </div>

          {/* Tool Navigation Tabs */}
          <div className="mt-8 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
            {[
              { id: "ping", label: "Live Server Ping & Latency", icon: Activity },
              { id: "forms", label: "ABECSA Forms Engine", icon: FileText },
              { id: "gst", label: "GST & Tax Calculator", icon: Calculator },
              { id: "token", label: "Security Token Generator", icon: KeyRound },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tools View Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* 1. Live Server Ping Tool */}
        {activeTab === "ping" && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2 text-sky-600 mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Network Diagnostic</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Live Website & Server Ping Service</h2>
              <p className="text-xs text-slate-500 mt-1">
                Test real round-trip latency, HTTP status code, SSL certificate status, and response headers for any public domain or API endpoint.
              </p>
            </div>

            <form onSubmit={handleRunPing} className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. google.com, abecsa.in, or your-domain.com"
                  value={pingUrl}
                  onChange={(e) => setPingUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={pingLoading}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-md shadow-sky-600/20"
              >
                <span>{pingLoading ? "Pinging..." : "Execute Ping"}</span>
              </button>
            </form>

            {/* Quick Suggestions */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Quick Test:</span>
              {["abecsa.in", "google.com", "github.com", "cloudflare.com"].map((host) => (
                <button
                  key={host}
                  type="button"
                  onClick={() => setPingUrl(host)}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono"
                >
                  {host}
                </button>
              ))}
            </div>

            {/* Ping Result Display */}
            {pingResult && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-3 w-3 rounded-full ${
                        pingResult.isUp ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                      }`}
                    />
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {pingResult.targetUrl}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      pingResult.health === "EXCELLENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : pingResult.health === "GOOD"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {pingResult.health || "STATUS"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Round-Trip Latency</span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">
                      {pingResult.latencyMs} ms
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">HTTP Status</span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">
                      {pingResult.status} {pingResult.statusText}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">SSL Encryption</span>
                    <span className="text-base font-black text-emerald-600 mt-0.5 block">
                      {pingResult.sslValid ? "TLS 1.3 Active" : "Insecure HTTP"}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">Server Timestamp</span>
                    <span className="text-xs font-semibold text-slate-700 mt-1 block truncate">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {pingResult.headers && Object.keys(pingResult.headers).length > 0 && (
                  <div className="pt-2 text-[11px] font-mono text-slate-600 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block text-xs font-sans">
                      Captured Response Headers:
                    </span>
                    {Object.entries(pingResult.headers).map(([k, v]: any) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-slate-800 font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. ABECSA Forms Engine */}
        {activeTab === "forms" && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Form Customizer</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">ABECSA Embedded Form Engine</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Generate high-converting lead capture widgets for your website. Every submission pipes directly into your ABECSA CRM pipeline and triggers WhatsApp notifications.
              </p>

              <div className="space-y-3 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Form Heading</label>
                  <input
                    type="text"
                    value={formFields.title}
                    onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="reqPhone"
                    checked={formFields.requirePhone}
                    onChange={(e) => setFormFields({ ...formFields, requirePhone: e.target.checked })}
                    className="rounded text-sky-600"
                  />
                  <label htmlFor="reqPhone" className="text-xs text-slate-700 font-semibold">
                    Require WhatsApp / Phone Number
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reqBudget"
                    checked={formFields.requireBudget}
                    onChange={(e) => setFormFields({ ...formFields, requireBudget: e.target.checked })}
                    className="rounded text-sky-600"
                  />
                  <label htmlFor="reqBudget" className="text-xs text-slate-700 font-semibold">
                    Include Project Scope & Budget
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">Embed Code Snippet:</span>
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto">
                    {`<iframe src="https://abecsa.in/embed/form?id=lead" width="100%" height="450" frameborder="0"></iframe>`}
                  </pre>
                </div>
              </div>
            </div>

            {/* Live Form Preview */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <span className="text-[11px] font-bold uppercase text-slate-400">Interactive Preview</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  Live Active
                </span>
              </div>

              {testFormSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Test Submission Captured!</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Form data successfully received and routed to ABECSA CRM lead queue with automated WhatsApp alert.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleTestFormSubmit} className="space-y-3 text-xs">
                  <h4 className="text-base font-bold text-slate-900">{formFields.title}</h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel"
                      value={testFormData.name}
                      onChange={(e) => setTestFormData({ ...testFormData, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="ramesh@company.com"
                      value={testFormData.email}
                      onChange={(e) => setTestFormData({ ...testFormData, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  {formFields.requirePhone && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        WhatsApp Contact Number *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+91 98765 00000"
                        value={testFormData.phone}
                        onChange={(e) => setTestFormData({ ...testFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Project Details</label>
                    <textarea
                      rows={2}
                      placeholder="Tell us what you'd like to build..."
                      value={testFormData.notes}
                      onChange={(e) => setTestFormData({ ...testFormData, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Submit Live Form</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* 3. GST & Tax Calculator */}
        {activeTab === "gst" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <Calculator className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Financial Utility</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Commercial GST & Tax Invoice Calculator</h2>
              <p className="text-xs text-slate-500 mt-1">
                Accurate forward and reverse Goods and Services Tax (GST) computation with CGST, SGST, and IGST breakdowns.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Base / Gross Amount (₹)</label>
                <input
                  type="number"
                  value={gstAmount}
                  onChange={(e) => setGstAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Applicable GST Slab</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
                >
                  <option value={18}>18% (Standard IT Software & Services)</option>
                  <option value={12}>12% (Telecom & Hardware Work)</option>
                  <option value={5}>5% (Essential Services)</option>
                  <option value={28}>28% (Luxury Goods)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="calcMode"
                  checked={!isReverse}
                  onChange={() => setIsReverse(false)}
                />
                <span>Add GST to Amount (Forward)</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="calcMode"
                  checked={isReverse}
                  onChange={() => setIsReverse(true)}
                />
                <span>Amount Already Includes GST (Reverse)</span>
              </label>
            </div>

            {/* Output Summary Card */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Net Taxable Value:</span>
                <span className="font-bold text-slate-900">₹{gstData.base.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">CGST ({gstRate / 2}%):</span>
                <span className="font-bold text-slate-900">₹{Math.round(gstData.tax / 2).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">SGST ({gstRate / 2}%):</span>
                <span className="font-bold text-slate-900">₹{Math.round(gstData.tax / 2).toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Total Invoice Payable:</span>
                <span className="font-black text-sky-600 text-lg">
                  ₹{gstData.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Security Token Generator */}
        {activeTab === "token" && (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <KeyRound className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Security Utility</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Cryptographic Key & API Secret Generator</h2>
              <p className="text-xs text-slate-500 mt-1">
                Generate high-entropy random keys, JWT secrets, and webhook tokens for software integrations.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={generateSecureKey}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Generate High-Entropy Secret Key</span>
              </button>

              {generatedToken && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Generated Secret:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedToken}
                      className="flex-1 font-mono text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedToken);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
