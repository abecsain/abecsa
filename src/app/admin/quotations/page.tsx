"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Receipt,
  X,
  Edit2,
  ShieldCheck,
  UserCheck,
  Building2,
  Sparkles,
  Layers,
  ExternalLink,
  PenTool,
  FileText,
  Share2,
  MessageSquare,
  HardDrive,
  Calendar,
  Percent,
  Check,
  RefreshCw,
  Eye,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateQuotationPdf } from "@/lib/pdf";
import { downloadQuotationDocx, OfficialQuotationData } from "@/lib/docx";
import { downloadQuotationPdf, generateOfficialQuotationPdf } from "@/lib/quotationPdfGenerator";
import { numberToWordsRupees } from "@/lib/numberToWords";

interface QuotationItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  title: string;
  currency: string;
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentTerms: string | null;
  validUntil: string | null;
  status: string;
  clientResponse: string | null;
  notes: string | null;
  termsConditions: string | null;
  createdAt: string;
  customer: {
    id: string;
    companyName: string;
    address: string | null;
    user: { name: string; email: string; phone: string | null };
  };
  project: { id: string; projectId: string; name: string; manager?: { name: string } } | null;
  items: QuotationItem[];
  metadata?: {
    agreementTitle?: string;
    assignedManagerId?: string;
    assignedManagerName?: string;
    eSignature?: string;
    signedByName?: string;
    signedAt?: string;
    signedDesignation?: string;
    signedByDesignation?: string;
    signedIp?: string;
    verificationHash?: string;
  };
}

interface SoftwareQuotationRequest {
  id: string;
  requestNumber: string;
  customerName: string;
  businessName: string | null;
  email: string;
  phone: string;
  city: string | null;
  businessType: string | null;
  preferredContact: string;
  selectedProducts: string;
  selectedDatabaseTier: string | null;
  websiteRequirements: string | null;
  oneTimeTotal: number;
  recurringTotal: number;
  recurringInterval: string;
  discountTotal: number;
  taxAmount: number;
  grandTotal: number;
  status: string;
  createdAt: string;
}

interface OfficialBuilderItem {
  service: string;
  includedWork: string;
  price: number;
}

const DEFAULT_SCOPE_BULLETS = [
  "Custom UI/UX design tailored specifically for business branding and customer trust.",
  "Responsive multi-page website/application with optimized cross-device viewport compatibility.",
  "Integration of client-provided content, logos, product photos, and digital catalogs.",
  "Basic SEO setup, metadata tags, and mobile-friendly speed optimization.",
  "User authentication, role-based controls, and secure session management.",
  "Cloud server deployment with automatic SSL certificate encryption and 99.9% uptime SLA.",
  "Dedicated High-Speed Database allocation with optimized transactional queries.",
  "Basic end-to-end testing, quality assurance verification, deployment, and handover.",
];

const DEFAULT_HOSTING_CONDITIONS = [
  "Hosting server and database operations are provided under standard infrastructure tiers configured for optimal uptime and performance.",
  "Client agrees to operate within allocated disk, bandwidth, and database capacities. Storage expansion is available upon request at standard add-on rates.",
  "Third-party external subscriptions (e.g., custom domain name registration, third-party SMS/WhatsApp gateway credits, paid external API licenses) remain the direct billing responsibility of the client unless explicitly bundled.",
];

const DEFAULT_REVISIONS_SUPPORT = [
  "Includes up to two (2) consolidated rounds of feedback and minor revisions during the UI/UX and feature staging phases.",
  "Comprehensive seven (7) calendar days of post-handover technical support is provided to address bugs, operational questions, or configuration adjustments at no additional charge.",
];

const DEFAULT_CLIENT_RESPONSIBILITIES = [
  "Client agrees to furnish necessary branding assets, product listings, textual content, credentials, and approvals in a prompt manner to maintain development schedules.",
  "Timely review and milestone feedback are required to ensure target launch schedules are met.",
];

const DEFAULT_ACCEPTANCE_VALIDITY = [
  "This quotation is valid for fifteen (15) calendar days from the date of issue.",
  "To proceed, please authorize this proposal via formal signature, email confirmation, or purchase order.",
];

const PRESET_ADDONS = [
  {
    service: "Retail POS & GST Counter Billing",
    includedWork: "Ultra-fast thermal receipt billing, barcode scanning, UPI QR, and instant WhatsApp invoice delivery",
    price: 4999,
  },
  {
    service: "Smart Inventory & Stock Control",
    includedWork: "Complete stock management, low-stock WhatsApp alerts, barcode generator, vendor purchase orders, and expiry tracking",
    price: 4999,
  },
  {
    service: "Digital Product Catalog & Showcasing",
    includedWork: "Showcase entire product catalog online with photos, prices, discounts, and 1-tap WhatsApp order placement",
    price: 3999,
  },
  {
    service: "Udhar Khata & Accounting Ledger",
    includedWork: "Digital customer Udhar credit passbook with balance limits, supplier balances, daily expense logs, and WhatsApp payment reminders",
    price: 3499,
  },
  {
    service: "Cloud NVMe Database 1 GB",
    includedWork: "High-speed encrypted cloud database for small business catalogs (1 Year)",
    price: 399,
  },
  {
    service: "Cloud NVMe Database 2 GB",
    includedWork: "High-speed encrypted cloud database with automated daily backups (1 Year)",
    price: 799,
  },
  {
    service: "Cloud NVMe Database 5 GB",
    includedWork: "High-speed NVMe database holding 700+ SKUs, images, 50 daily bills, and 1000 client records (1 Year)",
    price: 1699,
  },
  {
    service: "Cloud NVMe Database 10 GB",
    includedWork: "Enterprise NVMe database with automated replication & query acceleration (1 Year)",
    price: 3199,
  },
  {
    service: "Cloud NVMe Database 15 GB",
    includedWork: "Heavy-traffic NVMe database for multi-counter POS & deep catalogs (1 Year)",
    price: 4499,
  },
  {
    service: "Cloud NVMe Database 25 GB",
    includedWork: "Ultra-scale 25 GB cloud NVMe cluster with multi-year audit logs (1 Year)",
    price: 6999,
  },
];

