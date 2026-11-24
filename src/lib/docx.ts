import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
} from "docx";
import { formatCurrency } from "@/lib/utils";
import { numberToWordsRupees } from "@/lib/numberToWords";

export interface OfficialQuotationData {
  quotationNumber: string;
  date: string;
  clientName: string;
  projectName: string;
  contactEmail: string;
  contactPhone?: string;
  title?: string;
  subtitle?: string;
  scopeBullets: string[];
  items: {
    service: string;
    includedWork: string;
    price: number;
  }[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  amountInWords?: string;
  paymentMilestones: {
    milestone: string;
    percentage: number;
    amount: number;
  }[];
  paymentScheduleNote?: string;
  hostingConditions: string[];
  revisionsSupport: string[];
  clientResponsibilities: string[];
  acceptanceValidity: string[];
}

export async function generateQuotationDocxDocument(data: OfficialQuotationData): Promise<Document> {
  const amountWords = data.amountInWords || numberToWordsRupees(data.totalAmount);

  // 1. Title & Subtitle paragraphs
  const title = (data.title || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION").toUpperCase();
  const subtitle = data.subtitle || "Complete Starter Package • UI/UX • Website • Server • 25 GB Database";

  const children: any[] = [];

  // Header Brand
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: "ABECSA SOFTWARE SOLUTIONS",
          bold: true,
          size: 32, // 16pt
          color: "0284C7", // Sky blue
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 26, // 13pt
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: subtitle,
          size: 20, // 10pt
          color: "475569",
          italics: true,
        }),
      ],
    })
  );

  // Meta Info Table (Quotation No, Date, Client Name, Project Name, Contact)
  const metaRows = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: "Quotation No.:", bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: data.quotationNumber, bold: true, size: 20, color: "0284C7" })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: "Date:", bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: data.date, size: 20 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: "Client Name:", bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: data.clientName || "__________________________________________", size: 20 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: "Project / Business:", bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: data.projectName || "__________________________________________", size: 20 })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: "Contact / Email:", bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
          children: [new Paragraph({ children: [new TextRun({ text: `${data.contactEmail}${data.contactPhone ? ` • ${data.contactPhone}` : ""}`, size: 20 })] })],
        }),
      ],
    }),
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaRows,
    }),
    new Paragraph({ spacing: { after: 200 } })
  );

  // Section 1: Project Scope
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: "1. Project Scope", bold: true, size: 22, color: "0F172A" })],
    })
  );

  data.scopeBullets.forEach((bullet) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: bullet, size: 20, color: "334155" })],
      })
    );
  });

  // Section 2: Itemized Cost
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: "2. Itemized Cost", bold: true, size: 22, color: "0F172A" })],
    })
  );

  // Cost Table
  const costHeaderRow = new TableRow({
    children: [
      new TableCell({
        width: { size: 35, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "Service", bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "Included Work", bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Price", bold: true, size: 20 })] })],
      }),
    ],
  });

  const costDataRows = data.items.map((item) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: item.service, bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 45, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: item.includedWork, size: 19, color: "475569" })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(item.price), bold: true, size: 20 })] })],
        }),
      ],
    });
  });

  // Discount Row if any
  if (data.discount > 0) {
    costDataRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            columnSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text: "Special Applied Discount", bold: true, size: 20, color: "059669" })] })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `-${formatCurrency(data.discount)}`, bold: true, size: 20, color: "059669" })] })],
          }),
        ],
      })
    );
  }

  // Tax Row if any
  if (data.taxAmount > 0) {
    costDataRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 80, type: WidthType.PERCENTAGE },
            columnSpan: 2,
            children: [new Paragraph({ children: [new TextRun({ text: "GST Applicable (18%)", bold: true, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 20, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.taxAmount), bold: true, size: 20 })] })],
          }),
        ],
      })
    );
  }

  // Total Row
  costDataRows.push(
    new TableRow({
      children: [
        new TableCell({
          width: { size: 80, type: WidthType.PERCENTAGE },
          columnSpan: 2,
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: "Total Package Price", bold: true, size: 22 })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(data.totalAmount), bold: true, size: 22, color: "0284C7" })] })],
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnSpan: 3,
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Amount in Words: ", bold: true, size: 20 }),
                new TextRun({ text: amountWords, italics: true, size: 20, color: "0F172A" }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [costHeaderRow, ...costDataRows],
    }),
    new Paragraph({ spacing: { after: 150 } })
  );

  // Section 3: Payment Schedule
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: "3. Payment Schedule", bold: true, size: 22, color: "0F172A" })],
    })
  );

  const scheduleHeader = new TableRow({
    children: [
      new TableCell({
        width: { size: 50, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "Milestone", bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Percentage", bold: true, size: 20 })] })],
      }),
      new TableCell({
        width: { size: 25, type: WidthType.PERCENTAGE },
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Amount", bold: true, size: 20 })] })],
      }),
    ],
  });

  const scheduleRows = data.paymentMilestones.map((m) => {
    return new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: m.milestone, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${m.percentage}%`, bold: true, size: 20 })] })],
        }),
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: formatCurrency(m.amount), bold: true, size: 20 })] })],
        }),
      ],
    });
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [scheduleHeader, ...scheduleRows],
    }),
    new Paragraph({
      spacing: { before: 80, after: 150 },
      children: [
        new TextRun({
          text: data.paymentScheduleNote || "Work begins after booking payment and receipt of required content/access. Final deployment and handover follow clearance of the final milestone.",
          italics: true,
          size: 19,
          color: "64748B",
        }),
      ],
    })
  );

  // Section 4: Hosting, Server & Database Conditions
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: "4. Hosting, Server & Database Conditions", bold: true, size: 22, color: "0F172A" })],
    })
  );
  data.hostingConditions.forEach((bullet) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: bullet, size: 19, color: "334155" })],
      })
    );
  });

  // Section 5: Revisions & Support
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 100 },
      children: [new TextRun({ text: "5. Revisions & Support", bold: true, size: 22, color: "0F172A" })],
    })
  );
  data.revisionsSupport.forEach((bullet) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: bullet, size: 19, color: "334155" })],
      })
    );
  });

  // Section 6: Client Responsibilities
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 100 },
      children: [new TextRun({ text: "6. Client Responsibilities", bold: true, size: 22, color: "0F172A" })],
    })
  );
  data.clientResponsibilities.forEach((bullet) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: bullet, size: 19, color: "334155" })],
      })
    );
  });

  // Section 7: Acceptance & Validity
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 100 },
      children: [new TextRun({ text: "7. Acceptance & Validity", bold: true, size: 22, color: "0F172A" })],
    })
  );
  data.acceptanceValidity.forEach((bullet) => {
    children.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: bullet, size: 19, color: "334155" })],
      })
    );
  });

  // Signatures / Approval
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 100 },
      children: [new TextRun({ text: "Approval & Signatures", bold: true, size: 22, color: "0F172A" })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: "Client acceptance: __________________________________________   Date: __________________", size: 20 })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: "For ABECSA Software Solutions: __________________________________________", size: 20 })],
    }),
    new Paragraph({
      spacing: { after: 100 },
      children: [new TextRun({ text: "Authorized signature / stamp: __________________________________________", size: 20 })],
    })
  );

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

/**
 * Client-side helper to download the quotation as a .docx file
 */
export async function downloadQuotationDocx(data: OfficialQuotationData, filename?: string): Promise<void> {
  const doc = await generateQuotationDocxDocument(data);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeNumber = (data.quotationNumber || "QTN").replace(/[\/\\:*?"<>|]/g, "_");
  a.download = filename || `Quotation_${safeNumber}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
