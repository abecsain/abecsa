"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";

export default function VisitorTracker() {
  const pathname = usePathname();
  const [visitorToken, setVisitorToken] = useState<string>("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  // Lead capture state
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize or load visitorToken
  useEffect(() => {
    let token = localStorage.getItem("abecsa_visitor_token");
    if (!token) {
      token = "vis_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      localStorage.setItem("abecsa_visitor_token", token);
    }
    setVisitorToken(token);

    // Prompt the visitor consultation drawer after 8 seconds on public pages if not previously dismissed
    const dismissed = sessionStorage.getItem("abecsa_prompt_dismissed");
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowDrawer(true);
        setHasPrompted(true);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Send background beacon on page navigation
  useEffect(() => {
    if (!visitorToken || !pathname) return;

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
        }),
      });

      if (res.ok) {
        setCaptured(true);
        sessionStorage.setItem("abecsa_prompt_dismissed", "true");
        // Also save details locally for auto-fill
        if (phone) localStorage.setItem("visitor_phone", phone);
        if (name) localStorage.setItem("visitor_name", name);
      }
    } catch {
      alert("Failed to submit. Please chat with us on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setShowDrawer(false);
    sessionStorage.setItem("abecsa_prompt_dismissed", "true");
  };

  return (
    <>
      {/* Floating Prompt Pill (Bottom-Left on Public Pages) */}
      <div className="fixed bottom-6 left-6 z-40">
        {!showDrawer && !captured && (
          <button
            onClick={() => setShowDrawer(true)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white text-slate-800 hover:text-emerald-700 shadow-xl border border-slate-200/90 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Free Software Consultation</span>
            <span className="sm:hidden">Get Quote</span>
          </button>
        )}
      </div>

      {/* Slide-Up Lead Capture Card */}
      {showDrawer && (
        <div className="fixed bottom-6 left-6 z-50 w-[92vw] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">Connect with ABECSA</h4>
                <p className="text-[10px] text-slate-400">Get a free consultation & proposal within 24h</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3 text-xs">
            {captured ? (
              <div className="py-4 text-center space-y-2">
                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h5 className="font-bold text-slate-900 text-sm">Thank You! We Have Your Details.</h5>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Our Delivery Operations team has logged your inquiry. Would you like to chat right now?
                </p>
                <a
                  href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20just%20submitted%20my%20contact%20number%20(${encodeURIComponent(
                    phone
                  )})%20on%20your%20website%20and%20would%20like%20to%20discuss%20a%20project.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>Start WhatsApp Chat Now</span>
                </a>
              </div>
            ) : (
              <form onSubmit={handleCaptureSubmit} className="space-y-2.5">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Enter your mobile/WhatsApp number. We will share itemized pricing and software architecture details:
                </p>

                <div>
                  <input
                    type="text"
                    required
                    placeholder="WhatsApp / Mobile Number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (Optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                  />
                  <input
                    type="email"
                    placeholder="Email (Optional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px]"
                  />
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting || !phone}
                    className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-sky-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Saving..." : "Request Fast Callback"}</span>
                  </button>

                  <a
                    href="https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20am%20browsing%20your%20website%20and%20want%20to%20consult%20with%20your%20engineering%20team."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
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
                    className="text-slate-400 hover:text-slate-600"
                  >
                    Maybe later
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
