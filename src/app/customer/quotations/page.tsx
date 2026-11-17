"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateQuotationPdf } from "@/lib/pdf";

export default function CustomerQuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    const doc = generateQuotationPdf({
      quotationNumber: q.quotationNumber,
      title: q.title,
      customerName: q.customer?.user?.name || "Client",
      companyName: q.customer?.companyName || "Organization",
      customerAddress: q.customer?.address || undefined,
      customerEmail: q.customer?.user?.email,
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
    });
    doc.save(`${q.quotationNumber}_ABECSA.pdf`);
  };

  const handleDecideQuotation = async (quotationId: string, action: "APPROVE" | "REJECT") => {
    setSubmitting(true);
    try {
      if (action === "APPROVE") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotationId,
          action,
          clientResponse: action === "APPROVE" ? "Approved by client via portal." : "Revision requested.",
        }),
      });

      if (res.ok) {
        alert(
          action === "APPROVE"
            ? "Quotation approved! Our delivery operations team has been notified."
            : "Revision request submitted to your project manager."
        );
        fetchQuotations();
      }
    } catch {
      alert("Error submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Commercial Quotations & Proposals
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review itemized scope breakdowns, tax specifications, and sign off on formal proposals online.
        </p>
      </div>

      <div className="space-y-6">
        {quotations.map((q) => (
          <div key={q.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase">{q.quotationNumber}</span>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">{q.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    q.status === "APPROVED" || q.status === "CONVERTED_TO_INVOICE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {q.status}
                </span>

                <button
                  onClick={() => handleDownloadPdf(q)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
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
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{it.description}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-800">Payment Milestones:</p>
                <p className="text-slate-600">{q.paymentTerms || "Standard phased milestones"}</p>
                <p className="text-[10px] text-slate-400">Valid Until: {formatDate(q.validUntil)}</p>
              </div>

              <div className="space-y-1 text-right self-end sm:self-auto min-w-[200px]">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(q.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST (18%):</span>
                  <span>{formatCurrency(q.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t pt-1">
                  <span>Gross Total:</span>
                  <span className="text-sky-600">{formatCurrency(q.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Approval Action Bar */}
            {q.status === "SENT" && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t">
                <button
                  disabled={submitting}
                  onClick={() => handleDecideQuotation(q.id, "REJECT")}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Request Scope Revision
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleDecideQuotation(q.id, "APPROVE")}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Approve & Authorize Quotation</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
