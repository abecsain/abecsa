"use client";

import { useEffect, useState } from "react";
import {
  Send,
  FileSpreadsheet,
  FolderPlus,
  Image as ImageIcon,
  Receipt,
  Bell,
  CheckCircle2,
  Users,
  AlertCircle,
  ExternalLink,
  Trash2,
} from "lucide-react";

export default function ManagerPushToolsPage() {
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string; user: { name: string } }>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [activeTab, setActiveTab] = useState<"NOTICE" | "IMAGE" | "FOLDER" | "QUOTATION">("NOTICE");
  const [statusMsg, setStatusMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticePriority, setNoticePriority] = useState("NORMAL");
  const [noticeUrl, setNoticeUrl] = useState("");
  const [noticeLabel, setNoticeLabel] = useState("");

  // Image / Mockup Form State
  const [imageTitle, setImageTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("/logo.png");
  const [imageDesc, setImageDesc] = useState("");

  // Folder Form State
  const [folderName, setFolderName] = useState("");

  // Quotation Form State
  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteAmount, setQuoteAmount] = useState(450000);
  const [quoteTerms, setQuoteTerms] = useState("30% Advance, 40% Milestone 2, 30% Final Signoff");

  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    fetchCustomers();
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/notices");
      const data = await res.json();
      if (data.notices) setNotices(data.notices);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNotice = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete notice "${title}"?`)) return;
    try {
      const res = await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchNotices();
    } catch {
      alert("Error deleting notice");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/users?role=CUSTOMER");
      const data = await res.json();
      if (data.users) {
        const custs = data.users
          .filter((u: { customerProfile: unknown }) => !!u.customerProfile)
          .map((u: { customerProfile: { id: string; companyName: string }; name: string }) => ({
            id: u.customerProfile.id,
            companyName: u.customerProfile.companyName,
            user: { name: u.name },
          }));
        setCustomers(custs);
        if (custs.length > 0) setSelectedCustomer(custs[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePushNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !noticeTitle || !noticeMessage) return;

    setSubmitting(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          title: noticeTitle,
          message: noticeMessage,
          priority: noticePriority,
          actionUrl: noticeUrl || undefined,
          actionLabel: noticeLabel || undefined,
        }),
      });

      if (res.ok) {
        setStatusMsg("Notice successfully pushed to Client Notice Board!");
        setNoticeTitle("");
        setNoticeMessage("");
        fetchNotices();
      }
    } catch {
      alert("Error pushing notice");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePushImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !imageTitle) return;

    setSubmitting(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FILE",
          customerId: selectedCustomer,
          fileName: imageTitle,
          originalName: imageTitle,
          fileUrl: imageUrl || "/logo.png",
          fileType: "IMAGE",
          isCustomerVisible: true,
          description: imageDesc,
        }),
      });

      if (res.ok) {
        setStatusMsg("UI Mockup image pushed directly to Client Vault!");
        setImageTitle("");
        setImageDesc("");
      }
    } catch {
      alert("Error pushing image");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePushFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !folderName) return;

    setSubmitting(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOLDER",
          customerId: selectedCustomer,
          name: folderName,
          isCustomerVisible: true,
        }),
      });

      if (res.ok) {
        setStatusMsg(`Client folder "${folderName}" created and published!`);
        setFolderName("");
      }
    } catch {
      alert("Error creating folder");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePushQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !quoteTitle) return;

    setSubmitting(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer,
          title: quoteTitle,
          paymentTerms: quoteTerms,
          items: [{ description: quoteTitle, quantity: 1, unitPrice: Number(quoteAmount) }],
        }),
      });

      if (res.ok) {
        setStatusMsg("Formal quotation created and pushed to Client Portal for sign-off!");
        setQuoteTitle("");
      }
    } catch {
      alert("Error pushing quotation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600">
              <Send className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Client Portal Push Tools
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Push quotations, project folders, design mockups, and specific custom announcements directly into a specific client&apos;s personal dashboard.
          </p>
        </div>

        {statusMsg && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Target Client Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Target Customer Account *
        </label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-sky-500"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName} (Representative: {c.user.name})
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          Selected client will immediately see the pushed asset upon opening their Customer Portal or Mobile Dashboard.
        </p>
      </div>

      {/* Action Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("NOTICE")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "NOTICE"
              ? "bg-sky-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notice / Announcement</span>
        </button>

        <button
          onClick={() => setActiveTab("IMAGE")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "IMAGE"
              ? "bg-sky-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>UI Mockup / Image</span>
        </button>

        <button
          onClick={() => setActiveTab("FOLDER")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "FOLDER"
              ? "bg-sky-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Project Folder</span>
        </button>

        <button
          onClick={() => setActiveTab("QUOTATION")}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "QUOTATION"
              ? "bg-sky-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Formal Quotation</span>
        </button>
      </div>

      {/* TAB 1: PUSH NOTICE */}
      {activeTab === "NOTICE" && (
        <form onSubmit={handlePushNotice} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Push to Client Notice Board</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notice Headline *</label>
            <input
              type="text"
              required
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder="e.g. Staging Environment Ready for Sprint 2 Inspection"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Message Description *</label>
            <textarea
              rows={3}
              required
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              placeholder="Detailed explanation, instructions, or meeting reminder..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={noticePriority}
                onChange={(e) => setNoticePriority(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANT">Important</option>
                <option value="URGENT">Urgent Action</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Action Button URL (Optional)</label>
              <input
                type="text"
                value={noticeUrl}
                onChange={(e) => setNoticeUrl(e.target.value)}
                placeholder="https://staging..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Button Label (Optional)</label>
              <input
                type="text"
                value={noticeLabel}
                onChange={(e) => setNoticeLabel(e.target.value)}
                placeholder="Open Staging"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Pushing Notice..." : "Publish Announcement to Client Notice Board"}</span>
          </button>

          {/* Active Notices List with Delete */}
          {notices.length > 0 && (
            <div className="pt-4 border-t space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Active Published Notices ({notices.length}):</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {notices.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-900 block">{n.title}</span>
                      <span className="text-[10px] text-slate-500">For: {n.customer?.companyName || "Client"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(n.id, n.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: PUSH IMAGE */}
      {activeTab === "IMAGE" && (
        <form onSubmit={handlePushImage} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Push UI/UX Mockup to Client Vault</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Image / Mockup Title *</label>
            <input
              type="text"
              required
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="e.g. Driver Dispatch Console High-Fidelity UI Prototype"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Version Notes</label>
              <input
                type="text"
                value={imageDesc}
                onChange={(e) => setImageDesc(e.target.value)}
                placeholder="e.g. Iteration 3 based on design review"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Pushing Image..." : "Publish Image to Client Shared Vault"}</span>
          </button>
        </form>
      )}

      {/* TAB 3: PUSH FOLDER */}
      {activeTab === "FOLDER" && (
        <form onSubmit={handlePushFolder} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Provision Shared Project Folder</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Folder Name *</label>
            <input
              type="text"
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Sprint 2 Architectural Deliverables"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{submitting ? "Creating..." : "Create & Share Folder with Client"}</span>
          </button>
        </form>
      )}

      {/* TAB 4: PUSH QUOTATION */}
      {activeTab === "QUOTATION" && (
        <form onSubmit={handlePushQuotation} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Push Quotation for Client E-Approval</h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Quotation Title *</label>
            <input
              type="text"
              required
              value={quoteTitle}
              onChange={(e) => setQuoteTitle(e.target.value)}
              placeholder="e.g. Mobile GPS Tracking Feature Extension"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount (Excl. Tax)</label>
              <input
                type="number"
                required
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Milestones</label>
              <input
                type="text"
                value={quoteTerms}
                onChange={(e) => setQuoteTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Generating..." : "Push Quotation to Client Portal"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
