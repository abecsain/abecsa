"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Lock,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateQuotationPdf } from "@/lib/pdf";
import { downloadQuotationDocx, OfficialQuotationData } from "@/lib/docx";
import { downloadQuotationPdf } from "@/lib/quotationPdfGenerator";
import { numberToWordsRupees } from "@/lib/numberToWords";
import ESignaturePad from "@/components/common/ESignaturePad";

export default function QuotationPresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const quotationId = resolvedParams.id;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      const res = await fetch(`/api/quotations?id=${quotationId}`);
      const data = await res.json();
      if (res.ok && data.quotation) {
        setQuotation(data.quotation);
      } else {
        setErrorMsg(data.error || "Failed to load quotation.");
      }
    } catch {
      setErrorMsg("Network error fetching quotation proposal.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!quotation) return;
    const meta = quotation.metadata || {};

    const doc = generateQuotationPdf({
      quotationNumber: quotation.quotationNumber,
      title: quotation.title,
      customerName: quotation.customer?.user?.name || "Client",
      companyName: quotation.customer?.companyName || "Organization",
      customerAddress: quotation.customer?.address || undefined,
      customerPhone: quotation.customer?.user?.phone || undefined,
      customerEmail: quotation.customer?.user?.email,
      managerName: meta.assignedManagerName || quotation.project?.manager?.name || undefined,
      date: formatDate(quotation.createdAt),
      validUntil: formatDate(quotation.validUntil),
      items: quotation.items || [],
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      paymentTerms: quotation.paymentTerms || undefined,
      notes: quotation.notes || undefined,
      termsConditions: quotation.termsConditions || undefined,
      eSignature: meta.eSignature || undefined,
      signedByName: meta.signedByName || undefined,
      signedAt: meta.signedAt ? formatDate(meta.signedAt) : undefined,
      signedDesignation: meta.signedByDesignation || undefined,
      signedIp: meta.signedIp || undefined,
      verificationHash: meta.verificationHash || undefined,
    });

    doc.save(`${quotation.quotationNumber}_Agreement_ABECSA.pdf`);
  };

  const getOfficialQuotationPayload = (): OfficialQuotationData => {
    return {
      quotationNumber: quotation.quotationNumber,
      date: formatDate(quotation.createdAt),
      clientName: quotation.customer?.companyName || quotation.customer?.user?.name || "Client Organization",
      projectName: quotation.title || "Website, Server & Database Solutions",
      contactEmail: quotation.customer?.user?.email || "contact@abecsa.com",
      contactPhone: quotation.customer?.user?.phone || undefined,
      title: quotation.title || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: "Complete Starter Package • UI/UX • Website • Server • High-Performance Database",
      scopeBullets: [
        "Custom UI/UX design tailored specifically for business branding and customer trust.",
        "Responsive multi-page website/application with optimized cross-device viewport compatibility.",
        "Integration of client-provided digital assets, catalog media, product photos, and content.",
        "Basic SEO setup, metadata tags, and mobile-friendly speed optimization.",
        "Dedicated High-Speed Database allocation with optimized transactional queries.",
        "Cloud server deployment with automatic SSL certificate encryption and 99.9% uptime SLA.",
        "Basic end-to-end testing, quality assurance verification, deployment, and handover.",
      ],
      items:
        quotation.items && quotation.items.length > 0
          ? quotation.items.map((it: any) => ({
              service: it.description,
              includedWork: it.description,
              price: it.amount || (it.unitPrice * (it.quantity || 1)),
            }))
          : [
              {
                service: "Core Software & Cloud Setup",
                includedWork: "Full system development & deployment",
                price: quotation.subtotal,
              },
            ],
      subtotal: quotation.subtotal,
      discount: quotation.discount || 0,
      taxAmount: quotation.taxAmount || 0,
      totalAmount: quotation.totalAmount,
      amountInWords: numberToWordsRupees(quotation.totalAmount),
      paymentMilestones: [
        { milestone: "Kickoff & Project Initiation", percentage: 40, amount: Math.round(quotation.totalAmount * 0.4) },
        { milestone: "UI/UX Approval & Core Demo", percentage: 40, amount: Math.round(quotation.totalAmount * 0.4) },
        { milestone: "Final Deployment, Handover & Launch", percentage: 20, amount: Math.round(quotation.totalAmount * 0.2) },
      ],
      paymentScheduleNote:
        "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
      hostingConditions: [
        "Hosting server and database operations are provided under standard infrastructure tiers configured for optimal uptime and performance.",
        "Client agrees to operate within allocated disk, bandwidth, and database capacities. Storage expansion is available upon request at standard add-on rates.",
        "Third-party external subscriptions (e.g., custom domain name registration, third-party SMS/WhatsApp gateway credits, paid external API licenses) remain the direct billing responsibility of the client unless explicitly bundled.",
      ],
      revisionsSupport: [
        "Includes up to two (2) consolidated rounds of feedback and minor revisions during the UI/UX and feature staging phases.",
        "Comprehensive seven (7) calendar days of post-handover technical support is provided to address bugs, operational questions, or configuration adjustments at no additional charge.",
      ],
      clientResponsibilities: [
        "Client agrees to furnish necessary branding assets, product listings, textual content, credentials, and approvals in a prompt manner to maintain development schedules.",
        "Timely review and milestone feedback are required to ensure target launch schedules are met.",
      ],
      acceptanceValidity: [
        "This quotation is valid for fifteen (15) calendar days from the date of issue.",
        "To proceed, please authorize this proposal via formal signature, email confirmation, or purchase order.",
      ],
    };
  };

  const handleDownloadWord = async () => {
    if (!quotation) return;
    const payload = getOfficialQuotationPayload();
    await downloadQuotationDocx(payload, `${quotation.quotationNumber}_Quotation_ABECSA.docx`);
  };

  const handleDownloadOfficialPdf = () => {
    if (!quotation) return;
    const payload = getOfficialQuotationPayload();
    downloadQuotationPdf(payload, `${quotation.quotationNumber}_Quotation_ABECSA.pdf`);
  };

  const handleSaveSignature = async (sigData: {
    dataUrl: string;
    signedByName: string;
    designation: string;
    signatureType: "DRAWN" | "TYPED_SEAL";
  }) => {
    setSigning(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotation.id,
          action: "ESIGN",
          eSignature: sigData.dataUrl,
          signedByName: sigData.signedByName,
          signedByDesignation: sigData.designation,
          signedByEmail: quotation.customer?.user?.email,
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
        setShowSignModal(false);
        fetchQuotation();
      } else {
        alert(data.error || "Failed to submit digital signature.");
      }
    } catch {
      alert("Error submitting digital signature. Please try again.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Loading Official Proposal & Agreement...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !quotation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Proposal Not Found</h2>
          <p className="text-xs text-slate-500">{errorMsg || "The requested quotation does not exist or has been archived."}</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors"
          >
            ← Return to ABECSA Home
          </Link>
        </div>
      </div>
    );
  }

  const meta = quotation.metadata || {};
  const isApproved = quotation.status === "APPROVED" || quotation.status === "CONVERTED_TO_INVOICE" || quotation.status === "CONVERTED_TO_PROJECT";
  const isSigned = Boolean(meta.signedByName || meta.eSignature);

  return (
    <div className="min-h-screen bg-slate-100 selection:bg-sky-500 selection:text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Floating Action Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-32">
              <Image src="/logo.png" alt="ABECSA" fill className="object-contain" unoptimized priority />
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div>
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                COMMERCIAL PROPOSAL & AGREEMENT
              </span>
              <p className="text-xs font-bold text-slate-900">{quotation.quotationNumber}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadWord}
              className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-xs font-bold text-blue-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Download editable Microsoft Word document (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Word (.docx)</span>
            </button>

            <button
              onClick={handleDownloadOfficialPdf}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="Download printable official PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF (.pdf)</span>
            </button>

            {!isSigned && (
              <button
                onClick={() => setShowSignModal(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Execute with E-Sign</span>
              </button>
            )}
          </div>
        </div>

        {/* E-Signature Verified Banner (If Signed) */}
        {isSigned && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                  DIGITALLY EXECUTED & SEALED
                </span>
                <h3 className="text-sm font-bold text-white">
                  Executed by {meta.signedByName} ({meta.signedByDesignation || "Authorized Signatory"})
                </h3>
                <p className="text-[11px] text-emerald-200/80">
                  Timestamp: {meta.signedAt ? formatDate(meta.signedAt) : formatDate(quotation.updatedAt)} • IP: {meta.signedIp || "127.0.0.1"} • Hash: {meta.verificationHash || "VERIFIED"}
                </p>
              </div>
            </div>

            {meta.eSignature && meta.eSignature.startsWith("data:image/") && (
              <div className="bg-white/10 backdrop-blur-xs p-1.5 rounded-xl border border-white/20 self-start sm:self-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={meta.eSignature} alt="Digital Signature" className="h-10 w-auto object-contain invert brightness-0" />
              </div>
            )}
          </div>
        )}

        {/* Main Document Body Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
          {/* Header Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 uppercase">
                  {quotation.quotationNumber}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                    isApproved
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isApproved ? "EXECUTED & APPROVED" : quotation.status}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                {quotation.title}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Issued on {formatDate(quotation.createdAt)} • Valid through {formatDate(quotation.validUntil)}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold text-slate-400">Total Contract Value</p>
              <p className="text-2xl sm:text-3xl font-black text-sky-600">
                {formatCurrency(quotation.totalAmount)}
              </p>
              <p className="text-[10px] text-slate-400">Includes 18% GST & Complete Delivery SLA</p>
            </div>
          </div>

          {/* Parties & Stakeholders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Service Provider */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                SERVICE PROVIDER
              </span>
              <h4 className="text-xs font-bold text-slate-900">ABECSA Software Solutions</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cyber City Tech Park, Tower B, Level 4, Bengaluru, Karnataka 560100
              </p>
              <div className="pt-1 text-[10px] text-slate-500 space-y-0.5">
                <p>GSTIN: 29AABCA1234F1Z8</p>
                <p>Email: contact@abecsa.in</p>
              </div>
            </div>

            {/* Client / Customer */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">
                CLIENT ORGANIZATION
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                {quotation.customer?.companyName || "Client Enterprise"}
              </h4>
              <p className="text-[11px] text-slate-600">
                Attention: {quotation.customer?.user?.name || "Client Representative"}
              </p>
              <div className="pt-1 text-[10px] text-slate-500 space-y-0.5">
                <p>Email: {quotation.customer?.user?.email}</p>
                {quotation.customer?.user?.phone && <p>Phone: {quotation.customer?.user?.phone}</p>}
                {quotation.customer?.gstNumber && <p>GSTIN: {quotation.customer.gstNumber}</p>}
              </div>
            </div>

            {/* Assigned Delivery Manager */}
            <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2">
              <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                ASSIGNED DELIVERY MANAGER
              </span>
              <h4 className="text-xs font-bold text-slate-900">
                {meta.assignedManagerName || quotation.project?.manager?.name || "Senior Delivery Operations"}
              </h4>
              <p className="text-[11px] text-slate-600">
                Directly responsible for sprint timelines, milestone delivery, and quality assurance.
              </p>
              <div className="pt-1 text-[10px] text-slate-500">
                <p>Email: manager@abecsa.in</p>
                <p>Direct WhatsApp & Call Enabled</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Deliverable Milestones & Engineering Scope</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Deliverable Scope / Milestone Specifications</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Rate</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotation.items?.map((it: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-bold">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{it.description}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{it.quantity}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown & Milestone Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Payment Milestones & Invoicing Schedule
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {quotation.paymentTerms || "30% Advance Mobilization, 40% Milestone 2 Delivery, 30% Final Sign-off"}
              </p>
              {quotation.notes && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Additional Engineering Notes</p>
                  <p className="text-xs text-slate-600">{quotation.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2 text-right self-end md:self-auto">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal (Net of Taxes):</span>
                <span>{formatCurrency(quotation.subtotal)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                  <span>Commercial Discount Applied:</span>
                  <span>- {formatCurrency(quotation.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-600">
                <span>GST ({quotation.taxRate}%):</span>
                <span>{formatCurrency(quotation.taxAmount)}</span>
              </div>
              <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Grand Total (INR):</span>
                <span className="text-sky-600">{formatCurrency(quotation.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions / Master Legal Agreement */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>{meta.agreementTitle || "Master Software Services Agreement - Terms & Conditions"}</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Legal Contract</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 text-xs leading-relaxed font-mono whitespace-pre-wrap max-h-96 overflow-y-auto border border-slate-800 shadow-inner">
              {quotation.termsConditions || "Standard ABECSA Master Terms & Conditions Apply."}
            </div>
          </div>

          {/* Execution & E-Sign Action Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-900">
                {isSigned ? "Contract Legally Executed" : "Awaiting Client Digital Signature"}
              </p>
              <p className="text-[11px] text-slate-500">
                {isSigned
                  ? `Signed on ${formatDate(meta.signedAt || quotation.updatedAt)} by ${meta.signedByName}`
                  : "Both parties can execute and verify this agreement online."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={handleDownloadWord}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-xs font-bold text-blue-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Word (.docx)</span>
              </button>

              <button
                onClick={handleDownloadOfficialPdf}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF (.pdf)</span>
              </button>

              {!isSigned && (
                <button
                  onClick={() => setShowSignModal(true)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Execute with E-Sign</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive E-Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <ESignaturePad
              initialName={quotation.customer?.user?.name || ""}
              onSave={handleSaveSignature}
              onCancel={() => setShowSignModal(false)}
              submitting={signing}
            />
          </div>
        </div>
      )}
    </div>
  );
}
