"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gift,
  Plus,
  Search,
  Copy,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Trash2,
  Sparkles,
  PartyPopper,
  Clock,
  X,
  AlertCircle,
  RefreshCw,
  Send,
  Phone,
  User,
  Check,
} from "lucide-react";

interface ScratchGift {
  id: string;
  slug: string;
  title: string;
  prizeTitle: string;
  prizeDescription?: string | null;
  couponCode?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  buttonText: string;
  redirectionType: "WHATSAPP" | "CUSTOM_URL";
  customUrl?: string | null;
  whatsappMessage?: string | null;
  isScratched: boolean;
  isClaimed: boolean;
  expiresAt?: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    role: string;
  };
}

interface ScratchGiftManagerProps {
  userRole: "ADMIN" | "MANAGER";
}

export default function ScratchGiftManager({ userRole }: ScratchGiftManagerProps) {
  const [gifts, setGifts] = useState<ScratchGift[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Customer dropdown list (fetched from /api/users?role=CUSTOMER)
  const [customers, setCustomers] = useState<Array<{ name: string; phone?: string }>>([]);

  // Form State
  const [form, setForm] = useState({
    title: "",
    prizeTitle: "",
    prizeDescription: "",
    couponCode: "",
    customerName: "",
    customerPhone: "",
    buttonText: "Claim Gift on WhatsApp",
    redirectionType: "WHATSAPP" as "WHATSAPP" | "CUSTOM_URL",
    customUrl: "",
    whatsappMessage: "",
    expiresAt: "",
  });

  useEffect(() => {
    fetchGifts();
    fetchCustomers();
  }, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gifts");
      const data = await res.json();
      if (res.ok && data.gifts) {
        setGifts(data.gifts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/users?role=CUSTOMER");
      const data = await res.json();
      if (data.users) {
        setCustomers(
          data.users.map((u: any) => ({
            name: u.customerProfile?.companyName || u.name,
            phone: u.phone,
          }))
        );
      }
    } catch {
      // non-fatal
    }
  };

  // Quick preset templates
  const presets = [
    {
      title: "Exclusive Client Appreciation Gift",
      prizeTitle: "FLAT ₹15,000 OFF on Next Sprint",
      prizeDescription: "Valid on any web or mobile milestone invoice.",
      buttonText: "Claim Gift on WhatsApp",
    },
    {
      title: "Free Cloud Domain & 1-Year SSL Perk",
      prizeTitle: "Free .com / .in Domain + SSL Setup",
      prizeDescription: "Complimentary domain registration and Cloudflare SSL setup.",
      buttonText: "Redeem Domain Perk",
    },
    {
      title: "Loyalty Perk: WhatsApp Automation",
      prizeTitle: "Free Automated WhatsApp Sync Engine",
      prizeDescription: "Connect your official WhatsApp number for automated billing & customer reminders.",
      buttonText: "Activate WhatsApp Engine",
    },
    {
      title: "Festive Milestone Cash Credit",
      prizeTitle: "₹10,000 Milestone Cash Credit",
      prizeDescription: "Directly adjusted against your next milestone tax invoice.",
      buttonText: "Claim Credit Now",
    },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    const randomCode = `ABECSA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setForm((prev) => ({
      ...prev,
      title: preset.title,
      prizeTitle: preset.prizeTitle,
      prizeDescription: preset.prizeDescription,
      couponCode: randomCode,
      buttonText: preset.buttonText,
      redirectionType: "WHATSAPP",
      whatsappMessage: `Hello ABECSA Team! 🎉 I just scratched and won my surprise gift: *${preset.prizeTitle}* (Code: *${randomCode}*). Please redeem this for my account!`,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.prizeTitle) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/gifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok && data.gift) {
        setShowCreateModal(false);
        setForm({
          title: "",
          prizeTitle: "",
          prizeDescription: "",
          couponCode: "",
          customerName: "",
          customerPhone: "",
          buttonText: "Claim Gift on WhatsApp",
          redirectionType: "WHATSAPP",
          customUrl: "",
          whatsappMessage: "",
          expiresAt: "",
        });
        setStatusMsg(`Scratch gift "${data.gift.title}" generated successfully!`);
        setTimeout(() => setStatusMsg(""), 4000);
        fetchGifts();
      } else {
        alert(data.error || "Failed to create gift");
      }
    } catch {
      alert("Error creating scratch gift");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete scratch card gift "${title}"?`)) return;

    try {
      const res = await fetch(`/api/gifts?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGifts();
      } else {
        alert("Failed to delete gift");
      }
    } catch {
      alert("Error deleting gift");
    }
  };

  const getFullGiftUrl = (slug: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/gift/${slug}`;
    }
    return `/gift/${slug}`;
  };

  const handleCopyLink = (slug: string) => {
    const url = getFullGiftUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2500);
  };

  const handleShareWhatsApp = (gift: ScratchGift) => {
    const url = getFullGiftUrl(gift.slug);
    const text = `🎁 Hello ${
      gift.customerName || "there"
    }!\n\nThe team at ABECSA has prepared a special surprise scratch card gift for you.\n\n👉 Scratch to reveal your prize here:\n${url}\n\nEnjoy!`;

    const targetPhone = gift.customerPhone?.replace(/\D/g, "");
    const waUrl = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank");
  };

  const filteredGifts = gifts.filter((g) => {
    const q = search.toLowerCase();
    return (
      g.title.toLowerCase().includes(q) ||
      g.prizeTitle.toLowerCase().includes(q) ||
      (g.customerName && g.customerName.toLowerCase().includes(q)) ||
      (g.couponCode && g.couponCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-amber-50 text-amber-600">
              <Gift className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Customer Scratch Card Gift Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Generate custom interactive scratch card gift links to surprise clients with discounts, free domain perks, or credits. Scratched cards automatically route claims to WhatsApp or any custom link!
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              applyPreset(presets[0]);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer font-bold"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Scratch Gift</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search gifts by title, customer, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filteredGifts.length}</strong> Scratch Cards
        </div>
      </div>

      {/* Scratch Gifts Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
          Loading scratch gifts...
        </div>
      ) : filteredGifts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="h-12 w-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Scratch Card Gifts Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Create a custom gift card to surprise your clients with celebratory discounts, loyalty perks, or milestone credits.
          </p>
          <button
            onClick={() => {
              applyPreset(presets[0]);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Create Your First Gift
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGifts.map((gift) => {
            const isCopied = copiedSlug === gift.slug;
            const isExpired = gift.expiresAt && new Date(gift.expiresAt) < new Date();

            return (
              <div
                key={gift.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                        <Gift className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          /gift/{gift.slug}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                          {gift.title}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        gift.isClaimed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : gift.isScratched
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : isExpired
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {gift.isClaimed
                        ? "CLAIMED"
                        : gift.isScratched
                        ? "SCRATCHED"
                        : isExpired
                        ? "EXPIRED"
                        : "READY TO SCRATCH"}
                    </span>
                  </div>

                  {/* Prize Display */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50/70 to-yellow-50/50 border border-amber-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      Prize Under Card:
                    </span>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {gift.prizeTitle}
                    </h4>
                    {gift.couponCode && (
                      <div className="text-[11px] font-mono font-bold text-amber-800 pt-0.5">
                        Code: {gift.couponCode}
                      </div>
                    )}
                  </div>

                  {/* Recipient & Routing Details */}
                  <div className="space-y-1 text-xs text-slate-600">
                    {gift.customerName && (
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">
                          Recipient: {gift.customerName}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px]">
                      {gift.redirectionType === "WHATSAPP" ? (
                        <>
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            Redirects to: <strong>WhatsApp</strong> ({gift.buttonText})
                          </span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span className="truncate">
                            Redirects to: <strong>Web Link</strong> ({gift.customUrl})
                          </span>
                        </>
                      )}
                    </div>

                    {gift.expiresAt && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Expires: {new Date(gift.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(gift.slug)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copy public gift link"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    {/* WhatsApp Direct Share */}
                    <button
                      onClick={() => handleShareWhatsApp(gift)}
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Share directly to customer via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Test Scratch Page */}
                    <Link
                      href={`/gift/${gift.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors"
                      title="Open scratch card preview"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(gift.id, gift.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete gift"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GIFT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Generate Scratch Card Gift
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create a customized surprise link for your client
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Strip */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quick 1-Click Templates:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold border border-amber-200 transition-colors cursor-pointer"
                  >
                    {p.prizeTitle}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              {/* Gift Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Gift Card Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Special Festive Gift from ABECSA"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Prize Title & Coupon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hidden Prize / Offer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLAT ₹15,000 OFF on Next Sprint"
                    value={form.prizeTitle}
                    onChange={(e) => setForm({ ...form, prizeTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Coupon Code / Secret Token
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. ABECSA-GIFT-99"
                      value={form.couponCode}
                      onChange={(e) => setForm({ ...form, couponCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          couponCode: `ABECSA-${Math.random()
                            .toString(36)
                            .substring(2, 7)
                            .toUpperCase()}`,
                        })
                      }
                      className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0 cursor-pointer"
                    >
                      Auto
                    </button>
                  </div>
                </div>
              </div>

              {/* Prize Description */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prize Details / Terms (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Applicable on custom web app or mobile app milestones. Valid for 30 days."
                  value={form.prizeDescription}
                  onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              {/* Target Customer (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma / Acme Corp"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  {customers.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {customers.slice(0, 3).map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              customerName: c.name,
                              customerPhone: c.phone || prev.customerPhone,
                            }))
                          }
                          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 truncate max-w-[120px]"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Customer WhatsApp / Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Redirection Mode & Button Name */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Claim Button & Redirection Target
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-amber-400">
                    <input
                      type="radio"
                      name="redirectionType"
                      checked={form.redirectionType === "WHATSAPP"}
                      onChange={() => setForm({ ...form, redirectionType: "WHATSAPP" })}
                      className="text-amber-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">WhatsApp Chat</span>
                      <span className="text-[10px] text-slate-500">Default 1-click claim</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:border-amber-400">
                    <input
                      type="radio"
                      name="redirectionType"
                      checked={form.redirectionType === "CUSTOM_URL"}
                      onChange={() => setForm({ ...form, redirectionType: "CUSTOM_URL" })}
                      className="text-amber-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">Custom Web Link</span>
                      <span className="text-[10px] text-slate-500">External URL / page</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Button Label
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Claim Gift on WhatsApp"
                      value={form.buttonText}
                      onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  {form.redirectionType === "CUSTOM_URL" ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Destination URL *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://yourwebsite.com/claim"
                        value={form.customUrl}
                        onChange={(e) => setForm({ ...form, customUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={form.expiresAt}
                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                      />
                    </div>
                  )}
                </div>

                {form.redirectionType === "WHATSAPP" && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      WhatsApp Prefilled Message
                    </label>
                    <textarea
                      rows={2}
                      value={form.whatsappMessage}
                      onChange={(e) => setForm({ ...form, whatsappMessage: e.target.value })}
                      placeholder="Hello ABECSA Team! I am claiming my gift..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs resize-none"
                    />
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold hover:brightness-110 shadow-md shadow-amber-500/20"
                >
                  {submitting ? "Generating..." : "Generate Scratch Card Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