export default function AdminQuotationsPage() {
  const [activeTab, setActiveTab] = useState<"QUOTATIONS" | "REQUESTS">("QUOTATIONS");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [serviceRequests, setServiceRequests] = useState<SoftwareQuotationRequest[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOfficialBuilderModal, setShowOfficialBuilderModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningQuotation, setAssigningQuotation] = useState<Quotation | null>(null);
  const [selectedNewManagerId, setSelectedNewManagerId] = useState("");
  const [selectedNewCustomerId, setSelectedNewCustomerId] = useState("");

  // Official Builder Form State
  const [officialForm, setOfficialForm] = useState({
    quotationNumber: "",
    date: "",
    clientName: "",
    projectName: "",
    contactEmail: "",
    contactPhone: "",
    title: "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
    subtitle: "Complete Starter Package • UI/UX • Website • Server • 15 GB Database",
    scopeBullets: [...DEFAULT_SCOPE_BULLETS],
    items: [
      {
        service: "Retail POS & GST Counter Billing",
        includedWork: "Ultra-fast thermal receipt billing, barcode scanning, UPI QR, and instant WhatsApp invoice delivery",
        price: 4999,
      },
      {
        service: "Smart Inventory & Stock Control",
        includedWork: "Complete stock management, low-stock WhatsApp alerts, barcode generator, vendor purchase orders, and expiry tracking",
        price: 4999,
      },
      {
        service: "Digital Product Catalog & Showcasing",
        includedWork: "Showcase entire product catalog online with photos, prices, discounts, and 1-tap WhatsApp order placement",
        price: 3999,
      },
      {
        service: "Cloud NVMe Database (15 GB / 1 Year)",
        includedWork: "Dedicated high-performance PostgreSQL NVMe cloud database with daily automated backups",
        price: 4499,
      },
    ] as OfficialBuilderItem[],
    discount: 3498,
    taxRate: 0, // Toggle between 0 and 18
    newCustomItem: { service: "", includedWork: "", price: 0 },
    newScopeItem: "",
    paymentScheduleNote:
      "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
    hostingConditions: [...DEFAULT_HOSTING_CONDITIONS],
    revisionsSupport: [...DEFAULT_REVISIONS_SUPPORT],
    clientResponsibilities: [...DEFAULT_CLIENT_RESPONSIBILITIES],
    acceptanceValidity: [...DEFAULT_ACCEPTANCE_VALIDITY],
    linkedRequestId: "" as string | undefined,
    linkedQuotationId: "" as string | undefined,
  });

  // Proposal Form State (Legacy Agreement Modal)
  const [createStep, setCreateStep] = useState<"DETAILS" | "ITEMS" | "AGREEMENT">("DETAILS");
  const [isNewClient, setIsNewClient] = useState(false);
  const [isNewProject, setIsNewProject] = useState(false);

  const [formData, setFormData] = useState({
    customerId: "",
    newClient: {
      name: "",
      companyName: "",
      email: "",
      phone: "",
      gstNumber: "",
      address: "",
      businessType: "Corporate Enterprise",
    },
    projectId: "",
    newProject: {
      name: "",
      serviceCategory: "Custom Web Application",
      techStack: "Next.js 16, React 19, TypeScript, PostgreSQL",
      budget: 500000,
      deliveryDate: "",
      description: "",
    },
    managerId: "",
    title: "",
    agreementTitle: "Master Software Services & Cloud Engineering Agreement",
    discount: 0,
    taxRate: 18,
    paymentTerms: "30% Advance Mobilization, 40% Milestone 2 Delivery, 30% Final Sign-off",
    validUntil: "",
    notes: "Includes 12 months comprehensive warranty, cloud deployment, and 99.9% uptime SLA.",
    termsConditions: getDefaultAgreementTerms(),
    items: [
      { description: "Phase 1: Architecture, UI/UX System & Database Modeling", quantity: 1, unitPrice: 250000 },
      { description: "Phase 2: Core Platform Development & API Integrations", quantity: 1, unitPrice: 350000 },
    ],
  });

  const [submitting, setSubmitting] = useState(false);
  const [savingOfficial, setSavingOfficial] = useState(false);

  useEffect(() => {
    fetchData();
    fetchServiceRequests();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/quotations");
      const data = await res.json();
      if (data.quotations) setQuotations(data.quotations);
      if (data.customers) setCustomers(data.customers);
      if (data.managers) setManagers(data.managers);
      if (data.projects) setProjects(data.projects);

      if (data.managers?.length > 0 && !formData.managerId) {
        setFormData((prev) => ({ ...prev, managerId: data.managers[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/solutions/quotations");
      const data = await res.json();
      if (data.requests) setServiceRequests(data.requests);
    } catch (e) {
      console.error("Failed to load service requests:", e);
    } finally {
      setLoadingRequests(false);
    }
  };

  const getTodayFormattedDate = () => {
    return new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const generateDynamicQuotationNumber = () => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const seq = String(Math.floor(10 + Math.random() * 90));
    return `ABECSA/WEB/DB/${yr}/${mo}${day}-${seq}`;
  };

  // Open Blank Official Builder
  const handleOpenNewOfficialBuilder = () => {
    setOfficialForm({
      quotationNumber: generateDynamicQuotationNumber(),
      date: getTodayFormattedDate(),
      clientName: "",
      projectName: "Business Website & POS Billing ERP",
      contactEmail: "",
      contactPhone: "",
      title: "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: "Complete Starter Package • UI/UX • Website • Server • 15 GB Database",
      scopeBullets: [...DEFAULT_SCOPE_BULLETS],
      items: [
        {
          service: "Retail POS & GST Counter Billing",
          includedWork: "Ultra-fast thermal receipt billing, barcode scanning, UPI QR, and instant WhatsApp invoice delivery",
          price: 4999,
        },
        {
          service: "Smart Inventory & Stock Control",
          includedWork: "Complete stock management, low-stock WhatsApp alerts, barcode generator, vendor purchase orders, and expiry tracking",
          price: 4999,
        },
        {
          service: "Digital Product Catalog & Showcasing",
          includedWork: "Showcase entire product catalog online with photos, prices, discounts, and 1-tap WhatsApp order placement",
          price: 3999,
        },
        {
          service: "Cloud NVMe Database (15 GB / 1 Year)",
          includedWork: "Dedicated high-performance PostgreSQL NVMe cloud database with daily automated backups",
          price: 4499,
        },
      ],
      discount: 3498,
      taxRate: 0,
      newCustomItem: { service: "", includedWork: "", price: 0 },
      newScopeItem: "",
      paymentScheduleNote:
        "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
      hostingConditions: [...DEFAULT_HOSTING_CONDITIONS],
      revisionsSupport: [...DEFAULT_REVISIONS_SUPPORT],
      clientResponsibilities: [...DEFAULT_CLIENT_RESPONSIBILITIES],
      acceptanceValidity: [...DEFAULT_ACCEPTANCE_VALIDITY],
      linkedRequestId: undefined,
      linkedQuotationId: undefined,
    });
    setShowOfficialBuilderModal(true);
  };

  // Convert Service Request to Official Quotation
  const handleConvertRequestToOfficial = (req: SoftwareQuotationRequest) => {
    let parsedProducts: any[] = [];
    try {
      parsedProducts = typeof req.selectedProducts === "string" ? JSON.parse(req.selectedProducts) : req.selectedProducts;
    } catch {
      parsedProducts = [];
    }

    const items: OfficialBuilderItem[] = [];

    // Map selected software products
    if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
      parsedProducts.forEach((p) => {
        if (typeof p === "string") {
          const match = PRESET_ADDONS.find((addon) => addon.service.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(addon.service.toLowerCase()));
          if (match) {
            items.push({ ...match });
          } else {
            items.push({
              service: p,
              includedWork: "Core software module implementation & testing",
              price: 4999,
            });
          }
        } else if (typeof p === "object" && p !== null) {
          items.push({
            service: p.name || p.title || p.id || "Custom Software Module",
            includedWork: p.description || p.includedWork || "Module design, deployment & testing",
            price: Number(p.price || p.basePrice || 4999),
          });
        }
      });
    }

    // Map Database Tier
    if (req.selectedDatabaseTier) {
      const dbTier = req.selectedDatabaseTier.toUpperCase();
      const matchDb = PRESET_ADDONS.find((addon) => addon.service.toUpperCase().includes(dbTier));
      if (matchDb) {
        items.push({ ...matchDb });
      } else {
        items.push({
          service: `Cloud NVMe Database (${req.selectedDatabaseTier} / 1 Year)`,
          includedWork: "Dedicated high-performance cloud database with automated backups",
          price: 4499,
        });
      }
    }

    // If empty fallback items
    if (items.length === 0) {
      items.push(
        {
          service: "Retail POS & GST Counter Billing",
          includedWork: "Ultra-fast thermal receipt billing, barcode scanning, UPI QR, and instant WhatsApp invoice delivery",
          price: 4999,
        },
        {
          service: "Smart Inventory & Stock Control",
          includedWork: "Complete stock management, low-stock WhatsApp alerts, barcode generator, vendor purchase orders, and expiry tracking",
          price: 4999,
        },
        {
          service: "Digital Product Catalog & Showcasing",
          includedWork: "Showcase entire product catalog online with photos, prices, discounts, and 1-tap WhatsApp order placement",
          price: 3999,
        },
        {
          service: "Cloud NVMe Database (15 GB / 1 Year)",
          includedWork: "High-speed encrypted PostgreSQL database",
          price: 4499,
        }
      );
    }

    // Set official form state
    setOfficialForm({
      quotationNumber: generateDynamicQuotationNumber(),
      date: getTodayFormattedDate(),
      clientName: req.customerName,
      projectName: req.businessName ? `${req.businessName} - Software & Cloud System` : `${req.customerName}'s Business Software`,
      contactEmail: req.email,
      contactPhone: req.phone,
      title: "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: `Complete Starter Package • UI/UX • Website • Server • ${req.selectedDatabaseTier || "15 GB"} Database`,
      scopeBullets: [...DEFAULT_SCOPE_BULLETS],
      items,
      discount: req.discountTotal || 0,
      taxRate: req.taxAmount > 0 ? 18 : 0,
      newCustomItem: { service: "", includedWork: "", price: 0 },
      newScopeItem: "",
      paymentScheduleNote:
        "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
      hostingConditions: [...DEFAULT_HOSTING_CONDITIONS],
      revisionsSupport: [...DEFAULT_REVISIONS_SUPPORT],
      clientResponsibilities: [...DEFAULT_CLIENT_RESPONSIBILITIES],
      acceptanceValidity: [...DEFAULT_ACCEPTANCE_VALIDITY],
      linkedRequestId: req.id,
      linkedQuotationId: undefined,
    });

    setShowOfficialBuilderModal(true);
  };

  // Open existing quotation in builder
  const handleEditQuotationInBuilder = (q: Quotation) => {
    const items: OfficialBuilderItem[] =
      q.items && q.items.length > 0
        ? q.items.map((it) => ({
            service: it.description,
            includedWork: it.description,
            price: it.amount || it.unitPrice * (it.quantity || 1),
          }))
        : [
            {
              service: q.title,
              includedWork: "Complete software design, server setup, database engineering, and QA handover",
              price: q.subtotal,
            },
          ];

    setOfficialForm({
      quotationNumber: q.quotationNumber,
      date: formatDate(q.createdAt),
      clientName: q.customer.companyName || q.customer.user.name,
      projectName: q.title,
      contactEmail: q.customer.user.email,
      contactPhone: q.customer.user.phone || "",
      title: q.title || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: "Complete Starter Package • UI/UX • Website • Server • Database",
      scopeBullets: [...DEFAULT_SCOPE_BULLETS],
      items,
      discount: q.discount || 0,
      taxRate: q.taxRate || 0,
      newCustomItem: { service: "", includedWork: "", price: 0 },
      newScopeItem: "",
      paymentScheduleNote:
        q.paymentTerms ||
        "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
      hostingConditions: [...DEFAULT_HOSTING_CONDITIONS],
      revisionsSupport: [...DEFAULT_REVISIONS_SUPPORT],
      clientResponsibilities: [...DEFAULT_CLIENT_RESPONSIBILITIES],
      acceptanceValidity: [...DEFAULT_ACCEPTANCE_VALIDITY],
      linkedRequestId: undefined,
      linkedQuotationId: q.id,
    });

    setShowOfficialBuilderModal(true);
  };

  // Calculations for Official Builder
  const computeOfficialSubtotal = () => officialForm.items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const computeOfficialDiscount = () => Math.max(0, Number(officialForm.discount) || 0);
  const computeOfficialTaxable = () => Math.max(0, computeOfficialSubtotal() - computeOfficialDiscount());
  const computeOfficialTax = () => (officialForm.taxRate > 0 ? Math.round((computeOfficialTaxable() * 18) / 100) : 0);
  const computeOfficialGrandTotal = () => computeOfficialTaxable() + computeOfficialTax();
  const computeOfficialAmountWords = () => numberToWordsRupees(computeOfficialGrandTotal());

  // Payment Milestones
  const getMilestones = () => {
    const total = computeOfficialGrandTotal();
    const m1 = Math.round(total * 0.4);
    const m2 = Math.round(total * 0.4);
    const m3 = Math.max(0, total - m1 - m2);
    return [
      { milestone: "Kickoff & Project Initiation", percentage: 40, amount: m1 },
      { milestone: "UI/UX Approval & Core Feature Demo", percentage: 40, amount: m2 },
      { milestone: "Final Deployment, Handover & Launch", percentage: 20, amount: m3 },
    ];
  };

  // Build Payload for DOCX and PDF
  const buildOfficialPayload = (): OfficialQuotationData => {
    const subtotal = computeOfficialSubtotal();
    const discount = computeOfficialDiscount();
    const taxAmount = computeOfficialTax();
    const totalAmount = computeOfficialGrandTotal();
    const amountInWords = computeOfficialAmountWords();
    const paymentMilestones = getMilestones();

    return {
      quotationNumber: officialForm.quotationNumber.trim() || generateDynamicQuotationNumber(),
      date: officialForm.date.trim() || getTodayFormattedDate(),
      clientName: officialForm.clientName.trim() || "Client Organization",
      projectName: officialForm.projectName.trim() || "Business Website & Database System",
      contactEmail: officialForm.contactEmail.trim() || "Abecsa.in@gmail.com",
      contactPhone: officialForm.contactPhone.trim() || "+91 94078 99216",
      title: officialForm.title.trim() || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: officialForm.subtitle.trim() || "Complete Starter Package • UI/UX • Website • Server • Database",
      scopeBullets: officialForm.scopeBullets,
      items: officialForm.items,
      subtotal,
      discount,
      taxAmount,
      totalAmount,
      amountInWords,
      paymentMilestones,
      paymentScheduleNote: officialForm.paymentScheduleNote,
      hostingConditions: officialForm.hostingConditions,
      revisionsSupport: officialForm.revisionsSupport,
      clientResponsibilities: officialForm.clientResponsibilities,
      acceptanceValidity: officialForm.acceptanceValidity,
    };
  };

  // Download Word .docx
  const handleDownloadDocx = async () => {
    const payload = buildOfficialPayload();
    const safeNum = payload.quotationNumber.replace(/[\/\\:*?"<>|]/g, "_");
    await downloadQuotationDocx(payload, `${safeNum}_Quotation_ABECSA.docx`);
  };

  // Download Official PDF
  const handleDownloadOfficialPdf = () => {
    const payload = buildOfficialPayload();
    const safeNum = payload.quotationNumber.replace(/[\/\\:*?"<>|]/g, "_");
    downloadQuotationPdf(payload, `${safeNum}_Quotation_ABECSA.pdf`);
  };

  // Download existing quotation as Word
  const handleDownloadExistingDocx = async (q: Quotation) => {
    const items =
      q.items && q.items.length > 0
        ? q.items.map((it) => ({
            service: it.description,
            includedWork: it.description,
            price: it.amount || it.unitPrice * (it.quantity || 1),
          }))
        : [{ service: q.title, includedWork: "Complete system implementation", price: q.subtotal }];

    const payload: OfficialQuotationData = {
      quotationNumber: q.quotationNumber,
      date: formatDate(q.createdAt),
      clientName: q.customer.companyName || q.customer.user.name,
      projectName: q.title,
      contactEmail: q.customer.user.email,
      contactPhone: q.customer.user.phone || undefined,
      title: q.title || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: "Complete Starter Package • UI/UX • Website • Server • Database",
      scopeBullets: DEFAULT_SCOPE_BULLETS,
      items,
      subtotal: q.subtotal,
      discount: q.discount || 0,
      taxAmount: q.taxAmount || 0,
      totalAmount: q.totalAmount,
      amountInWords: numberToWordsRupees(q.totalAmount),
      paymentMilestones: [
        { milestone: "Kickoff & Project Initiation", percentage: 40, amount: Math.round(q.totalAmount * 0.4) },
        { milestone: "UI/UX Approval & Core Feature Demo", percentage: 40, amount: Math.round(q.totalAmount * 0.4) },
        { milestone: "Final Deployment, Handover & Launch", percentage: 20, amount: Math.round(q.totalAmount * 0.2) },
      ],
      paymentScheduleNote:
        q.paymentTerms ||
        "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
      hostingConditions: DEFAULT_HOSTING_CONDITIONS,
      revisionsSupport: DEFAULT_REVISIONS_SUPPORT,
      clientResponsibilities: DEFAULT_CLIENT_RESPONSIBILITIES,
      acceptanceValidity: DEFAULT_ACCEPTANCE_VALIDITY,
    };

    const safeNum = q.quotationNumber.replace(/[\/\\:*?"<>|]/g, "_");
    await downloadQuotationDocx(payload, `${safeNum}_Quotation_ABECSA.docx`);
  };

  // Download existing quotation as Official PDF
  const handleDownloadExistingPdf = (q: Quotation) => {
    const items =
      q.items && q.items.length > 0
        ? q.items.map((it) => ({
            service: it.description,
            includedWork: it.description,
            price: it.amount || it.unitPrice * (it.quantity || 1),
          }))
        : [{ service: q.title, includedWork: "Complete system implementation", price: q.subtotal }];

    const payload: OfficialQuotationData = {
      quotationNumber: q.quotationNumber,
      date: formatDate(q.createdAt),
      clientName: q.customer.companyName || q.customer.user.name,
      projectName: q.title,
      contactEmail: q.customer.user.email,
      contactPhone: q.customer.user.phone || undefined,
      title: q.title || "WEBSITE, SERVER & DATABASE DEVELOPMENT QUOTATION",
      subtitle: "Complete Starter Package • UI/UX • Website • Server • Database",
      scopeBullets: DEFAULT_SCOPE_BULLETS,
      items,
      subtotal: q.subtotal,
      discount: q.discount || 0,
      taxAmount: q.taxAmount || 0,
      totalAmount: q.totalAmount,
      amountInWords: numberToWordsRupees(q.totalAmount),
      paymentMilestones: [
        { milestone: "Kickoff & Project Initiation", percentage: 40, amount: Math.round(q.totalAmount * 0.4) },
        { milestone: "UI/UX Approval & Core Feature Demo", percentage: 40, amount: Math.round(q.totalAmount * 0.4) },
        { milestone: "Final Deployment, Handover & Launch", percentage: 20, amount: Math.round(q.totalAmount * 0.2) },
      ],
      paymentScheduleNote:
        q.paymentTerms ||
        "Development commences upon receipt of the initial 40% advance payment. Milestone payments must be cleared before progression to subsequent project phases.",
      hostingConditions: DEFAULT_HOSTING_CONDITIONS,
      revisionsSupport: DEFAULT_REVISIONS_SUPPORT,
      clientResponsibilities: DEFAULT_CLIENT_RESPONSIBILITIES,
      acceptanceValidity: DEFAULT_ACCEPTANCE_VALIDITY,
    };

    const safeNum = q.quotationNumber.replace(/[\/\\:*?"<>|]/g, "_");
    downloadQuotationPdf(payload, `${safeNum}_Quotation_ABECSA.pdf`);
  };

  // Save Official Quotation to Database
  const handleSaveOfficialQuotation = async () => {
    if (!officialForm.clientName.trim()) {
      alert("Please enter the Client Name.");
      return;
    }
    if (officialForm.items.length === 0) {
      alert("Please add at least one itemized service.");
      return;
    }

    setSavingOfficial(true);
    try {
      const items = officialForm.items.map((it) => ({
        description: `${it.service}: ${it.includedWork}`,
        quantity: 1,
        unitPrice: Number(it.price) || 0,
        amount: Number(it.price) || 0,
      }));

      const payload: any = {
        quotationNumber: officialForm.quotationNumber.trim() || undefined,
        title: officialForm.projectName.trim() || officialForm.title.trim(),
        agreementTitle: officialForm.title.trim(),
        discount: computeOfficialDiscount(),
        taxRate: officialForm.taxRate,
        paymentTerms: officialForm.paymentScheduleNote,
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        notes: `Official Quotation generated on ${officialForm.date}. Includes comprehensive cloud architecture and database hosting.`,
        termsConditions: getDefaultAgreementTerms(),
        items,
        status: "SENT",
        newClient: {
          name: officialForm.clientName.trim(),
          companyName: officialForm.clientName.trim(),
          email: officialForm.contactEmail.trim() || `client_${Date.now()}@abecsa.client`,
          phone: officialForm.contactPhone.trim() || "+91 94078 99216",
        },
      };

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // If linked to a service request, mark request as QUOTATION_SENT
        if (officialForm.linkedRequestId) {
          try {
            await fetch("/api/solutions/quotations", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: officialForm.linkedRequestId,
                status: "QUOTATION_SENT",
              }),
            });
            fetchServiceRequests();
          } catch {}
        }

        setShowOfficialBuilderModal(false);
        fetchData();
        alert(
          `Official Quotation ${data.quotation?.quotationNumber || officialForm.quotationNumber} saved successfully!\nOnline Link: /quotations/${data.quotation?.id}`
        );
      } else {
        alert(data.error || "Failed to save quotation.");
      }
    } catch {
      alert("Network error while saving quotation.");
    } finally {
      setSavingOfficial(false);
    }
  };

  // WhatsApp Share Helper
  const handleShareWhatsApp = () => {
    const phone = (officialForm.contactPhone || "").replace(/\D/g, "");
    const totalFormatted = formatCurrency(computeOfficialGrandTotal());
    const message = encodeURIComponent(
      `Hello ${officialForm.clientName || "Sir/Madam"},\n\nThank you for choosing *ABECSA Software Solutions*.\nWe have prepared your official quotation: *${officialForm.quotationNumber}*.\n\n*Project:* ${officialForm.projectName}\n*Total Investment:* ${totalFormatted} (${computeOfficialAmountWords()})\n*Includes:* High-Speed Software, NVMe Database & Cloud Server Deployment.\n\nPlease review and let us know if you have any questions.\n\nBest regards,\n*ABECSA Software Solutions*\n+91 94078 99216 • Abecsa.in@gmail.com`
    );
    window.open(`https://wa.me/${phone ? (phone.startsWith("91") ? phone : "91" + phone) : ""}?text=${message}`, "_blank");
  };

  // Legacy Create Quotation Handler
  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("Please enter a Proposal Title.");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        title: formData.title,
        agreementTitle: formData.agreementTitle,
        managerId: formData.managerId || undefined,
        discount: Number(formData.discount),
        taxRate: Number(formData.taxRate),
        paymentTerms: formData.paymentTerms,
        validUntil: formData.validUntil || undefined,
        notes: formData.notes,
        termsConditions: formData.termsConditions,
        items: formData.items,
        status: "SENT",
      };

      if (isNewClient) {
        payload.newClient = formData.newClient;
      } else {
        payload.customerId = formData.customerId;
      }

      if (isNewProject) {
        payload.newProject = formData.newProject;
      } else if (formData.projectId) {
        payload.projectId = formData.projectId;
      }

      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        fetchData();
        alert(`Quotation ${data.quotation.quotationNumber} successfully created and presented!`);
      } else {
        alert(data.error || "Failed to create quotation.");
      }
    } catch {
      alert("Error creating quotation proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reassign Manager / Customer
  const handleReassign = async () => {
    if (!assigningQuotation) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: assigningQuotation.id,
          action: "ASSIGN",
          managerId: selectedNewManagerId || undefined,
          customerId: selectedNewCustomerId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAssignModal(false);
        fetchData();
        alert("Assignment updated successfully!");
      } else {
        alert(data.error || "Failed to update assignment.");
      }
    } catch {
      alert("Error updating assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Convert Quotation to Tax Invoice
  const handleConvertToInvoice = async (quotationId: string) => {
    if (!confirm("Generate a formal Tax Invoice from this quotation?")) return;
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotationId,
          convertToInvoice: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Quotation converted to Invoice!");
        fetchData();
      } else {
        alert(data.error || "Conversion failed.");
      }
    } catch {
      alert("Error converting to invoice.");
    }
  };

  // Convert Quotation to Active Project
  const handleConvertToProject = async (quotationId: string) => {
    if (!confirm("Activate this proposal as a live project with milestone tracking?")) return;
    try {
      const res = await fetch("/api/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: quotationId,
          convertToProject: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Project activated!");
        fetchData();
      } else {
        alert(data.error || "Conversion failed.");
      }
    } catch {
      alert("Error activating project.");
    }
  };

  // Delete Quotation
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/quotations?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Failed to delete quotation.");
      }
    } catch {
      alert("Network error.");
    }
  };

  // Filtered Quotations
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.quotationNumber.toLowerCase().includes(search.toLowerCase()) ||
      q.customer.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (q.metadata?.assignedManagerName || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "ALL") return matchesSearch;
    return matchesSearch && q.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold text-sky-600 uppercase tracking-wider bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
              COMMERCIAL OPERATING SYSTEM
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Quotations, Invoices & Commercial Agreements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Convert customer service inquiries into official proposals, customize line items, calculate dynamic discounts, and export in Word (.docx) & PDF.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleOpenNewOfficialBuilder}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>⚡ New Official Quotation (Word & PDF)</span>
          </button>

          <button
            onClick={() => {
              setCreateStep("DETAILS");
              setShowCreateModal(true);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Master Agreement Proposal</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("QUOTATIONS")}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "QUOTATIONS"
              ? "border-sky-600 text-sky-600 bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Official Quotations</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-extrabold">
            {quotations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("REQUESTS")}
          className={`px-5 py-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === "REQUESTS"
              ? "border-sky-600 text-sky-600 bg-sky-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Customer Service Requests (/services)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-700 font-extrabold">
            {serviceRequests.length}
          </span>
        </button>
      </div>

      {/* TAB 1: OFFICIAL QUOTATIONS */}
      {activeTab === "QUOTATIONS" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search quotation #, client, manager..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "SENT", "APPROVED", "CONVERTED_TO_INVOICE", "CONVERTED_TO_PROJECT", "DRAFT"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-sky-500 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Quotations List */}
          <div className="space-y-4">
            {filteredQuotations.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No Quotations Found</h3>
                <p className="text-xs text-slate-400 mt-1">Create your first official quotation or convert a service request.</p>
                <button
                  onClick={handleOpenNewOfficialBuilder}
                  className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs"
                >
                  ⚡ Launch Official Quotation Builder
                </button>
              </div>
            ) : (
              filteredQuotations.map((q) => {
                const meta = q.metadata || {};
                const isSigned = Boolean(meta.signedByName || meta.eSignature);
                const managerName = meta.assignedManagerName || q.project?.manager?.name || "Unassigned";

                return (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-sky-300 transition-all space-y-4"
                  >
                    {/* Row 1: Quotation Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-sky-600 px-2 py-0.5 rounded-md bg-sky-50 border border-sky-200">
                            {q.quotationNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              q.status === "APPROVED" || q.status === "CONVERTED_TO_INVOICE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {q.status}
                          </span>

                          {/* E-Signature Seal Badge */}
                          {isSigned ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>E-Signed by {meta.signedByName}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>Pending E-Sign</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{q.title}</h3>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400">Total Contract Value</p>
                        <p className="text-lg font-black text-sky-600">{formatCurrency(q.totalAmount)}</p>
                        <p className="text-[10px] text-slate-400">Date: {formatDate(q.createdAt)}</p>
                      </div>
                    </div>

                    {/* Row 2: Stakeholders */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Client Organization</p>
                        <p className="font-bold text-slate-900">{q.customer.companyName}</p>
                        <p className="text-slate-500 text-[11px]">
                          {q.customer.user.name} ({q.customer.user.email})
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100 space-y-1">
                        <p className="text-[10px] font-bold text-sky-700 uppercase">Delivery Manager</p>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                          <span>{managerName}</span>
                        </p>
                        <p className="text-slate-500 text-[11px]">Oversees sprint milestones & QA delivery</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Items & Deliverables</p>
                        <p className="font-bold text-slate-900 truncate">
                          {q.items?.length || 0} Line Items Defined
                        </p>
                        <p className="text-slate-500 text-[11px]">Subtotal: {formatCurrency(q.subtotal)}</p>
                      </div>
                    </div>

                    {/* Row 3: Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Download Word (.docx) */}
                        <button
                          onClick={() => handleDownloadExistingDocx(q)}
                          className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-xs font-bold text-blue-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Download Official Microsoft Word (.docx) Document"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          <span>Word (.docx)</span>
                        </button>

                        {/* Download Official PDF */}
                        <button
                          onClick={() => handleDownloadExistingPdf(q)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Download Official PDF Document"
                        >
                          <Download className="w-3.5 h-3.5 text-rose-500" />
                          <span>PDF</span>
                        </button>

                        {/* Edit in Official Builder */}
                        <button
                          onClick={() => handleEditQuotationInBuilder(q)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Edit in Official Reference Builder"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Edit Format</span>
                        </button>

                        {/* View on Website */}
                        <Link
                          href={`/quotations/${q.id}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-lg border border-sky-200 hover:bg-sky-50 text-xs font-semibold text-sky-700 flex items-center gap-1.5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Present on Web</span>
                        </Link>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Convert to Project */}
                        {q.status !== "CONVERTED_TO_PROJECT" && (
                          <button
                            onClick={() => handleConvertToProject(q.id)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Activate Project</span>
                          </button>
                        )}

                        {/* Convert to Invoice */}
                        {q.status !== "CONVERTED_TO_INVOICE" && (
                          <button
                            onClick={() => handleConvertToInvoice(q.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Generate Invoice</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Delete Quotation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER SERVICE REQUESTS */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Incoming Customer Service Quotation Requests</h3>
              <p className="text-xs text-slate-500">
                Customer-configured software solutions from the public /services portal. Click Convert to instantly generate the official Word and PDF proposal.
              </p>
            </div>
            <button
              onClick={fetchServiceRequests}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Requests</span>
            </button>
          </div>

          {loadingRequests ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading incoming service requests...</p>
            </div>
          ) : serviceRequests.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No Service Inquiries Yet</h3>
              <p className="text-xs text-slate-400 mt-1">Inquiries submitted via the /services configurator will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {serviceRequests.map((req) => {
                let parsedProducts: any[] = [];
                try {
                  parsedProducts = typeof req.selectedProducts === "string" ? JSON.parse(req.selectedProducts) : req.selectedProducts;
                } catch {
                  parsedProducts = [];
                }

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-amber-300 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-amber-700 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                            {req.requestNumber}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {req.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            Submitted: {formatDate(req.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1">
                          {req.customerName} {req.businessName ? `• ${req.businessName}` : ""}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {req.city ? `${req.city} • ` : ""}
                          {req.businessType || "Retail Business"}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-400">Estimated Total</p>
                        <p className="text-xl font-black text-emerald-600">{formatCurrency(req.grandTotal)}</p>
                        {req.discountTotal > 0 && (
                          <p className="text-[10px] text-emerald-700">Bundle Discount: -{formatCurrency(req.discountTotal)}</p>
                        )}
                      </div>
                    </div>

                    {/* Middle: Selected Modules and Database */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Selected Software Modules ({parsedProducts.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedProducts.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-md bg-white border border-slate-200 font-semibold text-slate-800 text-[11px]"
                            >
                              {typeof p === "string" ? p : p.name || p.title || "Module"}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 space-y-2">
                        <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">
                          Database Storage & Cloud Infra
                        </p>
                        <p className="font-bold text-slate-900 text-xs">
                          {req.selectedDatabaseTier ? `${req.selectedDatabaseTier} NVMe Database Storage` : "5 GB Cloud NVMe (Default)"}
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          Billing: {req.recurringInterval || "Annual"} • Recurring: {formatCurrency(req.recurringTotal)}/yr
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Contact & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span>📞 {req.phone}</span>
                        <span>✉️ {req.email}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${req.phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => handleConvertRequestToOfficial(req)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>⚡ Convert to Official Quotation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* OFFICIAL QUOTATION BUILDER MODAL (MATCHING REFERENCE DOC) */}
      {/* ======================================================== */}
      {showOfficialBuilderModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 text-xs flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 font-black text-sm">
                  AB
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider">
                    ABECSA OFFICIAL QUOTATION GENERATOR
                  </span>
                  <h3 className="text-base font-bold text-white">Website, Server & Database Proposal Builder</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Download editable Microsoft Word document (.docx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Word (.docx)</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadOfficialPdf}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  title="Download Official PDF (.pdf)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF (.pdf)</span>
                </button>
                <button
                  onClick={() => setShowOfficialBuilderModal(false)}
                  className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Metadata Grid (Quotation No, Date, Client, Project, Contact) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Document Metadata (Editable)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Quotation No. *</label>
                    <input
                      type="text"
                      value={officialForm.quotationNumber}
                      onChange={(e) => setOfficialForm({ ...officialForm, quotationNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-sky-700 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Date of Creation *</label>
                    <input
                      type="text"
                      value={officialForm.date}
                      onChange={(e) => setOfficialForm({ ...officialForm, date: e.target.value })}
                      placeholder="e.g. 25 November 2026"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Client Name *</label>
                    <input
                      type="text"
                      value={officialForm.clientName}
                      onChange={(e) => setOfficialForm({ ...officialForm, clientName: e.target.value })}
                      placeholder="e.g. Shree Ram Enterprises / Rajesh Patel"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Project / Business *</label>
                    <input
                      type="text"
                      value={officialForm.projectName}
                      onChange={(e) => setOfficialForm({ ...officialForm, projectName: e.target.value })}
                      placeholder="e.g. Retail POS Billing ERP & Digital Catalog"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Contact Email *</label>
                    <input
                      type="email"
                      value={officialForm.contactEmail}
                      onChange={(e) => setOfficialForm({ ...officialForm, contactEmail: e.target.value })}
                      placeholder="client@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Contact Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={officialForm.contactPhone}
                      onChange={(e) => setOfficialForm({ ...officialForm, contactPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Document Title</label>
                    <input
                      type="text"
                      value={officialForm.title}
                      onChange={(e) => setOfficialForm({ ...officialForm, title: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Subtitle / Feature Tagline</label>
                    <input
                      type="text"
                      value={officialForm.subtitle}
                      onChange={(e) => setOfficialForm({ ...officialForm, subtitle: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Section 1: Project Scope */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>1. Project Scope</span>
                    <span className="text-[10px] text-slate-400 font-normal">({officialForm.scopeBullets.length} scope points)</span>
                  </h4>
                </div>

                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  {officialForm.scopeBullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold mt-1.5 text-xs">•</span>
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => {
                          const updated = [...officialForm.scopeBullets];
                          updated[i] = e.target.value;
                          setOfficialForm({ ...officialForm, scopeBullets: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:ring-1 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = officialForm.scopeBullets.filter((_, idx) => idx !== i);
                          setOfficialForm({ ...officialForm, scopeBullets: updated });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Add another custom scope point..."
                      value={officialForm.newScopeItem}
                      onChange={(e) => setOfficialForm({ ...officialForm, newScopeItem: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && officialForm.newScopeItem.trim()) {
                          e.preventDefault();
                          setOfficialForm({
                            ...officialForm,
                            scopeBullets: [...officialForm.scopeBullets, officialForm.newScopeItem.trim()],
                            newScopeItem: "",
                          });
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (officialForm.newScopeItem.trim()) {
                          setOfficialForm({
                            ...officialForm,
                            scopeBullets: [...officialForm.scopeBullets, officialForm.newScopeItem.trim()],
                            newScopeItem: "",
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Itemized Cost Table */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>2. Itemized Cost & Custom Services</span>
                  </h4>

                  {/* Quick-add chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold">Quick Add:</span>
                    {PRESET_ADDONS.slice(0, 4).map((addon, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setOfficialForm({
                            ...officialForm,
                            items: [...officialForm.items, { ...addon }],
                          })
                        }
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-100 hover:text-sky-700 text-slate-700 text-[10px] font-semibold border border-slate-200 cursor-pointer transition-colors"
                      >
                        +{addon.service.split("&")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b">
                      <tr>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">Included Work Details</th>
                        <th className="py-2.5 px-3 text-right w-28">Price (₹)</th>
                        <th className="py-2.5 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {officialForm.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.service}
                              onChange={(e) => {
                                const updated = [...officialForm.items];
                                updated[idx].service = e.target.value;
                                setOfficialForm({ ...officialForm, items: updated });
                              }}
                              className="w-full px-2 py-1 rounded-md border border-slate-200 font-bold text-slate-900 text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.includedWork}
                              onChange={(e) => {
                                const updated = [...officialForm.items];
                                updated[idx].includedWork = e.target.value;
                                setOfficialForm({ ...officialForm, items: updated });
                              }}
                              className="w-full px-2 py-1 rounded-md border border-slate-200 text-slate-600 text-[11px]"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              placeholder="0"
                              value={it.price === 0 ? "" : it.price}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value.replace(/^0+(?=\d)/, "");
                                e.target.value = val;
                                const updated = [...officialForm.items];
                                updated[idx].price = val === "" ? 0 : Number(val);
                                setOfficialForm({ ...officialForm, items: updated });
                              }}
                              className="w-full px-2 py-1 rounded-md border border-slate-200 text-right font-bold text-sky-700 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (officialForm.items.length <= 1) return;
                                const updated = officialForm.items.filter((_, i) => i !== idx);
                                setOfficialForm({ ...officialForm, items: updated });
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Custom Service Row */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Custom Service Name (e.g. WhatsApp Thermal Printer Driver)"
                    value={officialForm.newCustomItem.service}
                    onChange={(e) =>
                      setOfficialForm({
                        ...officialForm,
                        newCustomItem: { ...officialForm.newCustomItem, service: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Included Work Details..."
                    value={officialForm.newCustomItem.includedWork}
                    onChange={(e) =>
                      setOfficialForm({
                        ...officialForm,
                        newCustomItem: { ...officialForm.newCustomItem, includedWork: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Price (₹)"
                    value={officialForm.newCustomItem.price === 0 ? "" : officialForm.newCustomItem.price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setOfficialForm({
                        ...officialForm,
                        newCustomItem: { ...officialForm.newCustomItem, price: val === "" ? 0 : Number(val) },
                      });
                    }}
                    className="w-24 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-right font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!officialForm.newCustomItem.service.trim()) return;
                      setOfficialForm({
                        ...officialForm,
                        items: [
                          ...officialForm.items,
                          {
                            service: officialForm.newCustomItem.service.trim(),
                            includedWork: officialForm.newCustomItem.includedWork.trim() || "Custom development & integration",
                            price: Number(officialForm.newCustomItem.price) || 0,
                          },
                        ],
                        newCustomItem: { service: "", includedWork: "", price: 0 },
                      });
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    + Add Item
                  </button>
                </div>

                {/* Subtotal, Discount & Total Calculation Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/40 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Discount & Tax controls */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 w-28">Discount (₹):</label>
                        <input
                          type="number"
                          value={officialForm.discount === 0 ? "" : officialForm.discount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^0+(?=\d)/, "");
                            e.target.value = val;
                            setOfficialForm({ ...officialForm, discount: val === "" ? 0 : Number(val) });
                          }}
                          placeholder="0"
                          className="w-32 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-emerald-700 text-xs"
                        />
                        <div className="flex items-center gap-1">
                          {[500, 1000, 2000, 3498].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setOfficialForm({ ...officialForm, discount: d })}
                              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              ₹{d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 w-28">GST (18%):</label>
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={officialForm.taxRate > 0}
                            onChange={(e) => setOfficialForm({ ...officialForm, taxRate: e.target.value ? (e.target.checked ? 18 : 0) : 0 })}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <span>{officialForm.taxRate > 0 ? "18% GST Applicable" : "Exempt / 0% GST"}</span>
                        </label>
                      </div>
                    </div>

                    {/* Grand Total Summary */}
                    <div className="sm:text-right space-y-1">
                      <p className="text-xs text-slate-500">
                        Subtotal: <span className="font-bold text-slate-800">{formatCurrency(computeOfficialSubtotal())}</span>
                      </p>
                      {computeOfficialDiscount() > 0 && (
                        <p className="text-xs text-emerald-600 font-semibold">
                          Discount: -{formatCurrency(computeOfficialDiscount())}
                        </p>
                      )}
                      {computeOfficialTax() > 0 && (
                        <p className="text-xs text-slate-500">
                          GST (18%): +{formatCurrency(computeOfficialTax())}
                        </p>
                      )}
                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Total Package Price</span>
                        <p className="text-2xl font-black text-sky-600 tracking-tight">
                          {formatCurrency(computeOfficialGrandTotal())}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount in Words */}
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="font-bold text-slate-700">Amount in Words: </span>
                    <span className="font-bold text-sky-700 italic">{computeOfficialAmountWords()}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Payment Schedule (Milestones) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>3. Payment Schedule (Dynamically Computed)</span>
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b">
                      <tr>
                        <th className="py-2.5 px-3">Milestone</th>
                        <th className="py-2.5 px-3 text-center w-24">Percentage</th>
                        <th className="py-2.5 px-3 text-right w-36">Calculated Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {getMilestones().map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{m.milestone}</td>
                          <td className="py-2 px-3 text-center text-slate-500 font-bold">{m.percentage}%</td>
                          <td className="py-2 px-3 text-right font-black text-sky-700">{formatCurrency(m.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4, 5, 6, 7 Legal Terms Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4 - 7. Hosting Conditions, Revisions, Support & Validity
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-2 max-h-40 overflow-y-auto font-sans leading-relaxed">
                  <p>
                    <strong className="text-slate-800">4. Hosting, Server & Database Conditions:</strong> All server operations are provisioned on dedicated high-performance cloud infrastructure with automatic SSL and daily database backups.
                  </p>
                  <p>
                    <strong className="text-slate-800">5. Revisions & Support:</strong> Includes up to two (2) consolidated rounds of feedback and minor revisions during UI/UX staging. Comprehensive seven (7) calendar days of post-handover technical support is included.
                  </p>
                  <p>
                    <strong className="text-slate-800">6. Client Responsibilities:</strong> Client agrees to furnish necessary branding assets, product listings, textual content, credentials, and approvals in a prompt manner.
                  </p>
                  <p>
                    <strong className="text-slate-800">7. Acceptance & Validity:</strong> This quotation is valid for fifteen (15) calendar days from the date of issue.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Word (.docx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadOfficialPdf}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF (.pdf)</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfficialBuilderModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveOfficialQuotation}
                  disabled={savingOfficial}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white text-xs font-bold cursor-pointer transition-all shadow-md shadow-sky-500/20 active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingOfficial ? "Saving to System..." : "Save to System & Generate Client Link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legacy Proposal & Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                  COMMERCIAL ENGINE
                </span>
                <h3 className="text-base font-bold text-white">Create Master Contract & Proposal</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => setCreateStep("DETAILS")}
                className={`py-3 transition-colors cursor-pointer ${
                  createStep === "DETAILS" ? "bg-white text-sky-600 border-b-2 border-sky-600" : "text-slate-500"
                }`}
              >
                1. Project & Client
              </button>
              <button
                type="button"
                onClick={() => setCreateStep("ITEMS")}
                className={`py-3 transition-colors cursor-pointer ${
                  createStep === "ITEMS" ? "bg-white text-sky-600 border-b-2 border-sky-600" : "text-slate-500"
                }`}
              >
                2. Scope & Pricing
              </button>
              <button
                type="button"
                onClick={() => setCreateStep("AGREEMENT")}
                className={`py-3 transition-colors cursor-pointer ${
                  createStep === "AGREEMENT" ? "bg-white text-sky-600 border-b-2 border-sky-600" : "text-slate-500"
                }`}
              >
                3. T&C & Agreement
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="p-6 space-y-5 text-xs">
              {/* STEP 1: DETAILS */}
              {createStep === "DETAILS" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Proposal / Quotation Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Master Enterprise ERP & Automated WhatsApp Suite"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Designate Delivery Manager *
                    </label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="">-- Select Manager --</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role} - {m.jobTitle || m.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Client Details Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-sky-600" />
                        <span>Client Information</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewClient(false)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            !isNewClient ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-500"
                          }`}
                        >
                          Select Existing
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNewClient(true)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            isNewClient ? "bg-white text-sky-600 shadow-xs font-bold" : "text-slate-500"
                          }`}
                        >
                          + New Client
                        </button>
                      </div>
                    </div>

                    {!isNewClient ? (
                      <div>
                        <select
                          value={formData.customerId}
                          onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white"
                        >
                          <option value="">-- Choose Client Profile --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.companyName} ({c.user?.name} - {c.user?.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Company Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Acme Global Logistics Ltd"
                            value={formData.newClient.companyName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, companyName: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Representative Name *</label>
                          <input
                            type="text"
                            placeholder="e.g. Ramesh Sharma"
                            value={formData.newClient.name}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, name: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Email Address *</label>
                          <input
                            type="email"
                            placeholder="ramesh@acme.com"
                            value={formData.newClient.email}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, email: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Mobile Phone *</label>
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formData.newClient.phone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                newClient: { ...formData.newClient, phone: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setCreateStep("ITEMS")}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Proceed to Scope & Pricing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ITEMS & PRICING */}
              {createStep === "ITEMS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Scope Deliverables & Milestones</label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          items: [...formData.items, { description: "", quantity: 1, unitPrice: 50000 }],
                        })
                      }
                      className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 font-bold hover:bg-sky-100 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Milestone</span>
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                        <span className="text-slate-400 font-bold text-xs">#{idx + 1}</span>
                        <input
                          type="text"
                          placeholder="Scope milestone description..."
                          value={item.description}
                          onChange={(e) => {
                            const newItems = [...formData.items];
                            newItems[idx].description = e.target.value;
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^0+(?=\d)/, "");
                            e.target.value = val;
                            const newItems = [...formData.items];
                            newItems[idx].quantity = val === "" ? 0 : Number(val);
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-center"
                        />
                        <input
                          type="number"
                          placeholder="Rate"
                          value={item.unitPrice === 0 ? "" : item.unitPrice}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value.replace(/^0+(?=\d)/, "");
                            e.target.value = val;
                            const newItems = [...formData.items];
                            newItems[idx].unitPrice = val === "" ? 0 : Number(val);
                            setFormData({ ...formData, items: newItems });
                          }}
                          className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-right font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (formData.items.length <= 1) return;
                            setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Financial calculation */}
                  <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Commercial Discount (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.discount === 0 ? "" : formData.discount}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+(?=\d)/, "");
                          e.target.value = val;
                          setFormData({ ...formData, discount: val === "" ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">GST Tax Rate (%)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.taxRate === 0 ? "" : formData.taxRate}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+(?=\d)/, "");
                          e.target.value = val;
                          setFormData({ ...formData, taxRate: val === "" ? 0 : Number(val) });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCreateStep("DETAILS")}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateStep("AGREEMENT")}
                      className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Proceed to Agreement Terms</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: AGREEMENT */}
              {createStep === "AGREEMENT" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Agreement Legal Title</label>
                    <input
                      type="text"
                      value={formData.agreementTitle}
                      onChange={(e) => setFormData({ ...formData, agreementTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Terms & Conditions Document</label>
                    <textarea
                      rows={6}
                      value={formData.termsConditions}
                      onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-300 font-mono text-[11px] leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setCreateStep("ITEMS")}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold flex items-center gap-2 shadow-md shadow-emerald-600/30 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{submitting ? "Publishing..." : "Publish & Generate Agreement"}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Assign / Reassign Modal */}
      {showAssignModal && assigningQuotation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Assign / Reassign Stakeholders</h3>
                <p className="text-[11px] text-slate-500 font-mono">{assigningQuotation.quotationNumber}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Assign Delivery Manager</label>
              <select
                value={selectedNewManagerId}
                onChange={(e) => setSelectedNewManagerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                <option value="">-- Unassigned --</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Link Client Organization</label>
              <select
                value={selectedNewCustomerId}
                onChange={(e) => setSelectedNewCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.user?.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                {submitting ? "Updating..." : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getDefaultAgreementTerms(): string {
  return `MASTER SOFTWARE SERVICES & CLOUD ENGINEERING AGREEMENT

1. SCOPE OF SERVICES & DELIVERABLES:
ABECSA Software Solutions ("Service Provider") agrees to design, architect, engineer, and deploy the bespoke software system specified in this proposal for the Client. All development sprints will be delivered according to agreed technical specifications, acceptance criteria, and mobile-first responsive standards.

2. COMMERCIAL CONSIDERATION & PAYMENT SCHEDULE:
The Client agrees to remit payment in accordance with the payment milestones detailed in this quotation.
- Mobilization Advance (40%): Due upon formal execution of this agreement.
- Staging & Intermediate Sprints (40%): Due upon milestone staging deployment and client demonstration.
- Final Acceptance & Code Handover (20%): Due upon complete QA verification and production deployment.
All statutory taxes (GST @ 18%) are applied as indicated.

3. INTELLECTUAL PROPERTY & SOURCE CODE OWNERSHIP:
Upon full and final settlement of all commercial invoices, 100% unrestricted intellectual property (IP) rights, proprietary source code, software architecture artifacts, and database schemas shall be transferred exclusively to the Client. The Service Provider retains no residual rights except the non-exclusive privilege to reference the delivered project in professional engineering portfolios.

4. CONFIDENTIALITY & NON-DISCLOSURE (NDA):
Both parties mutually pledge to protect all proprietary business logic, financial data, API credentials, customer records, and trade secrets with utmost confidentiality. No confidential information shall be disclosed to any third party without express written authorization.

5. SERVICE LEVEL AGREEMENT (SLA) & 12-MONTH WARRANTY:
The Service Provider provides a comprehensive 12-month post-launch warranty covering all reproducible defects, software bugs, and security vulnerability patches without additional assessment charges. Technical support is guaranteed under standard business SLA (response within 4 hours; critical resolution within 24 hours).

6. LEGAL JURISDICTION & DIGITAL EXECUTION:
This agreement is governed by the laws of India. Any unresolved dispute arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka. Execution of this document via electronic signature (E-Sign) shall carry the full legal validity, binding power, and admissibility of an original handwritten wet-ink signature.`;
}
