import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";
import { numberToWordsRupees } from "@/lib/numberToWords";
import { OfficialQuotationData } from "@/lib/docx";

export function generateOfficialQuotationPdf(data: OfficialQuotationData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 16;

  // Header Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(2, 132, 199); // Sky blue
  doc.text("ABECSA SOFTWARE SOLUTIONS", pageWidth / 2, currentY, { align: "center" });

  currentY += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // slate-900
  const title = (data.title || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION").toUpperCase();
  doc.text(title, pageWidth / 2, currentY, { align: "center" });

  currentY += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const subtitle = data.subtitle || "Complete Starter Package • UI/UX • Website • Server • 25 GB Database";
  doc.text(subtitle, pageWidth / 2, currentY, { align: "center" });

  currentY += 8;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, currentY, pageWidth - 14, currentY);

  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85); // slate-700

  // Metadata block (Quotation No, Date, Client Name, Project Name, Contact)
  const leftX = 14;
  const col2X = 54;

  doc.setFont("helvetica", "bold");
  doc.text("Quotation No.:", leftX, currentY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(2, 132, 199);
  doc.text(data.quotationNumber, col2X, currentY);

  currentY += 5;
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text("Date:", leftX, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(data.date, col2X, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Client Name:", leftX, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(data.clientName || "__________________________________________", col2X, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Project / Business:", leftX, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(data.projectName || "__________________________________________", col2X, currentY);

  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Contact / Email:", leftX, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.contactEmail}${data.contactPhone ? ` • ${data.contactPhone}` : ""}`, col2X, currentY);

  currentY += 8;

  // Section 1: Project Scope
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Project Scope", leftX, currentY);

  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  data.scopeBullets.forEach((bullet) => {
    if (currentY > 275) {
      doc.addPage();
      currentY = 16;
    }
    const splitText = doc.splitTextToSize(`• ${bullet}`, pageWidth - 28);
    doc.text(splitText, leftX + 2, currentY);
    currentY += splitText.length * 3.8;
  });

  currentY += 4;

  // Section 2: Itemized Cost Table
  if (currentY > 230) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Itemized Cost", leftX, currentY);
  currentY += 2;

  const costTableRows: any[] = data.items.map((item) => [
    item.service,
    item.includedWork,
    formatCurrency(item.price),
  ]);

  if (data.discount > 0) {
    costTableRows.push([
      { content: "Special Applied Discount", colSpan: 2, styles: { fontStyle: "bold", textColor: [5, 150, 105] } },
      { content: `-${formatCurrency(data.discount)}`, styles: { halign: "right", fontStyle: "bold", textColor: [5, 150, 105] } },
    ]);
  }

  if (data.taxAmount > 0) {
    costTableRows.push([
      { content: "GST Applicable (18%)", colSpan: 2, styles: { fontStyle: "bold" } },
      { content: formatCurrency(data.taxAmount), styles: { halign: "right", fontStyle: "bold" } },
    ]);
  }

  costTableRows.push([
    { content: "Total Package Price", colSpan: 2, styles: { fontStyle: "bold", fillColor: [241, 245, 249], fontSize: 10 } },
    { content: formatCurrency(data.totalAmount), styles: { halign: "right", fontStyle: "bold", fillColor: [241, 245, 249], fontSize: 10, textColor: [2, 132, 199] } },
  ]);

  const amountWords = data.amountInWords || numberToWordsRupees(data.totalAmount);
  costTableRows.push([
    {
      content: `Amount in Words: ${amountWords}`,
      colSpan: 3,
      styles: { fontStyle: "italic", textColor: [15, 23, 42], fontSize: 8.5 },
    },
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Service", "Included work", "Price"]],
    body: costTableRows,
    theme: "grid",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: 95 },
      2: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
    margin: { left: leftX, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Section 3: Payment Schedule
  if (currentY > 235) {
    doc.addPage();
    currentY = 16;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("3. Payment Schedule", leftX, currentY);
  currentY += 2;

  const scheduleRows = data.paymentMilestones.map((m) => [
    m.milestone,
    `${m.percentage}%`,
    formatCurrency(m.amount),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Milestone", "Percentage", "Amount"]],
    body: scheduleRows,
    theme: "grid",
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: "center", fontStyle: "bold" },
      2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
    },
    margin: { left: leftX, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const note = data.paymentScheduleNote || "Work begins after booking payment and receipt of required content/access. Final deployment and handover follow clearance of the final milestone.";
  doc.text(doc.splitTextToSize(note, pageWidth - 28), leftX, currentY);
  currentY += 6;

  // Sections 4 to 7
  const remainingSections = [
    { title: "4. Hosting, Server & Database Conditions", bullets: data.hostingConditions },
    { title: "5. Revisions & Support", bullets: data.revisionsSupport },
    { title: "6. Client Responsibilities", bullets: data.clientResponsibilities },
    { title: "7. Acceptance & Validity", bullets: data.acceptanceValidity },
  ];

  remainingSections.forEach((sec) => {
    if (currentY > 250) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(sec.title, leftX, currentY);
    currentY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);

    sec.bullets.forEach((b) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 16;
      }
      const split = doc.splitTextToSize(`• ${b}`, pageWidth - 28);
      doc.text(split, leftX + 2, currentY);
      currentY += split.length * 3.5;
    });

    currentY += 3.5;
  });

  // Approvals & Signatures block
  if (currentY > 240) {
    doc.addPage();
    currentY = 16;
  }

  currentY += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Approval & Acceptance", leftX, currentY);

  currentY += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Client acceptance: __________________________________________     Date: __________________", leftX, currentY);

  currentY += 7;
  doc.text("For ABECSA Software Solutions: __________________________________________", leftX, currentY);

  currentY += 7;
  doc.text("Authorized signature / stamp: __________________________________________", leftX, currentY);

  return doc;
}

export function downloadQuotationPdf(data: OfficialQuotationData, filename?: string): void {
  const doc = generateOfficialQuotationPdf(data);
  const safeNumber = (data.quotationNumber || "QTN").replace(/[\/\\:*?"<>|]/g, "_");
  doc.save(filename || `Quotation_${safeNumber}.pdf`);
}
