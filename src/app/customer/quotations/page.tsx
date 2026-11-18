"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Check,
  ShieldCheck,
  UserCheck,
  Layers,
  ExternalLink,
  PenTool,
  X,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateQuotationPdf } from "@/lib/pdf";
import ESignaturePad from "@/components/common/ESignaturePad";

export default function CustomerQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // E-Sign Modal State
  const [activeQuotationForSigning, setActiveQuotationForSigning] = useState<any | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.quotations) setQuotations(data.quotations);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (q: any) => {
    const meta = q.metadata || {};
    const doc = generateQuotationPdf({
      quotationNumber: q.quotationNumber,
      title: q.title,
      customerName: q.customer?.user?.name || "Client",
      companyName: q.customer?.companyName || "Organization",
      customerAddress: q.customer?.address || undefined,
      customerPhone: q.customer?.user?.phone || undefined,
      customerEmail: q.customer?.user?.email,
      managerName: meta.assignedManagerName || q.project?.manager?.name || undefined,
      date: formatDate(q.createdAt),
      validUntil: formatDate(q.validUntil),
      items: q.items || [],
      subtotal: q.subtotal,
      discount: q.discount,
      taxRate: q.taxRate,
      taxAmount: q.taxAmount,
      totalAmount: q.totalAmount,
      paymentTerms: q.paymentTerms || undefined,
      notes: q.notes || undefined,
      termsConditions: q.termsConditions || undefined,
      eSignature: meta.eSignature || undefined,
      signedByName: meta.signedByName || undefined,
      signedAt: meta.signedAt ? formatDate(meta.signedAt) : undefined,
      signedDesignation: meta.signedByDesignation || undefined,
      signedIp: meta.signedIp || undefined,
      verificationHash: meta.verificationHash || undefined,
    });
    doc.save(`${q.quotationNumber}_Agreement_ABECSA.pdf`);
  };

  const handleSaveSignature = async (sigData: {
    dataUrl: string;
    signedByName: string;
    designation: string;
    signatureType: "DRAWN" | "TYPED_SEAL";
  }) => {
    if (!activeQuotationForSigning) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeQuotationForSigning.id,
          action: "ESIGN",
          eSignature: sigData.dataUrl,
          signedByName: sigData.signedByName,
          signedByDesignation: sigData.designation,
          signedByEmail: activeQuotationForSigning.customer?.user?.email,
          agreementAccepted: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
        setActiveQuotationForSigning(null);
        alert("Agreement and Quotation successfully executed with your verified digital signature!");
        fetchQuotations();
      } else {
        alert(data.error || "Failed to submit digital signature.");
      }
    } catch {
      alert("Error submitting signature. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async (quotationId: string) => {
    const note = prompt("Please describe what changes you would like to request on this proposal:");
    if (!note) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotationId,
          action: "REJECT",
          clientResponse: `Revision Requested by Client: ${note}`,
        }),
      });

      if (res.ok) {
        alert("Scope revision request sent to your dedicated Delivery Manager.");
        fetchQuotations();
      }
    } catch {
      alert("Error submitting revision request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            COMMERCIAL AGREEMENTS & QUOTATIONS
          </span>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Proposals & Master Agreements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review itemized technical scopes, commercial pricing, and execute contracts with verified digital E-Signatures online.
          </p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        {quotations.map((q) => {
          const meta = q.metadata || {};
          const isSigned = Boolean(meta.signedByName || meta.eSignature);
          const isApproved = q.status === "APPROVED" || q.status === "CONVERTED_TO_INVOICE" || q.status === "CONVERTED_TO_PROJECT";
          const managerName = meta.assignedManagerName || q.project?.manager?.name || "Senior Delivery Operations";

          return (
            <div
              key={q.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 hover:border-sky-300 transition-all"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-sky-600 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-200">
                      {q.quotationNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isApproved
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {isApproved ? "EXECUTED & APPROVED" : q.status}
                    </span>

                    {/* Signed Badge */}
                    {isSigned && (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Digitally Signed by {meta.signedByName}</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{q.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/quotations/${q.id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl border border-sky-200 hover:bg-sky-50 text-xs font-bold text-sky-700 flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Full Proposal</span>
                  </Link>

                  <button
                    onClick={() => handleDownloadPdf(q)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Stakeholders Info (Delivery Manager & SLA) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-700 uppercase">Assigned Delivery Manager</span>
                    <p className="font-bold text-slate-900">{managerName}</p>
                    <p className="text-[11px] text-slate-500">Dedicated point of contact for sprint execution</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">100% IP Transfer & Warranty</span>
                    <p className="font-bold text-slate-900">Full Source Code Handover + 12 Mo. SLA</p>
                    <p className="text-[11px] text-slate-500">Protected under Master Agreement NDA</p>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Service Scope / Milestone</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {q.items?.map((it: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-medium text-slate-800">{it.description}</td>
                        <td className="py-2.5 px-3 text-center text-slate-500">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(it.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(it.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary & Payment Terms */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Payment Milestones:</p>
                  <p className="text-slate-600 font-medium">{q.paymentTerms || "Standard phased milestones"}</p>
                  <p className="text-[10px] text-slate-400">Proposal Valid Until: {formatDate(q.validUntil)}</p>
                </div>

                <div className="space-y-1 text-right self-end sm:self-auto min-w-[200px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(q.subtotal)}</span>
                  </div>
                  {q.discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>- {formatCurrency(q.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>GST (18%):</span>
                    <span>{formatCurrency(q.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-1">
                    <span>Grand Total:</span>
                    <span className="text-sky-600">{formatCurrency(q.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* E-Sign Action or Execution Status */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <div>
                  {isSigned ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>
                        Contract legally executed on {formatDate(meta.signedAt || q.updatedAt)} by {meta.signedByName}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Please review the terms and execute this agreement online using your digital signature.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!isSigned && (
                    <>
                      <button
                        disabled={submitting}
                        onClick={() => handleRequestRevision(q.id)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                      >
                        Request Revision
                      </button>

                      <button
                        disabled={submitting}
                        onClick={() => setActiveQuotationForSigning(q)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Review & E-Sign Agreement</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review & E-Sign Modal */}
      {activeQuotationForSigning && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 space-y-4">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  MASTER LEGAL AGREEMENT
                </span>
                <h3 className="text-base font-bold text-white">
                  Execute {activeQuotationForSigning.quotationNumber} with E-Sign
                </h3>
              </div>
              <button
                onClick={() => setActiveQuotationForSigning(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* Summary Banner */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{activeQuotationForSigning.title}</h4>
                  <p className="text-slate-600 text-[11px]">
                    Contract Investment: {formatCurrency(activeQuotationForSigning.totalAmount)} (Includes 18% GST)
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-sky-700 uppercase">Delivery Manager</span>
                  <p className="font-bold text-slate-900">
                    {activeQuotationForSigning.metadata?.assignedManagerName || "Senior Delivery Operations"}
                  </p>
                </div>
              </div>

              {/* Legal Terms Viewer */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Master Agreement Clauses & Terms & Conditions
                </label>
                <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto border border-slate-800">
                  {activeQuotationForSigning.termsConditions}
                </div>
              </div>

              {/* Digital Signature Pad */}
              <div>
                <ESignaturePad
                  initialName={activeQuotationForSigning.customer?.user?.name || ""}
                  onSave={handleSaveSignature}
                  onCancel={() => setActiveQuotationForSigning(null)}
                  submitting={submitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
