"use client";

import { useEffect, useRef, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gift,
  Sparkles,
  PartyPopper,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  Clock,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface GiftData {
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
  isExpired: boolean;
  senderName: string;
  companyName: string;
  companyPhone: string;
  createdAt: string;
}

export default function PublicScratchGiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [gift, setGift] = useState<GiftData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isScratched, setIsScratched] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    fetchGift();
  }, [slug]);

  const fetchGift = async () => {
    try {
      const res = await fetch(`/api/gifts/${slug}`);
      const data = await res.json();
      if (res.ok && data.gift) {
        setGift(data.gift);
        if (data.gift.isScratched) {
          setIsScratched(true);
          setScratchPercent(100);
        }
      } else {
        setError(data.error || "Gift scratch card not found");
      }
    } catch {
      setError("Unable to load surprise gift. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Canvas
  useEffect(() => {
    if (!gift || isScratched) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // High DPI Canvas Scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Draw luxury metallic gradient cover
    const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    grad.addColorStop(0, "#475569");
    grad.addColorStop(0.3, "#64748b");
    grad.addColorStop(0.5, "#94a3b8");
    grad.addColorStop(0.7, "#64748b");
    grad.addColorStop(1, "#334155");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw decorative stars & patterns
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    for (let i = 0; i < 40; i++) {
      const px = (i * 37) % rect.width;
      const py = (i * 29) % rect.height;
      ctx.beginPath();
      ctx.arc(px, py, (i % 3) + 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner subtle dashed border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(12, 12, rect.width - 24, rect.height - 24);
    ctx.setLineDash([]);

    // Draw Instructions text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨ SCRATCH HERE ✨", rect.width / 2, rect.height / 2 - 14);

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "600 13px sans-serif";
    ctx.fillText("Swipe to reveal your surprise gift!", rect.width / 2, rect.height / 2 + 16);
  }, [gift, isScratched]);

  // Scratch Drawing
  const scratch = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = 42;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    if (lastPosRef.current) {
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(x, y);
    } else {
      ctx.arc(x, y, 21, 0, Math.PI * 2);
    }
    ctx.stroke();

    lastPosRef.current = { x, y };

    // Calculate scratched percentage periodically
    checkScratchedPercentage(ctx, rect.width, rect.height);
  };

  const checkScratchedPercentage = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    try {
      const dpr = window.devicePixelRatio || 1;
      const sampleStep = 16 * dpr;
      const imgData = ctx.getImageData(0, 0, width * dpr, height * dpr);
      const data = imgData.data;
      let transparentPixels = 0;
      let totalSampled = 0;

      for (let i = 3; i < data.length; i += 4 * sampleStep) {
        totalSampled++;
        if (data[i] === 0) {
          transparentPixels++;
        }
      }

      const percent = Math.round((transparentPixels / totalSampled) * 100);
      setScratchPercent(percent);

      if (percent >= 40 && !isScratched) {
        revealCardCompletely();
      }
    } catch {
      // non-fatal
    }
  };

  const revealCardCompletely = async () => {
    setIsScratched(true);
    setScratchPercent(100);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    try {
      await fetch(`/api/gifts/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SCRATCH" }),
      });
    } catch {
      // non-fatal
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isScratched) return;
    isDrawingRef.current = true;
    lastPosRef.current = null;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isScratched) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  // Touch Handlers for Mobile Phones
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (isScratched) return;
    isDrawingRef.current = true;
    lastPosRef.current = null;
    const touch = e.touches[0];
    if (touch) scratch(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isScratched) return;
    const touch = e.touches[0];
    if (touch) {
      scratch(touch.clientX, touch.clientY);
      // prevent page scroll while scratching
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleTouchEnd = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  // Copy Coupon Code
  const handleCopyCode = () => {
    if (!gift?.couponCode) return;
    navigator.clipboard.writeText(gift.couponCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Claim Button Click
  const handleClaim = async () => {
    if (!gift) return;
    setClaiming(true);

    try {
      await fetch(`/api/gifts/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLAIM" }),
      });
    } catch {
      // non-fatal
    }

    // Determine target URL
    if (gift.redirectionType === "CUSTOM_URL" && gift.customUrl) {
      window.location.href = gift.customUrl;
    } else {
      // WhatsApp Redirection (Default)
      const targetPhone = gift.companyPhone || "919876543210";
      const message =
        gift.whatsappMessage ||
        `Hello ABECSA Team! I am claiming my gift: ${gift.prizeTitle} (Code: ${gift.couponCode})`;
      const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
      window.location.href = waUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="h-14 w-14 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-bold tracking-wide text-amber-200">
            Unwrapping your surprise gift...
          </p>
        </div>
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="h-12 w-12 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">{error || "Gift Card Expired or Not Found"}</h2>
          <p className="text-xs text-slate-400">
            This gift link may have expired or already been removed. Please reach out to your account manager or ABECSA support.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            Visit ABECSA Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 selection:bg-amber-500 selection:text-slate-950">
      {/* Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-9 w-32">
            <Image
              src="/logo-white.png"
              alt="ABECSA"
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </Link>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
          <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
          <span>Surprise Gift</span>
        </span>
      </header>

      {/* Main Scratch Card Container */}
      <main className="max-w-md mx-auto w-full my-auto py-4 space-y-4">
        {/* Recipient Badge */}
        {gift.customerName && (
          <div className="text-center space-y-1">
            <span className="text-[11px] font-bold tracking-wider text-amber-400 uppercase">
              Exclusive Privilege Card
            </span>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Prepared for {gift.customerName}
            </h1>
          </div>
        )}

        {/* Gift Card Box */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 p-5 sm:p-6 space-y-5 relative overflow-hidden">
          {/* Subtle Glow Background */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Title & Issuer */}
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                From {gift.senderName} ({gift.companyName})
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {gift.title}
              </h2>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
          </div>

          {/* THE SCRATCH AREA */}
          <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-slate-950 min-h-[220px] shadow-inner flex items-center justify-center select-none">
            {/* UNDERNEATH REVEALED CONTENT */}
            <div className="p-6 text-center space-y-3 w-full animate-in fade-in duration-300">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 animate-bounce">
                <Sparkles className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block">
                  🎉 YOU UNLOCKED:
                </span>
                <h3 className="text-lg sm:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 mt-0.5">
                  {gift.prizeTitle}
                </h3>
              </div>

              {gift.prizeDescription && (
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  {gift.prizeDescription}
                </p>
              )}

              {/* Coupon Code Pill */}
              {gift.couponCode && (
                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-amber-400/50 text-amber-300">
                    <span className="text-[11px] font-mono font-bold tracking-wider">
                      {gift.couponCode}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 hover:text-white transition-colors cursor-pointer"
                      title="Copy Coupon Code"
                    >
                      {copiedCode ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  {copiedCode && (
                    <span className="block text-[10px] text-emerald-400 font-semibold mt-1">
                      Code copied to clipboard!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* TOP SCRATCH CANVAS OVERLAY */}
            {!isScratched && (
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none z-20 transition-opacity duration-300"
              />
            )}
          </div>

          {/* Quick Reveal / Status text */}
          {!isScratched ? (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Scratch progress: {scratchPercent}%</span>
              <button
                onClick={revealCardCompletely}
                className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer text-[11px]"
              >
                Instant Reveal &rarr;
              </button>
            </div>
          ) : (
            <div className="text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>Surprise Revealed! Claim your gift below:</span>
            </div>
          )}

          {/* CLAIM ACTION BUTTON */}
          <div className="pt-2">
            <button
              onClick={handleClaim}
              disabled={claiming || gift.isExpired}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-[0.98] ${
                isScratched
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 hover:brightness-110 shadow-amber-500/25"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {gift.redirectionType === "CUSTOM_URL" ? (
                <ExternalLink className="w-4 h-4" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>{gift.buttonText || "Claim Gift on WhatsApp"}</span>
            </button>
          </div>

          {/* Expiration Note */}
          {gift.expiresAt && (
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 pt-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Valid until {new Date(gift.expiresAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Security & Authenticity Trust Strip */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 text-center">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Official ABECSA Customer Gift</span>
          </div>
          <span>•</span>
          <a
            href="tel:+919876543210"
            className="text-slate-300 hover:text-white underline font-semibold"
          >
            Direct Help Line
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 py-2">
        &copy; {new Date().getFullYear()} {gift.companyName}. All Rights Reserved.
      </footer>
    </div>
  );
}
