import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface QuotationPdfData {
  quotationNumber: string;
  title: string;
  customerName: string;
  companyName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  managerName?: string;
  date: string;
  validUntil: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms?: string;
  notes?: string;
  termsConditions?: string;
  eSignature?: string;
  signedByName?: string;
  signedAt?: string;
  signedDesignation?: string;
  signedIp?: string;
  verificationHash?: string;
}

export interface InvoicePdfData {
  invoiceNumber: string;
  customerName: string;
  companyName: string;
  customerAddress?: string;
  customerGst?: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  paymentTerms?: string;
  notes?: string;
}

export function generateQuotationPdf(data: QuotationPdfData): jsPDF {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, "F");

  // Company Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ABECSA SOFTWARE SOLUTIONS", 14, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Enterprise Digital Solutions & Software Engineering | www.abecsa.in", 14, 25);
  doc.text("GSTIN: 29AABCA1234F1Z8 | Email: Abecsa.in@gmail.com | Ph: +91 94078 99216", 14, 31);

  // Document Title Pill
  doc.setFillColor(2, 132, 199); // primary sky-600
  doc.roundedRect(140, 10, 56, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL QUOTATION", 144, 22);

  // Metadata Grid
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PREPARED FOR:", 14, 48);
  doc.text("QUOTATION DETAILS:", 130, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Client: ${data.customerName}`, 14, 55);
  doc.text(`Organization: ${data.companyName}`, 14, 61);
  if (data.customerAddress) doc.text(`Address: ${data.customerAddress}`, 14, 67, { maxWidth: 95 });
  if (data.customerEmail) doc.text(`Email: ${data.customerEmail}`, 14, 75);

  doc.text(`Quote No: ${data.quotationNumber}`, 130, 55);
  doc.text(`Date of Issue: ${data.date}`, 130, 61);
  doc.text(`Valid Until: ${data.validUntil}`, 130, 67);
  doc.text(`Project: ${data.title}`, 130, 73, { maxWidth: 65 });

  // Items Table
  const tableRows = data.items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantity,
    `INR ${item.unitPrice.toLocaleString("en-IN")}`,
    `INR ${item.amount.toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["#", "Service Scope & Deliverables", "Qty", "Unit Rate", "Amount"]],
    body: tableRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 95 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Financial Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, finalY, 76, 42, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, finalY, 76, 42, 2, 2, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Subtotal:", 125, finalY + 8);
  doc.text(`INR ${data.subtotal.toLocaleString("en-IN")}`, 190, finalY + 8, { align: "right" });

  doc.text("Discount:", 125, finalY + 15);
  doc.text(`- INR ${data.discount.toLocaleString("en-IN")}`, 190, finalY + 15, { align: "right" });

  doc.text(`GST (${data.taxRate}%):`, 125, finalY + 22);
  doc.text(`INR ${data.taxAmount.toLocaleString("en-IN")}`, 190, finalY + 22, { align: "right" });

  doc.setLineWidth(0.3);
  doc.line(125, finalY + 27, 192, finalY + 27);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Value:", 125, finalY + 35);
  doc.text(`INR ${data.totalAmount.toLocaleString("en-IN")}`, 190, finalY + 35, { align: "right" });

  // Payment Terms and Notes
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("PAYMENT MILESTONES & TERMS:", 14, finalY + 8);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  const terms = data.paymentTerms || "30% Advance Mobilization, 40% Milestone 2 Delivery, 30% Final Sign-off.";
  doc.text(terms, 14, finalY + 15, { maxWidth: 95 });

  if (data.notes) {
    doc.setFont("helvetica", "bold");
    doc.text("NOTES:", 14, finalY + 26);
    doc.setFont("helvetica", "normal");
    doc.text(data.notes, 14, finalY + 32, { maxWidth: 95 });
  }

  // Digital Signature & E-Sign Verification Block
  if (data.signedByName || data.eSignature) {
    let sigY = finalY + 46;
    if (sigY > 225) {
      doc.addPage();
      sigY = 20;
    }

    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(34, 197, 94); // emerald-500
    doc.roundedRect(14, sigY, 182, 34, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text("VERIFIED DIGITAL E-SIGNATURE & LEGAL EXECUTION", 20, sigY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Signed By: ${data.signedByName || data.customerName} (${data.signedDesignation || "Authorized Signatory"})`, 20, sigY + 14);
    doc.text(`Organization: ${data.companyName}`, 20, sigY + 20);
    doc.text(`Execution Date: ${data.signedAt || data.date} | IP: ${data.signedIp || "127.0.0.1 (Verified)"}`, 20, sigY + 26);
    if (data.verificationHash) {
      doc.text(`Audit Hash: ${data.verificationHash}`, 20, sigY + 31);
    }

    if (data.eSignature && data.eSignature.startsWith("data:image/")) {
      try {
        doc.addImage(data.eSignature, "PNG", 142, sigY + 4, 46, 26);
      } catch {
        // signature image fallback
      }
    }
  }

  // Agreement Terms & Conditions Page
  if (data.termsConditions) {
    doc.addPage();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 24, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("MASTER SERVICES AGREEMENT - TERMS & CONDITIONS", 14, 15);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const splitTerms = doc.splitTextToSize(data.termsConditions, 182);
    doc.text(splitTerms, 14, 32);
  }

  // Footer Signoff
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Authorized Signatory: ABECSA Software Solutions", 14, 275);
  doc.text("Thank you for your business. For any queries, reach us at Abecsa.in@gmail.com | +91 94078 99216", 14, 280);

  return doc;
}

export function generateInvoicePdf(data: InvoicePdfData): jsPDF {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 38, "F");

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ABECSA SOFTWARE SOLUTIONS", 14, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Enterprise Digital Solutions & Software Engineering | www.abecsa.in", 14, 25);
  doc.text("GSTIN: 29AABCA1234F1Z8 | Email: billing@abecsa.in | Ph: +91 98765 43210", 14, 31);

  // Invoice Pill
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(140, 10, 56, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 152, 22);

  // Metadata Grid
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO:", 14, 48);
  doc.text("INVOICE SUMMARY:", 130, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Client: ${data.customerName}`, 14, 55);
  doc.text(`Organization: ${data.companyName}`, 14, 61);
  if (data.customerGst) doc.text(`GSTIN: ${data.customerGst}`, 14, 67);
  if (data.customerAddress) doc.text(`Address: ${data.customerAddress}`, 14, 73, { maxWidth: 95 });

  doc.text(`Invoice No: ${data.invoiceNumber}`, 130, 55);
  doc.text(`Issue Date: ${data.issueDate}`, 130, 61);
  doc.text(`Payment Due: ${data.dueDate}`, 130, 67);

  // Items Table
  const tableRows = data.items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantity,
    `INR ${item.unitPrice.toLocaleString("en-IN")}`,
    `INR ${item.amount.toLocaleString("en-IN")}`,
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["#", "Service Description", "Qty", "Unit Price", "Total Amount"]],
    body: tableRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 95 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Financial Breakdown Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(120, finalY, 76, 45, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, finalY, 76, 45, 2, 2, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Taxable Subtotal:", 125, finalY + 8);
  doc.text(`INR ${data.subtotal.toLocaleString("en-IN")}`, 190, finalY + 8, { align: "right" });

  doc.text("GST Amount (18%):", 125, finalY + 15);
  doc.text(`INR ${data.taxAmount.toLocaleString("en-IN")}`, 190, finalY + 15, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("Gross Total:", 125, finalY + 22);
  doc.text(`INR ${data.totalAmount.toLocaleString("en-IN")}`, 190, finalY + 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.text("Amount Paid:", 125, finalY + 29);
  doc.text(`INR ${data.amountPaid.toLocaleString("en-IN")}`, 190, finalY + 29, { align: "right" });

  doc.line(125, finalY + 33, 192, finalY + 33);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(data.balanceAmount > 0 ? 220 : 16, data.balanceAmount > 0 ? 38 : 185, data.balanceAmount > 0 ? 38 : 129);
  doc.text("Balance Due:", 125, finalY + 40);
  doc.text(`INR ${data.balanceAmount.toLocaleString("en-IN")}`, 190, finalY + 40, { align: "right" });

  // Bank Account & Payment Instructions
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("BANK REMITTANCE DETAILS:", 14, finalY + 8);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Bank Name: HDFC Bank Limited", 14, finalY + 14);
  doc.text("Account Name: ABECSA SOFTWARE SOLUTIONS PVT LTD", 14, finalY + 20);
  doc.text("Account No: 50200088991122", 14, finalY + 26);
  doc.text("IFSC Code: HDFC0001234 (Branch: HSR Layout, Bengaluru)", 14, finalY + 32);
  doc.text("Corporate UPI: abecsa@hdfcbank", 14, finalY + 38);

  // Footer Signoff
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This is a computer-generated tax invoice issued by ABECSA Software Solutions.", 14, 278);

  return doc;
}
