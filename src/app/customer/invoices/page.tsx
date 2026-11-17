"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Download,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/pdf";

export default function CustomerInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [transRef, setTransRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = (inv: any) => {
    const doc = generateInvoicePdf({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.user?.name || "Client",
      companyName: inv.customer?.companyName || "Organization",
      customerAddress: inv.customer?.address || undefined,
      customerGst: inv.customer?.gstNumber || undefined,
      issueDate: formatDate(inv.issueDate),
      dueDate: formatDate(inv.dueDate),
      items: inv.items || [],
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      totalAmount: inv.totalAmount,
      amountPaid: inv.amountPaid,
      balanceAmount: inv.balanceAmount,
      paymentTerms: inv.paymentTerms || undefined,
      notes: inv.notes || undefined,
    });
    doc.save(`${inv.invoiceNumber}_ABECSA.pdf`);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !payAmount) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(payAmount),
          paymentMethod,
          transactionReference: transRef,
        }),
      });

      if (res.ok) {
        alert("Payment acknowledgement recorded! Our finance department will verify the transaction.");
        setSelectedInvoice(null);
        fetchInvoices();
      }
    } catch {
      alert("Error submitting payment acknowledgement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Tax Invoices & Payment Receipts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View official tax invoices, check outstanding balance amounts, and submit NEFT/RTGS transaction reference numbers.
        </p>
      </div>

      <div className="space-y-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
              <div>
                <span className="text-[10px] font-bold text-sky-600 uppercase">{inv.invoiceNumber}</span>
                <h3 className="text-lg font-bold text-slate-900">Tax Invoice</h3>
                <p className="text-[11px] text-slate-400">Due Date: {formatDate(inv.dueDate)}</p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    inv.status === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {inv.status}
                </span>

                <button
                  onClick={() => handleDownloadPdf(inv)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Invoice Total:</span>
                <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(inv.totalAmount)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-emerald-700 block text-[10px]">Amount Paid:</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatCurrency(inv.amountPaid)}</span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
                <span className="text-rose-700 block text-[10px]">Balance Due:</span>
                <span className="font-extrabold text-rose-700 text-sm">{formatCurrency(inv.balanceAmount)}</span>
              </div>
            </div>

            {/* Payment Remittance instructions & Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t text-xs">
              <div className="text-slate-500 text-[11px]">
                <span>Bank: HDFC Bank A/C 50200088991122 (IFSC: HDFC0001234) • UPI: abecsa@hdfcbank</span>
              </div>

              {inv.balanceAmount > 0 && (
                <button
                  onClick={() => {
                    setSelectedInvoice(inv);
                    setPayAmount(String(inv.balanceAmount));
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Submit Payment Reference</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SUBMIT PAYMENT MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Payment Acknowledgement</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount Paid (INR) *</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                    <option value="UPI">Corporate UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">UTR / Ref Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC-NEFT-9988..."
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 rounded-lg border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                >
                  Submit Reference
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
