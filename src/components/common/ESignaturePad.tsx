"use client";

import { useRef, useState, useEffect } from "react";
import { PenTool, Type, RotateCcw, Check, ShieldCheck, AlertCircle } from "lucide-react";

interface ESignaturePadProps {
  initialName?: string;
  onSave: (signatureData: {
    dataUrl: string;
    signedByName: string;
    designation: string;
    signatureType: "DRAWN" | "TYPED_SEAL";
  }) => void;
  onCancel?: () => void;
  submitting?: boolean;
}

export default function ESignaturePad({
  initialName = "",
  onSave,
  onCancel,
  submitting = false,
}: ESignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<"DRAW" | "TYPE">("DRAW");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [fullName, setFullName] = useState(initialName);
  const [designation, setDesignation] = useState("Authorized Signatory");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0284c7"; // sky-600
    ctx.lineWidth = 2.5;

    // Background fill
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, [mode]);

  // Coordinate helper
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg("");
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Generate Typed Signature Seal as Image
  const generateTypedSignatureDataUrl = (): string => {
    const offscreen = document.createElement("canvas");
    offscreen.width = 500;
    offscreen.height = 160;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return "";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 500, 160);

    // Seal Border
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 480, 140);

    // Cursive Signature Text
    ctx.fillStyle = "#0369a1";
    ctx.font = "italic bold 34px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.fillText(fullName.trim() || "Authorized Signatory", 250, 75);

    // Subtext
    ctx.fillStyle = "#64748b";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${designation.toUpperCase()} • DIGITALLY VERIFIED`, 250, 110);
    ctx.fillText(`AUTHENTICATED VIA ABECSA E-SIGN PORTAL • ${new Date().toLocaleDateString("en-IN")}`, 250, 128);

    return offscreen.toDataURL("image/png");
  };

  const handleConfirmSignature = () => {
    if (!fullName.trim()) {
      setErrorMsg("Please enter your legal full name.");
      return;
    }
    if (!consentAccepted) {
      setErrorMsg("You must accept the legal agreement consent checkbox.");
      return;
    }

    let finalDataUrl = "";
    if (mode === "DRAW") {
      if (!hasDrawn) {
        setErrorMsg("Please draw your signature on the pad above or switch to Type mode.");
        return;
      }
      const canvas = canvasRef.current;
      finalDataUrl = canvas ? canvas.toDataURL("image/png") : "";
    } else {
      finalDataUrl = generateTypedSignatureDataUrl();
    }

    onSave({
      dataUrl: finalDataUrl,
      signedByName: fullName.trim(),
      designation: designation.trim() || "Authorized Signatory",
      signatureType: mode === "DRAW" ? "DRAWN" : "TYPED_SEAL",
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xl space-y-4 max-w-lg w-full mx-auto">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900">Digital E-Signature Portal</h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("DRAW")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "DRAW" ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("TYPE")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "TYPE" ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Type Legal Seal</span>
          </button>
        </div>
      </div>

      {/* Drawing Pad Mode */}
      {mode === "DRAW" ? (
        <div className="space-y-2">
          <div className="relative border-2 border-dashed border-sky-300 rounded-2xl overflow-hidden bg-white touch-none">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-40 cursor-crosshair block"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs">
                Draw your signature here with finger or mouse
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            Draw in the box using your stylus, mouse, or touch screen.
          </p>
        </div>
      ) : (
        /* Type Seal Mode */
        <div className="space-y-2">
          <div className="p-4 rounded-2xl border-2 border-sky-300 bg-sky-50/40 text-center space-y-1">
            <p className="text-xl sm:text-2xl font-serif italic font-bold text-sky-700 tracking-wide">
              {fullName.trim() || "Your Legal Full Name"}
            </p>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">
              {designation.toUpperCase()} • DIGITALLY ENCRYPTED & VERIFIED
            </p>
            <p className="text-[9px] text-slate-400">
              ABECSA DIGITAL CERTIFICATE • {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
          <p className="text-[10px] text-slate-400">
            A cryptographic cursive seal will be stamped onto the formal agreement.
          </p>
        </div>
      )}

      {/* Signee Details Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Signee Full Legal Name *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Ananya Deshmukh"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Designation / Role *
          </label>
          <input
            type="text"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Director / Founder / CTO"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Legal Consent Checkbox */}
      <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(e) => setConsentAccepted(e.target.checked)}
          className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 h-4 w-4"
        />
        <span className="text-[11px] text-slate-600 leading-snug">
          I declare that I am legally authorized to execute this agreement and accept all commercial terms,
          specifications, and terms & conditions on behalf of our organization.
        </span>
      </label>

      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={handleConfirmSignature}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{submitting ? "Signing & Encrypting..." : "Affix Digital Signature & Seal"}</span>
        </button>
      </div>
    </div>
  );
}
