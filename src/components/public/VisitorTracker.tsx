"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  X,
  Phone,
  Mail,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function VisitorTracker() {
  const pathname = usePathname();
  const [visitorToken, setVisitorToken] = useState<string>("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);

  // Lead / Query capture state
  const [query, setQuery] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-dismiss timer ref
  const autoDownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTrackedRef = useRef<string>("");

  // Don't show public lead widget inside role workspaces
  const isWorkspace =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager") ||
    pathname.startsWith("/engineer") ||
    pathname.startsWith("/customer");

  // Initialize or load visitorToken
  useEffect(() => {
    let token = localStorage.getItem("abecsa_visitor_token");
    if (!token) {
      token = "vis_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("abecsa_visitor_token", token);
    }
    setVisitorToken(token);

    // Initial attention pop-up: Pops up on right side and then gets down automatically in 2 seconds
    const hasSeenTeaser = sessionStorage.getItem("abecsa_teaser_seen");
    if (!hasSeenTeaser && !isWorkspace) {
      const openTimer = setTimeout(() => {
        setShowTeaser(true);
        sessionStorage.setItem("abecsa_teaser_seen", "true");

        // Automatically get down in 2 seconds
        autoDownTimerRef.current = setTimeout(() => {
          setShowTeaser(false);
        }, 2200);
      }, 1000);

      return () => {
        clearTimeout(openTimer);
        if (autoDownTimerRef.current) clearTimeout(autoDownTimerRef.current);
      };
    }
  }, [isWorkspace]);

  // Send background beacon once per unique route navigation
  useEffect(() => {
    if (!visitorToken || !pathname) return;
    const trackKey = `${visitorToken}:${pathname}`;
    if (lastTrackedRef.current === trackKey) return;
    lastTrackedRef.current = trackKey;

    const trackPage = async () => {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitorToken,
            path: pathname,
            pageTitle: document.title,
            referrer: document.referrer,
          }),
        });
      } catch {
        // silent fail for analytics
      }
    };

    trackPage();
  }, [pathname, visitorToken]);

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone && !email) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorToken,
          path: pathname,
          name: name || "Website Visitor",
          phone,
          email,
          query: query || "General project consultation inquiry",
          message: query || "Inquiry captured from website query popup",
        }),
      });

      if (res.ok) {
        setCaptured(true);
        sessionStorage.setItem("abecsa_prompt_dismissed", "true");
        if (phone) localStorage.setItem("visitor_phone", phone);
        if (name) localStorage.setItem("visitor_name", name);

        // Pop up and then get down in 2 seconds automatically on completion
        setTimeout(() => {
          setShowDrawer(false);
          setCaptured(false);
          setQuery("");
        }, 2000);
      }
    } catch {
      alert("Failed to send query. Please chat with us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setShowDrawer(false);
    setShowTeaser(false);
    sessionStorage.setItem("abecsa_prompt_dismissed", "true");
  };

  const openFullQueryModal = () => {
    if (autoDownTimerRef.current) clearTimeout(autoDownTimerRef.current);
    setShowTeaser(false);
    setShowDrawer(true);
  };

  if (isWorkspace) return null;

  return (
    <>
      {/* 2-Sec Auto Pop-Up Teaser (Right Side) */}
      {showTeaser && !showDrawer && (
        <div
          onClick={openFullQueryModal}
          className="fixed bottom-32 sm:bottom-20 right-4 sm:right-6 z-50 max-w-[280px] sm:max-w-xs bg-slate-900 text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-sky-500/30 flex items-center gap-3 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 hover:scale-105"
        >
          <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold leading-tight">Have a project query?</p>
            <p className="text-[11px] text-sky-200 truncate">Click to send query in 1 click &rarr;</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowTeaser(false);
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Query Trigger Pill (Bottom-Right, positioned safely above mobile bottom bar) */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40">
        {!showDrawer && (
          <button
            onClick={openFullQueryModal}
            className="flex items-center gap-2 sm:gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-slate-950 text-white hover:bg-slate-900 shadow-2xl border border-sky-500/40 text-xs font-bold transition-all duration-300 hover:scale-105 cursor-pointer group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Send Query</span>
          </button>
        )}
      </div>

      {/* Full Send Query Card (Bottom-Right) */}
      {showDrawer && (
        <div className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-50 w-[94vw] sm:w-[390px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  <span>Send Query to ABECSA</span>
                </h4>
                <p className="text-[10px] text-slate-400">Response & itemized estimate within 24h</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 text-xs">
            {captured ? (
              <div className="py-5 text-center space-y-2 animate-in fade-in">
                <div className="h-11 w-11 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-900 text-sm">Query Sent Successfully!</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Our Delivery & Solutions team has received your request. Closing this window in 2s...
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20just%20submitted%20a%20query:%20${encodeURIComponent(
                      query || "Looking for enterprise software solution"
                    )}%20(Contact:%20${encodeURIComponent(phone)})`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>Open WhatsApp Chat Directly</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCaptureSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Your Requirement or Query
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your project (e.g. ERP, Mobile App, AI, Web application)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    WhatsApp / Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name (Optional)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email (Optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !phone}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-600/20 transition-all hover:scale-[1.02]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Sending..." : "Send Query Now"}</span>
                  </button>

                  <a
                    href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20have%20a%20query%20about%20software%20development:%20${encodeURIComponent(
                      query || "I want to discuss a new software project"
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center transition-colors"
                    title="Direct WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                  </a>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>No spam guarantee</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center gap-0.5"
                  >
                    <span>Close</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
