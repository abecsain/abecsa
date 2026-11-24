"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Check,
  Search,
  Filter,
  ArrowRight,
  Database,
  Sliders,
  DollarSign,
  Package,
  Receipt,
  FileSpreadsheet,
  Globe,
  Smartphone,
  Cpu,
  Building2,
  Stethoscope,
  Truck,
  GraduationCap,
  UtensilsCrossed,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  RotateCcw,
  Printer,
  ShieldCheck,
  Zap,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CatalogProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  shortDescription: string;
  fullDescription?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  recurringPrice: number;
  recurringInterval: string;
  isPriceOnRequest: boolean;
  keyFeatures: string;
  configurableAddons?: string | null;
  suitableFor?: string | null;
  recommendedDatabaseTier?: string | null;
  deploymentOptions?: string | null;
  pricingModel: string;
  sharedModuleIds?: string | null;
  compatibleProductIds?: string | null;
  isFeatured: boolean;
}

interface CatalogPackage {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline?: string | null;
  description?: string | null;
  badge?: string | null;
  basePrice: number;
  recurringPrice: number;
  recurringInterval: string;
  discountAmount: number;
  includedProductCodes: string;
  includedFeatures: string;
  databaseTier?: string | null;
  userLimit?: string | null;
  productLimit?: string | null;
  supportTier?: string | null;
  isFeatured: boolean;
}

interface DatabasePlan {
  id: string;
  sizeGb: number;
  label: string;
  monthlyPrice: number;
  annualPrice: number;
  storageType: string;
  recommendedBusinessSize?: string | null;
  backupInfo: string;
}

interface EstimatorRule {
  id: string;
  avgImageSizeBytes: number;
  avgProductRecordBytes: number;
  avgCustomerRecordBytes: number;
  avgBillRecordBytes: number;
  avgBillItemRecordBytes: number;
  overheadAndIndexFactor: number;
  safetyBufferPercent: number;
  externalStorageNotice: string;
}

// Comprehensive Pack Knowledge: Out-of-the-Box Inclusions, Modular Add-ons, Synergies & Custom Features
interface PackDetailMeta {
  category: string;
  categoryLabel: string;
  tagline: string;
  includedServices: { title: string; desc: string }[];
  modularAddons: { id: string; name: string; price: number; desc: string }[];
  smartSynergies: { linkedCode: string; linkedName: string; reason: string; benefit: string }[];
}

const PRODUCT_PACK_DETAILS: Record<string, PackDetailMeta> = {
  "PRODUCT-SHOWCASE": {
    category: "SHOWCASE",
    categoryLabel: "Showcase & WhatsApp Shop",
    tagline: "Turn smartphone browsing into instant WhatsApp orders & counter walk-ins",
    includedServices: [
      {
        title: "Digital Online Product Showcase & Catalog",
        desc: "Interactive photo gallery, categories, zoomable images, and live search for your customers.",
      },
      {
        title: "1-Tap 'Order on WhatsApp' Smart Cart",
        desc: "Customers select items, choose quantities, and click to send a neatly formatted cart order directly to your WhatsApp.",
      },
      {
        title: "Counter QR Standee Web Link",
        desc: "High-resolution printable QR code for your shop counter so walk-in customers can browse your entire catalog on their own phones.",
      },
      {
        title: "Live Stock Availability Sync",
        desc: "Automatically syncs with shop inventory to show real-time 'In Stock' or 'Limited Stock' badges.",
      },
      {
        title: "Festival Offers & Discount Banner Carousel",
        desc: "Highlight seasonal discounts, festive promotions, and newly arrived stock on top of your catalog.",
      },
      {
        title: "Mobile-First Zero-Install PWA",
        desc: "Opens instantly on 4G/5G mobile browsers without requiring customers to download any app from the Play Store.",
      },
    ],
    modularAddons: [
      {
        id: "showcase-domain",
        name: "Custom .in / .com Domain Connection",
        price: 899,
        desc: "Run your showcase on your own branded web address (e.g. yourshopname.in).",
      },
      {
        id: "showcase-upi-pay",
        name: "Direct UPI & QR Online Payment Gateway",
        price: 1499,
        desc: "Let customers pay advance tokens or full amount via Google Pay, PhonePe & Paytm.",
      },
      {
        id: "showcase-filter",
        name: "Advanced Multi-Variant Filtering (Size / Color / Price)",
        price: 999,
        desc: "Enables multi-attribute filters for apparel, jewellery, footwear, and electronics.",
      },
      {
        id: "showcase-multilingual",
        name: "Multi-Language Showcase (Hindi, Marathi, Gujarati)",
        price: 799,
        desc: "Display product details and WhatsApp cart messages in regional languages.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "POS-BILLING",
        linkedName: "Retail POS & GST Counter Billing",
        reason: "Instant WhatsApp Order to Thermal Slip Printing",
        benefit: "Orders received from the online showcase can be printed directly as counter slips or kitchen tokens in 2 seconds.",
      },
      {
        linkedCode: "INVENTORY-MGMT",
        linkedName: "Smart Inventory & Stock Control",
        reason: "Auto-Hide Sold Out Items in Real Time",
        benefit: "When an item is sold out in your physical store, it is instantly hidden or marked 'Out of Stock' on your showcase.",
      },
      {
        linkedCode: "CRM-WHATSAPP",
        linkedName: "Customer Management & WhatsApp Marketing",
        reason: "Broadcast Showcase Links to VIP Customers",
        benefit: "Send 1-click links of newly arrived showcase items to your entire WhatsApp customer list during festivals.",
      },
    ],
  },
  "POS-BILLING": {
    category: "RETAIL",
    categoryLabel: "Retail & Counter POS",
    tagline: "Ultra-fast thermal receipt billing with WhatsApp invoices & barcode scan",
    includedServices: [
      {
        title: "2-Second Ultra-Fast Thermal Slip Printing",
        desc: "Supports 2-inch, 3-inch thermal printers and standard A4/A5 laser invoices with your shop logo and GSTIN.",
      },
      {
        title: "USB Barcode Scanner & Mobile Camera Scan",
        desc: "Scan barcodes instantly using standard USB handheld scanners or a mobile phone camera.",
      },
      {
        title: "Dynamic UPI Payment QR on Bill Slips",
        desc: "Prints an instant dynamic UPI QR code on the thermal receipt for exact bill amount payment.",
      },
      {
        title: "Automated WhatsApp E-Invoice Delivery",
        desc: "Dispatches PDF/text invoice slip directly to customer WhatsApp number upon bill save.",
      },
      {
        title: "Daily Shift Register & Cash Drawer Tally",
        desc: "Audits cash drawer balances, shift handovers, and daily sales summary per counter operator.",
      },
      {
        title: "Offline Resilient Billing Mode",
        desc: "Bills continue printing without delay even if internet drops; auto-syncs when reconnected.",
      },
    ],
    modularAddons: [
      {
        id: "pos-weighscale",
        name: "Electronic Weighing Scale Serial Hardware Sync",
        price: 1499,
        desc: "Pulls exact weight automatically from digital scales for sweets, dry fruits, grocery & meat.",
      },
      {
        id: "pos-multicounter",
        name: "Additional Billing Counter Terminal License",
        price: 1999,
        desc: "Connect an extra billing counter PC or tablet sharing the same shop database.",
      },
      {
        id: "pos-touchscreen",
        name: "Touchscreen Quick-Tap POS Interface",
        price: 999,
        desc: "Large photo buttons for rapid cashier checkout without touching a keyboard.",
      },
      {
        id: "pos-dualdisplay",
        name: "Customer-Facing Dual Screen Billing Display",
        price: 1299,
        desc: "Shows items and promotional banners to the customer while cashier scans products.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "PRODUCT-SHOWCASE",
        linkedName: "Digital Product Catalog & Showcasing",
        reason: "Counter QR Standee & WhatsApp Bill Links",
        benefit: "Print your digital showcase link at the bottom of every receipt so customers re-order from home.",
      },
      {
        linkedCode: "ACCOUNTING-UDHAR",
        linkedName: "Udhar Khata & Accounting Ledger",
        reason: "Direct Udhar Ledger Posting at Checkout",
        benefit: "Select 'Udhar Credit' during billing to immediately update the customer's khata without manual ledger books.",
      },
      {
        linkedCode: "INVENTORY-MGMT",
        linkedName: "Smart Inventory & Stock Control",
        reason: "Automatic Stock Depletion per Bill",
        benefit: "Each item scanned instantly reduces warehouse stock and warns if items hit re-order levels.",
      },
    ],
  },
  "INVENTORY-MGMT": {
    category: "INVENTORY",
    categoryLabel: "Stock & Inventory Control",
    tagline: "Total stock control, low-stock WhatsApp alerts & custom barcode printing",
    includedServices: [
      {
        title: "Low-Stock Automatic WhatsApp Warning Alerts",
        desc: "Receives WhatsApp alert the moment an item drops below your safety re-order threshold.",
      },
      {
        title: "Custom Barcode Generator & Label Printing",
        desc: "Generate and print custom barcode stickers with SKU, shop name, MRP, and sale price.",
      },
      {
        title: "Supplier Purchase Orders (PO) & Delivery Logs",
        desc: "Create professional vendor purchase orders and record goods received notes (GRN).",
      },
      {
        title: "Batch Number & Expiry Date Safeguard",
        desc: "Tracks batch numbers and triggers 30/60/90 days advance warning before expiry.",
      },
      {
        title: "Stock Wastage, Returns & Discrepancy Audit",
        desc: "Record damaged, expired, or returned stock with mandatory cashier notes and logs.",
      },
      {
        title: "Multi-Godown & Inter-Branch Stock Transfers",
        desc: "Move stock between warehouse and retail counters with digital transfer delivery challans.",
      },
    ],
    modularAddons: [
      {
        id: "inv-mobile-scanner",
        name: "Android Mobile Barcode Stock Audit App",
        price: 1499,
        desc: "Scan warehouse shelves using your phone camera for fast physical stock verification.",
      },
      {
        id: "inv-autoreorder",
        name: "1-Click Vendor WhatsApp Re-Order Generator",
        price: 999,
        desc: "Compiles all low-stock items into a vendor WhatsApp order message in 1 click.",
      },
      {
        id: "inv-shelf-mgmt",
        name: "Warehouse Rack & Shelf Location Manager",
        price: 1199,
        desc: "Assign exact rack numbers and aisles to speed up item retrieval in large godowns.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "POS-BILLING",
        linkedName: "Retail POS & GST Counter Billing",
        reason: "Live Counter Deduction Prevents Stockouts",
        benefit: "Cashier is immediately notified if an item being billed is the last unit in stock.",
      },
      {
        linkedCode: "PRODUCT-SHOWCASE",
        linkedName: "Digital Product Catalog & Showcasing",
        reason: "1-Click Showcase of Newly Arrived Stock",
        benefit: "New products added to inventory can be instantly published to your online showcase with 1 toggle.",
      },
    ],
  },
  "ACCOUNTING-UDHAR": {
    category: "ACCOUNTS",
    categoryLabel: "Udhar & Accounts Ledger",
    tagline: "Replace paper khata books with digital Udhar passbook & polite WhatsApp reminders",
    includedServices: [
      {
        title: "Digital Customer Udhar Credit Passbook",
        desc: "Maintains clear ledger for each customer with credit balance limits and transaction timestamps.",
      },
      {
        title: "Automated Polite WhatsApp Reminders (तकादा)",
        desc: "Dispatches polite scheduled payment reminders with a direct UPI payment link.",
      },
      {
        title: "Supplier & Vendor Balance Tracker",
        desc: "Never miss vendor payments; logs invoices, paid amounts, and upcoming due dates.",
      },
      {
        title: "Daily Shop Income, Expenses & Petty Cash",
        desc: "Record tea, electricity, shop rent, staff advances, and transport expenses on mobile.",
      },
      {
        title: "Monthly Profit & Loss Statement & GST Summary",
        desc: "Automatic business health reports showing net profit, gross margin, and tax liabilities.",
      },
      {
        title: "1-Click PDF / Excel Customer Statements",
        desc: "Download or WhatsApp full customer statements showing debit, credit, and running balance.",
      },
    ],
    modularAddons: [
      {
        id: "acc-bank-sync",
        name: "Bank Statement Excel Import & Reconciliation Tool",
        price: 999,
        desc: "Import bank statements to automatically match UPI customer receipts.",
      },
      {
        id: "acc-ca-portal",
        name: "Chartered Accountant (CA) Read-Only Audit Portal",
        price: 1499,
        desc: "Gives your CA secure read-only access to download GST sales and purchase registers.",
      },
      {
        id: "acc-auto-receipt",
        name: "Instant WhatsApp Payment Receipt Confirmation",
        price: 699,
        desc: "Sends instant 'Payment Received with Thanks' WhatsApp voucher upon debt clearance.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "POS-BILLING",
        linkedName: "Retail POS & GST Counter Billing",
        reason: "Fast Counter Credit Billing",
        benefit: "Cashier can view existing customer Udhar balance right on the billing screen before giving credit.",
      },
      {
        linkedCode: "CRM-WHATSAPP",
        linkedName: "Customer Management & WhatsApp Marketing",
        reason: "Targeted Customer Settlement Offers",
        benefit: "Combine festive discount vouchers with clear Udhar balance statements.",
      },
    ],
  },
  "CRM-WHATSAPP": {
    category: "CRM",
    categoryLabel: "Customer CRM & WhatsApp",
    tagline: "Customer directory, repeat sales tracking & WhatsApp festival broadcasts",
    includedServices: [
      {
        title: "Customer Contact Directory & Lifetime Spend",
        desc: "Stores customer mobile numbers, addresses, birthdays, and total spend history in one dashboard.",
      },
      {
        title: "Bulk WhatsApp Festival Offer Broadcast Engine",
        desc: "Broadcast Diwali, Eid, New Year, and weekend offers to your customer list with photos and prices.",
      },
      {
        title: "Automated Birthday & Anniversary Greetings",
        desc: "System automatically dispatches personalized greetings with a discount coupon on customer birthdays.",
      },
      {
        title: "Inactive Customer Radar",
        desc: "Flags customers who haven't visited in the last 30/60 days so you can send win-back offers.",
      },
      {
        title: "Zero Recurring Per-Message API Fees",
        desc: "Uses your connected business phone number without requiring costly per-message third-party gateways.",
      },
    ],
    modularAddons: [
      {
        id: "crm-loyalty-points",
        name: "Customer Loyalty Cashback Points Engine",
        price: 999,
        desc: "Reward customers with redeemable points per ₹100 spent to drive repeat visits.",
      },
      {
        id: "crm-feedback-survey",
        name: "Automated WhatsApp Post-Purchase Star Rating",
        price: 799,
        desc: "Asks customers for a 5-star Google review or feedback 2 hours after their purchase.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "PRODUCT-SHOWCASE",
        linkedName: "Digital Product Catalog & Showcasing",
        reason: "Include Showcase Link in Bulk Broadcasts",
        benefit: "Paste your digital catalog link into WhatsApp broadcasts so customers order directly from home.",
      },
      {
        linkedCode: "POS-BILLING",
        linkedName: "Retail POS & GST Counter Billing",
        reason: "Auto-Capture Customer Mobile at Counter",
        benefit: "Every customer phone entered during billing is automatically saved into your CRM directory.",
      },
    ],
  },
  "WEBSITE-PAGEWISE": {
    category: "WEBSITES",
    categoryLabel: "Custom Websites & Portals",
    tagline: "Transparent page-wise business website with Google SEO & WhatsApp widget",
    includedServices: [
      {
        title: "100% Mobile, Tablet & Laptop Responsive Design",
        desc: "Modern, ultra-fast website that looks stunning on every device screen size.",
      },
      {
        title: "Direct WhatsApp Chat Widget & Lead Form",
        desc: "Floating WhatsApp button and contact inquiry form with instant email alerts.",
      },
      {
        title: "Google Maps Business Profile & Local Search SEO",
        desc: "Optimized so local customers searching for your products find your shop on Google.",
      },
      {
        title: "High-Speed NVMe Cloud Hosting with SSL",
        desc: "Blazing fast cloud server hosting with green padlock SSL certificate included.",
      },
      {
        title: "Custom Domain Integration (.in / .com)",
        desc: "Connect your official domain with professional business emails.",
      },
    ],
    modularAddons: [
      {
        id: "web-seo-pro",
        name: "Google 1st Page Local SEO Growth Pack",
        price: 1499,
        desc: "Keyword research, meta tags, schema markup, and Google Search Console indexing.",
      },
      {
        id: "web-cms-admin",
        name: "Admin Panel to Update Photos & Text Yourself",
        price: 1999,
        desc: "Simple visual dashboard to change prices, upload photos, and edit text anytime.",
      },
      {
        id: "web-domain-in",
        name: "1-Year .in Domain Registration & DNS Setup",
        price: 799,
        desc: "Official .in domain registered in your company name with full DNS routing.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "PRODUCT-SHOWCASE",
        linkedName: "Digital Product Catalog & Showcasing",
        reason: "Embed Live Product Catalog in Website",
        benefit: "Showcase all your items with 1-tap WhatsApp buy buttons directly on your main company website.",
      },
    ],
  },
  "RESTAURANT-CAFE": {
    category: "RESTAURANT",
    categoryLabel: "Restaurant & Cafe POS",
    tagline: "Kitchen Order Tickets (KOT), table management & tabletop QR menus",
    includedServices: [
      {
        title: "Kitchen Order Ticket (KOT) Direct Printing",
        desc: "Dispatches food orders instantly to the kitchen thermal printer or chef display screen.",
      },
      {
        title: "Interactive Table Floor Map",
        desc: "Real-time visual table statuses: Vacant (Green), Running (Blue), and Billed (Amber).",
      },
      {
        title: "Tabletop QR Menu for Contactless Ordering",
        desc: "Diners scan tabletop QR standee to view photos, prices, chef specials, and order from phone.",
      },
      {
        title: "Takeaway & Parcel Counter Token Slip",
        desc: "Rapid billing for parcel counters with sequential kitchen tokens and customer pickup slips.",
      },
      {
        title: "Daily Raw Ingredient Consumption & Food Costing",
        desc: "Tracks milk, chicken, vegetables, and flour consumption automatically per dish served.",
      },
    ],
    modularAddons: [
      {
        id: "rest-captain-app",
        name: "Waiter Mobile App for Table Order Taking",
        price: 1999,
        desc: "Waiters punch orders on their Android phone right at the customer's table.",
      },
      {
        id: "rest-swiggy-sync",
        name: "Swiggy & Zomato Order Notification Consolidation",
        price: 2499,
        desc: "View and accept online delivery orders in the same central restaurant screen.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "INVENTORY-MGMT",
        linkedName: "Smart Inventory & Stock Control",
        reason: "Recipe Ingredient Deduction",
        benefit: "Automatically deducts cheese, butter, and coffee powder from inventory as dishes are billed.",
      },
    ],
  },
  "PHARMACY-CLINIC": {
    category: "PHARMACY",
    categoryLabel: "Pharmacy & Clinic Management",
    tagline: "Medicine salt alternative search, Schedule H register & expiry alerts",
    includedServices: [
      {
        title: "Medicine Generic Salt & Substitute Search Engine",
        desc: "Find substitute brands with identical chemical salt composition in under 2 seconds.",
      },
      {
        title: "Schedule H & H1 Drug Dispensing Register",
        desc: "Complies with drug authority regulations; logs doctor name, patient name, and batch number.",
      },
      {
        title: "Batch Expiry Early Warning Radar",
        desc: "Alerts you 60 and 90 days before medicines expire so you can return them to wholesalers.",
      },
      {
        title: "Patient Medical & Prescription Profiles",
        desc: "Maintains repeat chronic patient medicine lists for rapid 1-click refill billing.",
      },
      {
        title: "Wholesale Medicine Inward Invoice Matching",
        desc: "Matches purchase invoices against received strips and calculates retail profit margin.",
      },
    ],
    modularAddons: [
      {
        id: "pharm-sms-refill",
        name: "Chronic Patient Monthly Refill WhatsApp Alerts",
        price: 1199,
        desc: "Automatically reminds diabetic and BP patients 3 days before their medicine strip finishes.",
      },
      {
        id: "pharm-wholesaler-edi",
        name: "Wholesaler Inward Purchase Excel Import",
        price: 1499,
        desc: "Upload distributor Excel/CSV invoices to instantly inward 100+ medicine batches.",
      },
    ],
    smartSynergies: [
      {
        linkedCode: "ACCOUNTING-UDHAR",
        linkedName: "Udhar Khata & Accounting Ledger",
        reason: "Monthly Medicine Family Khata",
        benefit: "Track running credit accounts for regular families who settle medical bills monthly.",
      },
    ],
  },
};

export interface SoftwareCategoryInfo {
  id: string;
  name: string;
  tagline: string;
  icon: any;
  productCode: string;
  startingPrice: number;
  highlightBadge: string;
  description: string;
}

export const MASTER_SOFTWARE_CATEGORIES: SoftwareCategoryInfo[] = [
  {
    id: "SHOWCASE",
    name: "Digital Showcase & WhatsApp Shop",
    tagline: "Online product catalog with 1-tap WhatsApp ordering & counter QR standee",
    icon: ShoppingBag,
    productCode: "PRODUCT-SHOWCASE",
    startingPrice: 3999,
    highlightBadge: "High Customer Conversion",
    description: "Mobile web link & counter QR standee for customers to browse photos, check prices & send orders directly to your WhatsApp.",
  },
  {
    id: "RETAIL",
    name: "Retail POS & GST Counter Billing",
    tagline: "Ultra-fast thermal slip printing, barcode scanning & WhatsApp invoices",
    icon: Receipt,
    productCode: "POS-BILLING",
    startingPrice: 4999,
    highlightBadge: "Essential for Stores",
    description: "Generate bills in 2 seconds. Supports barcode scanners, 2-inch & 3-inch thermal printers, UPI payment QR, and offline billing.",
  },
  {
    id: "INVENTORY",
    name: "Smart Inventory & Stock Control",
    tagline: "Real-time stock depletion, low-stock WhatsApp alerts & barcode stickers",
    icon: Package,
    productCode: "INVENTORY-MGMT",
    startingPrice: 4999,
    highlightBadge: "Prevent Stockouts",
    description: "Track warehouse stock, print custom barcode stickers, receive WhatsApp low-stock alerts, and manage supplier purchase orders.",
  },
  {
    id: "ACCOUNTS",
    name: "Udhar Khata & Accounting Ledger",
    tagline: "Digital customer Udhar passbook, automated WhatsApp reminders & P&L",
    icon: FileSpreadsheet,
    productCode: "ACCOUNTING-UDHAR",
    startingPrice: 3499,
    highlightBadge: "Faster Debt Recovery",
    description: "Replace paper khata books with digital passbooks. Send polite automated WhatsApp payment reminders with UPI QR codes.",
  },
  {
    id: "CRM",
    name: "Customer CRM & WhatsApp Marketing",
    tagline: "Customer contact directory, purchase history & bulk festival broadcasts",
    icon: MessageSquare,
    productCode: "CRM-WHATSAPP",
    startingPrice: 2999,
    highlightBadge: "Repeat Sales Booster",
    description: "Save customer phones from bills, broadcast festive promotions directly on WhatsApp, and send automated birthday wishes.",
  },
  {
    id: "WEBSITES",
    name: "Custom Business Websites & Portals",
    tagline: "Page-by-page custom website with Google SEO & WhatsApp inquiry button",
    icon: Globe,
    productCode: "WEBSITE-PAGEWISE",
    startingPrice: 2999,
    highlightBadge: "100% Mobile Responsive",
    description: "Professional corporate presence. Transparent page-wise pricing (base ₹2,999 for 3 pages), high-speed cloud NVMe hosting & free SSL.",
  },
  {
    id: "RESTAURANT",
    name: "Restaurant POS, Table KOT & QR Menu",
    tagline: "Kitchen Order Tickets (KOT), floor table status & tabletop QR menus",
    icon: UtensilsCrossed,
    productCode: "RESTAURANT-CAFE",
    startingPrice: 6999,
    highlightBadge: "Cafes & Dining Outlets",
    description: "Built for dining & takeaway. Instant KOT dispatch to kitchen printer, table management (Vacant/Running/Billed), and tabletop digital menus.",
  },
  {
    id: "PHARMACY",
    name: "Pharmacy & Clinic Management",
    tagline: "Medicine salt substitute search, Schedule H registers & expiry alerts",
    icon: Stethoscope,
    productCode: "PHARMACY-CLINIC",
    startingPrice: 6499,
    highlightBadge: "Drug Compliance Ready",
    description: "Find alternate salt substitute brands in 2 seconds. Manage doctor prescriptions, Schedule H registers, and 60-day advance expiry alerts.",
  },
];

export default function SolutionsEngine({ initialTab = "BUILDER" }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<
    "CATALOG" | "BUILDER" | "DATABASE" | "PACKAGES" | "WEBSITE" | "COMPARISON" | "QUOTATION"
  >(initialTab as any || "BUILDER");

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [databasePlans, setDatabasePlans] = useState<DatabasePlan[]>([]);
  const [estimatorRule, setEstimatorRule] = useState<EstimatorRule | null>(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [builderCategoryFilter, setBuilderCategoryFilter] = useState("ALL");

  // Selected Software in Configuration Builder (Default: POS, Inventory & Showcasing with 5 GB DB)
  const [selectedProductCodes, setSelectedProductCodes] = useState<string[]>([
    "POS-BILLING",
    "INVENTORY-MGMT",
    "PRODUCT-SHOWCASE",
  ]);
  const [expandedProductCode, setExpandedProductCode] = useState<string | null>("PRODUCT-SHOWCASE");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedDatabaseGb, setSelectedDatabaseGb] = useState<number>(5);
  const [isCustomDatabase, setIsCustomDatabase] = useState(false);
  const [customDatabaseGb, setCustomDatabaseGb] = useState<number>(30);
  const [selectedTenure, setSelectedTenure] = useState<"1_YEAR" | "3_YEARS" | "5_YEARS" | "MONTHLY">("1_YEAR");

  // Custom User Features Added to the Solution
  const [customFeatures, setCustomFeatures] = useState<{ id: string; productCode: string; text: string }[]>([]);
  const [customFeatureInput, setCustomFeatureInput] = useState("");

  // Mobile Bottom Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Estimator Slider States
  const [estProductsCount, setEstProductsCount] = useState(2500);
  const [estImagesPerProduct, setEstImagesPerProduct] = useState(2);
  const [estBillsPerDay, setEstBillsPerDay] = useState(40);
  const [estCustomersCount, setEstCustomersCount] = useState(3000);

  // Website Configurator State & Addons
  const [websiteType, setWebsiteType] = useState("Corporate Business");
  const [websitePagesCount, setWebsitePagesCount] = useState(5);
  const [webAddons, setWebAddons] = useState<string[]>(["whatsapp-widget", "local-seo"]);
  const [webHostingChoice, setWebHostingChoice] = useState("ABECSA Managed Edge Cloud");
  const [webDomainChoice, setWebDomainChoice] = useState("New .com / .in Domain");

  // Dynamic Page-Wise Website Calculation: ₹2,999 for first 3 pages + ₹499/extra page + add-ons
  const calculatedWebsitePrice = useMemo(() => {
    const base = 2999;
    const extraPages = Math.max(0, websitePagesCount - 3) * 499;
    let addonsTotal = 0;
    if (webAddons.includes("whatsapp-widget")) addonsTotal += 499;
    if (webAddons.includes("payment-gateway")) addonsTotal += 1499;
    if (webAddons.includes("local-seo")) addonsTotal += 999;
    if (webAddons.includes("cms-admin")) addonsTotal += 1999;
    if (webAddons.includes("domain-in")) addonsTotal += 799;
    return base + extraPages + addonsTotal;
  }, [websitePagesCount, webAddons]);

  // Quotation Submission Form
  const [quoteForm, setQuoteForm] = useState({
    customerName: "",
    businessName: "",
    email: "",
    phone: "",
    city: "",
    businessType: "Retail / Wholesale",
    preferredContact: "WHATSAPP",
    notes: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [submittedQuoteNumber, setSubmittedQuoteNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogData();
  }, []);

  const fetchCatalogData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/solutions/catalog");
      const data = await res.json();
      if (res.ok) {
        if (data.products) setProducts(data.products);
        if (data.packages) setPackages(data.packages);
        if (data.databasePlans) setDatabasePlans(data.databasePlans);
        if (data.estimatorRule) setEstimatorRule(data.estimatorRule);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const parseJsonArray = (val: any): any[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return val.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  // Toggle Product Selection
  const toggleProduct = (code: string) => {
    setSelectedProductCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  // Toggle Addon
  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Toggle Web Addon
  const toggleWebAddon = (addonId: string) => {
    setWebAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Load a Pre-Made Package into the Configuration Builder
  const customizePackage = (pkg: CatalogPackage) => {
    const includedCodes = parseJsonArray(pkg.includedProductCodes);
    setSelectedProductCodes(includedCodes);
    if (pkg.databaseTier) {
      const match = pkg.databaseTier.match(/\d+/);
      if (match) {
        setSelectedDatabaseGb(Number(match[0]));
        setIsCustomDatabase(false);
      }
    }
    setActiveTab("BUILDER");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // Dynamic Pricing Calculations (Affordable MSME Pricing: ₹14,999 with 15GB DB, 1/3/5 Year Tenure)
  const pricingSummary = useMemo(() => {
    let oneTimeSubtotal = 0;
    let recurringMonthlySubtotal = 0;
    let recurringAnnualSubtotal = 0;
    let hasCustomPrice = false;

    const selectedProductsList = products.filter((p) => selectedProductCodes.includes(p.code));

    // Base Products
    selectedProductsList.forEach((p) => {
      if (p.isPriceOnRequest || p.basePrice === 0) {
        hasCustomPrice = true;
      } else if (p.code === "WEBSITE-PAGEWISE") {
        oneTimeSubtotal += calculatedWebsitePrice;
      } else {
        oneTimeSubtotal += p.basePrice;
      }

      if (p.recurringPrice > 0) {
        if (p.recurringInterval === "MONTHLY") {
          recurringMonthlySubtotal += p.recurringPrice;
          recurringAnnualSubtotal += p.recurringPrice * 12;
        } else {
          recurringAnnualSubtotal += p.recurringPrice;
          recurringMonthlySubtotal += Math.round(p.recurringPrice / 12);
        }
      }
    });

    // Addons & Shared Module Deduplication
    const activeAddons: any[] = [];
    const sharedModulesCounted = new Set<string>();
    let sharedModuleDeduplicationDiscount = 0;

    selectedProductsList.forEach((p) => {
      const addons = parseJsonArray(p.configurableAddons);
      addons.forEach((addon: any) => {
        if (selectedAddonIds.includes(addon.id)) {
          if (addon.sharedModuleId && sharedModulesCounted.has(addon.sharedModuleId)) {
            sharedModuleDeduplicationDiscount += addon.price;
          } else {
            if (addon.sharedModuleId) sharedModulesCounted.add(addon.sharedModuleId);
            activeAddons.push(addon);
            oneTimeSubtotal += addon.price;
            if (addon.recurringPrice > 0) {
              recurringMonthlySubtotal += addon.recurringPrice;
              recurringAnnualSubtotal += addon.recurringPrice * 12;
            }
          }
        }
      });
    });

    // Database Tier Cost (0 GB = Customer's Own Server = ₹0)
    const effectiveGb = isCustomDatabase ? customDatabaseGb : selectedDatabaseGb;
    const selectedDbPlan = databasePlans.find((p) => p.sizeGb === effectiveGb);
    let dbMonthly = 0;
    let dbAnnual = 0;

    if (effectiveGb === 0) {
      dbMonthly = 0;
      dbAnnual = 0;
    } else if (selectedDbPlan) {
      dbMonthly = selectedDbPlan.monthlyPrice;
      dbAnnual = selectedDbPlan.annualPrice;
    } else {
      // Custom GB rate: ₹299 per GB per year
      dbAnnual = Math.round(effectiveGb * 299);
      dbMonthly = Math.round(dbAnnual / 12);
    }

    if (selectedTenure === "MONTHLY") {
      recurringMonthlySubtotal += dbMonthly;
      recurringAnnualSubtotal += dbMonthly * 12;
    } else {
      recurringAnnualSubtotal += dbAnnual;
      recurringMonthlySubtotal += Math.round(dbAnnual / 12);
    }

    // Multi-Product Bundle Discount: 10% for 2 products, 25% for 3+ products
    // Makes POS (4999) + Inventory (4999) + Showcasing (3999) + 15 GB DB (4499) total ~₹14,999!
    let bundleDiscount = 0;
    if (selectedProductsList.length >= 3) {
      bundleDiscount = Math.round(oneTimeSubtotal * 0.25);
    } else if (selectedProductsList.length === 2) {
      bundleDiscount = Math.round(oneTimeSubtotal * 0.1);
    }

    const netOneTime = Math.max(0, oneTimeSubtotal - bundleDiscount);

    // Tenure Multiplier & Multi-Year Savings
    let chosenRecurring = 0;
    let tenureSavings = 0;
    let tenureMultiplier = 1;
    let tenureLabel = "1 Year (Annual Plan)";

    if (selectedTenure === "MONTHLY") {
      chosenRecurring = recurringMonthlySubtotal;
      tenureMultiplier = 1;
      tenureLabel = "1 Month Subscription";
    } else if (selectedTenure === "1_YEAR") {
      chosenRecurring = recurringAnnualSubtotal;
      tenureMultiplier = 1;
      tenureLabel = "1 Year Plan";
    } else if (selectedTenure === "3_YEARS") {
      tenureMultiplier = 3;
      const baseThreeYears = recurringAnnualSubtotal * 3;
      chosenRecurring = Math.round(baseThreeYears * 0.85); // 15% multi-year discount
      tenureSavings = baseThreeYears - chosenRecurring;
      tenureLabel = "3 Years Tenure (15% Multi-Year Savings)";
    } else if (selectedTenure === "5_YEARS") {
      tenureMultiplier = 5;
      const baseFiveYears = recurringAnnualSubtotal * 5;
      chosenRecurring = Math.round(baseFiveYears * 0.75); // 25% multi-year discount
      tenureSavings = baseFiveYears - chosenRecurring;
      tenureLabel = "5 Years Tenure (25% Multi-Year Savings)";
    }

    // GST Tax (18%)
    const taxAmount = Math.round((netOneTime + chosenRecurring) * 0.18);
    const grandTotal = netOneTime + chosenRecurring + taxAmount;

    return {
      selectedProductsList,
      activeAddons,
      oneTimeSubtotal,
      bundleDiscount,
      sharedModuleDeduplicationDiscount,
      netOneTime,
      dbMonthly,
      dbAnnual,
      recurringMonthlySubtotal,
      recurringAnnualSubtotal,
      chosenRecurring,
      tenureSavings,
      tenureMultiplier,
      tenureLabel,
      taxAmount,
      grandTotal,
      hasCustomPrice,
      selectedDbPlan,
      effectiveGb,
    };
  }, [
    products,
    selectedProductCodes,
    selectedAddonIds,
    selectedDatabaseGb,
    isCustomDatabase,
    customDatabaseGb,
    databasePlans,
    selectedTenure,
    calculatedWebsitePrice,
  ]);

  // Database Capacity Estimator Calculation
  const capacityEstimates = useMemo(() => {
    const rule = estimatorRule || {
      avgImageSizeBytes: 307200,
      avgProductRecordBytes: 4096,
      avgCustomerRecordBytes: 2048,
      avgBillRecordBytes: 3072,
      avgBillItemRecordBytes: 512,
      overheadAndIndexFactor: 1.35,
      safetyBufferPercent: 20.0,
      externalStorageNotice: "Product images are stored securely on High-Speed Object Storage (CDN).",
    };

    const daysInYear = 365;
    const estimatedBillsPerYear = estBillsPerDay * daysInYear;
    const estimatedItemsPerYear = estimatedBillsPerYear * 5;

    // Relational Database Data bytes
    const productDataBytes = estProductsCount * rule.avgProductRecordBytes;
    const customerDataBytes = estCustomersCount * rule.avgCustomerRecordBytes;
    const billDataBytes = estimatedBillsPerYear * rule.avgBillRecordBytes;
    const itemDataBytes = estimatedItemsPerYear * rule.avgBillItemRecordBytes;

    const rawDataBytes = productDataBytes + customerDataBytes + billDataBytes + itemDataBytes;
    // With DB indexes & overhead
    const totalDbBytes = rawDataBytes * rule.overheadAndIndexFactor;
    const totalDbGb = totalDbBytes / (1024 * 1024 * 1024);

    // External Object Storage (Images)
    const totalImageBytes = estProductsCount * estImagesPerProduct * rule.avgImageSizeBytes;
    const totalImageGb = totalImageBytes / (1024 * 1024 * 1024);

    // Capacity Utilization %
    const totalAllocatedGb = selectedDatabaseGb;
    const usagePercent = Math.min(150, Math.round((totalDbGb / totalAllocatedGb) * 100));
    const remainingGb = Math.max(0, Number((totalAllocatedGb - totalDbGb).toFixed(2)));

    // Threshold Status: Green (0-70%), Yellow (70-85%), Orange (85-100%), Red (>100%)
    let statusColor = "bg-emerald-500";
    let statusBadge = "Comfortable Capacity";
    let statusText = "Excellent headroom. System queries will perform at sub-10ms latency.";
    let statusBorder = "border-emerald-200 text-emerald-800 bg-emerald-50";

    if (usagePercent > 100) {
      statusColor = "bg-rose-500";
      statusBadge = "Insufficient Storage Tier";
      statusText = "Estimated transaction volume exceeds selected tier. Upgrade to larger database plan.";
      statusBorder = "border-rose-200 text-rose-800 bg-rose-50";
    } else if (usagePercent >= 85) {
      statusColor = "bg-amber-500";
      statusBadge = "Upgrade Recommended";
      statusText = "Approaching storage limit. Recommended to upgrade for multi-year historical ledger archiving.";
      statusBorder = "border-amber-200 text-amber-800 bg-amber-50";
    } else if (usagePercent >= 70) {
      statusColor = "bg-yellow-500";
      statusBadge = "Growing Capacity";
      statusText = "Adequate for 1-2 years of high-volume transactions with scheduled log pruning.";
      statusBorder = "border-yellow-200 text-yellow-800 bg-yellow-50";
    }

    return {
      estimatedBillsPerYear,
      totalDbGb: Number(totalDbGb.toFixed(2)),
      totalImageGb: Number(totalImageGb.toFixed(2)),
      usagePercent,
      remainingGb,
      statusColor,
      statusBadge,
      statusText,
      statusBorder,
      rule,
    };
  }, [selectedDatabaseGb, estProductsCount, estImagesPerProduct, estBillsPerDay, estCustomersCount, estimatorRule]);

  // Handle Quotation Submission
  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteForm.customerName || !quoteForm.email || !quoteForm.phone) {
      alert("Please fill in your name, email, and phone number.");
      return;
    }

    setSubmittingQuote(true);
    try {
      const payload = {
        customerName: quoteForm.customerName,
        businessName: quoteForm.businessName,
        email: quoteForm.email,
        phone: quoteForm.phone,
        city: quoteForm.city,
        businessType: quoteForm.businessType,
        preferredContact: quoteForm.preferredContact,
        selectedProducts: pricingSummary.selectedProductsList.map((p) => ({
          code: p.code,
          name: p.name,
          basePrice: p.code === "WEBSITE-PAGEWISE" ? calculatedWebsitePrice : p.basePrice,
          recurringPrice: p.recurringPrice,
        })),
        selectedDatabaseTier:
          pricingSummary.effectiveGb === 0
            ? "Customer's Own Database / Server (BYO - ₹0)"
            : `${pricingSummary.effectiveGb} GB Storage Tier`,
        websiteRequirements: {
          websiteType,
          websitePagesCount,
          calculatedWebsitePrice,
          webAddons,
          webHostingChoice,
          webDomainChoice,
        },
        tenure: selectedTenure,
        tenureMultiplier: pricingSummary.tenureMultiplier,
        tenureSavings: pricingSummary.tenureSavings,
        oneTimeTotal: pricingSummary.netOneTime,
        recurringTotal: pricingSummary.chosenRecurring,
        recurringInterval: selectedTenure === "MONTHLY" ? "MONTHLY" : `${pricingSummary.tenureMultiplier}_YEARS`,
        discountTotal: pricingSummary.bundleDiscount,
        taxAmount: pricingSummary.taxAmount,
        grandTotal: pricingSummary.grandTotal,
        customFeatures: customFeatures.map((f) => ({
          productCode: f.productCode,
          feature: f.text,
        })),
      };

      const res = await fetch("/api/solutions/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.requestNumber) {
        setSubmittedQuoteNumber(data.requestNumber);
        setActiveTab("QUOTATION");
      } else {
        alert(data.error || "Failed to submit request.");
      }
    } catch {
      alert("Network error. Please try again or chat with our team on WhatsApp.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  // Filtered Products for Software Builder Categories
  const builderFilteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (builderCategoryFilter === "ALL") return true;
      const detail = PRODUCT_PACK_DETAILS[prod.code];
      if (!detail) return true;
      return detail.category === builderCategoryFilter;
    });
  }, [products, builderCategoryFilter]);

  // Active expanded product for pack specification breakdown
  const activeExpandedProduct = useMemo(() => {
    if (!expandedProductCode) return null;
    return products.find((p) => p.code === expandedProductCode) || null;
  }, [products, expandedProductCode]);

  const activePackDetail = useMemo(() => {
    if (!expandedProductCode) return null;
    return PRODUCT_PACK_DETAILS[expandedProductCode] || null;
  }, [expandedProductCode]);

  // Filtered Products for Catalog
  const filteredProducts = products.filter((p) => {
    const matchesCat = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: "BUILDER", label: "Software Package Builder", icon: Layers, highlight: true },
          { id: "CATALOG", label: "Software Catalog", icon: Search },
          { id: "PACKAGES", label: "Ready-Made Packages", icon: Package },
          { id: "DATABASE", label: "DB Capacity Estimator", icon: Database },
          { id: "WEBSITE", label: "Website Configurator", icon: Globe },
          { id: "COMPARISON", label: "Package Comparison", icon: Sliders },
          { id: "QUOTATION", label: "Get a Quotation", icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          MODULE 1: SOFTWARE PACKAGE BUILDER (MULTI-STEP DYNAMIC ENGINE)
      ========================================================================= */}
      {activeTab === "BUILDER" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Configurator Steps (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Select Software Category & Modules */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                    STEP 1 OF 3 • SELECT SOFTWARE CATEGORY & MODULES
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    {builderCategoryFilter === "ALL"
                      ? "Choose Your Software Category"
                      : "Configure Software Modules"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {builderCategoryFilter === "ALL"
                      ? "Select any software category below to explore its out-of-the-box base services, features, and configuration."
                      : "Inspect what is included in this category at ₹0 extra, customize features, or explore other categories."}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-700 block">In Solution:</span>
                  <span className="text-lg font-black text-sky-600">
                    {selectedProductCodes.length} Software
                  </span>
                </div>
              </div>

              {/* View Mode A: Category Cards Grid (Default View When ALL is selected) */}
              {builderCategoryFilter === "ALL" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                    <span>Click any category to open its full feature breakdown & modules:</span>
                    <span className="font-bold text-sky-600 font-mono">8 Categories</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {MASTER_SOFTWARE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isProductSelected = selectedProductCodes.includes(cat.productCode);

                      return (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setBuilderCategoryFilter(cat.id);
                            setExpandedProductCode(cat.productCode);
                          }}
                          className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:border-sky-500 hover:shadow-md ${
                            isProductSelected
                              ? "border-sky-600 bg-sky-50/40 ring-1 ring-sky-500/20"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                                    {cat.name}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-mono block">
                                    {cat.productCode}
                                  </span>
                                </div>
                              </div>

                              {isProductSelected ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                  <span>Added</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  {cat.highlightBadge}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {cat.description}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">Starting From</span>
                              <span className="font-extrabold text-slate-900">
                                {formatCurrency(cat.startingPrice)}
                              </span>
                            </div>

                            <span className="text-xs font-bold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                              <span>Open Category</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* View Mode B: Focused Category Details When a Category is Clicked */
                <div className="space-y-5">
                  {/* Category Navigation Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-2.5 sm:p-3 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setBuilderCategoryFilter("ALL")}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      <span>← Back to All Categories</span>
                    </button>

                    {/* Quick Category Switcher Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                      {MASTER_SOFTWARE_CATEGORIES.map((c) => {
                        const isCur = builderCategoryFilter === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setBuilderCategoryFilter(c.id);
                              setExpandedProductCode(c.productCode);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                              isCur
                                ? "bg-slate-950 text-white shadow-2xs"
                                : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-200"
                            }`}
                          >
                            {c.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Software Module(s) in this Category */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Software Module in this Category:
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Toggle to include or remove from your solution
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {builderFilteredProducts.map((prod) => {
                        const isSelected = selectedProductCodes.includes(prod.code);
                        const detail = PRODUCT_PACK_DETAILS[prod.code];
                        const features = parseJsonArray(prod.keyFeatures);

                        return (
                          <div
                            key={prod.id}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isSelected
                                ? "border-sky-600 bg-sky-50/40 shadow-xs ring-1 ring-sky-500/20"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                                  {prod.code}
                                </span>
                                {detail && (
                                  <span className="text-[10px] font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                                    {detail.categoryLabel}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base font-bold text-slate-900">
                                {prod.name}
                              </h4>
                              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                                {prod.shortDescription}
                              </p>

                              {/* Features Preview */}
                              <div className="flex flex-wrap gap-2 pt-1">
                                {features.slice(0, 3).map((f, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>{f}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 gap-3">
                              <div>
                                <span className="text-[10px] text-slate-400 block">Base License</span>
                                <span className="text-lg font-black text-slate-900">
                                  {prod.isPriceOnRequest ? "On Request" : formatCurrency(prod.basePrice)}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleProduct(prod.code)}
                                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isSelected
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    : "bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Added to Solution (Click to Remove)</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>+ Add to Solution</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Pack Breakdown: Base Inclusions & Synergies */}
                  {activeExpandedProduct && activePackDetail && (
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white border border-sky-800/40 shadow-xl space-y-5">
                      {/* Breakdown Header */}
                      <div className="border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            {activePackDetail.categoryLabel}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {activeExpandedProduct.code}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                          {activeExpandedProduct.name} — Out-of-the-Box Inclusions
                        </h3>
                        <p className="text-xs text-sky-200/80 mt-0.5">
                          {activePackDetail.tagline}
                        </p>
                      </div>

                      {/* Included Base Services (₹0 Extra) */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Included In This Pack (Ready Out-of-the-Box • ₹0 Extra)
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                            6 Base Services Included
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {activePackDetail.includedServices.map((srv, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-2.5"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  {srv.title}
                                </span>
                                <span className="text-[11px] text-slate-300/80 leading-relaxed block mt-0.5">
                                  {srv.desc}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Smart Cross-Pack Synergies */}
                      <div className="space-y-3 pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-sky-400" />
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Smart Cross-Pack Synergies & Future Project Enhancements
                            </span>
                          </div>
                          <span className="text-[10px] text-sky-300">
                            Zero duplicate work
                          </span>
                        </div>

                        <div className="space-y-2">
                          {activePackDetail.smartSynergies.map((syn, idx) => {
                            const isAlreadySelected = selectedProductCodes.includes(syn.linkedCode);
                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-sky-300">
                                      {syn.reason}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      • with {syn.linkedName}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-300 leading-relaxed">
                                    {syn.benefit}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => toggleProduct(syn.linkedCode)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                                    isAlreadySelected
                                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                      : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-xs"
                                  }`}
                                >
                                  {isAlreadySelected ? "✓ Linked in Solution" : `+ Link ${syn.linkedCode}`}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom action to switch categories */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setBuilderCategoryFilter("ALL")}
                          className="text-sky-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>← Explore Another Category</span>
                        </button>
                        <span className="text-slate-400 text-[11px]">
                          Scroll down for Additional Options & Database selection ↓
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Additional Features & Custom Requirements (Additional Add Option) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                  STEP 2 OF 3 • ADDITIONAL ADD-ONS & CUSTOM FEATURES
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  Additional Add Options & Custom Requirements
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enhance your software pack with optional hardware connectors, specialized apps, or request a custom feature for your unique business logic.
                </p>
              </div>

              {/* Modular Features Addons Grid */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Select Modular Add-on Features:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pricingSummary.selectedProductsList.flatMap((p) => {
                    const addons = parseJsonArray(p.configurableAddons);
                    return addons.map((addon: any) => {
                      const isChecked = selectedAddonIds.includes(addon.id);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => toggleAddon(addon.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isChecked
                              ? "border-sky-500 bg-sky-50/40 ring-1 ring-sky-500/20"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="h-4 w-4 rounded text-sky-600 mt-0.5"
                            />
                            <div>
                              <span className="text-xs font-bold text-slate-900 block leading-tight">
                                {addon.name}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Module: {p.name}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-900 block">
                              +{formatCurrency(addon.price)}
                            </span>
                            {addon.recurringPrice > 0 && (
                              <span className="text-[10px] text-slate-400 block">
                                +{formatCurrency(addon.recurringPrice)}/mo
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>

              {/* Custom Feature Request Input Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Need a Custom Feature for Your Unique Workflow?
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Type any custom business logic (e.g. Weighing scale serial link, Tally sync, Regional language invoice) to include it in your custom solution quotation.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Add custom barcode scanner for weighed fruits, or link with our existing ERP..."
                    value={customFeatureInput}
                    onChange={(e) => setCustomFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customFeatureInput.trim()) {
                        e.preventDefault();
                        setCustomFeatures((prev) => [
                          ...prev,
                          {
                            id: `cf-${Date.now()}`,
                            productCode: expandedProductCode || "GENERAL",
                            text: customFeatureInput.trim(),
                          },
                        ]);
                        setCustomFeatureInput("");
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customFeatureInput.trim()) {
                        setCustomFeatures((prev) => [
                          ...prev,
                          {
                            id: `cf-${Date.now()}`,
                            productCode: expandedProductCode || "GENERAL",
                            text: customFeatureInput.trim(),
                          },
                        ]);
                        setCustomFeatureInput("");
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                  >
                    + Add Custom Feature
                  </button>
                </div>

                {/* Badges of added custom features */}
                {customFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {customFeatures.map((cf) => (
                      <span
                        key={cf.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-300 text-amber-900 text-xs font-semibold shadow-2xs"
                      >
                        <span>✨ {cf.text}</span>
                        <button
                          type="button"
                          onClick={() => setCustomFeatures((prev) => prev.filter((item) => item.id !== cf.id))}
                          className="text-amber-500 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Select Managed Database Capacity (DB Select) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                    STEP 3 OF 3 • SELECT MANAGED DATABASE CAPACITY
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    Database Storage & High-Speed Cloud Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Select the database plan matching your business transaction velocity. Automatic daily cloud backups included. (5 GB selected by default for major projects).
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("DATABASE")}
                  className="px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-sky-600" />
                  <span>Open Estimator</span>
                </button>
              </div>

              {/* Database Tiers Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {databasePlans.map((plan) => {
                  const isSelected = !isCustomDatabase && selectedDatabaseGb === plan.sizeGb;
                  const isMajorDefault = plan.sizeGb === 5;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => {
                        setSelectedDatabaseGb(plan.sizeGb);
                        setIsCustomDatabase(false);
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? "border-sky-600 bg-sky-50/50 shadow-xs ring-1 ring-sky-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {isMajorDefault && (
                        <span className="absolute -top-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-xs">
                          ★ Default (Major Projects)
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-1 mt-1">
                        <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                          {plan.sizeGb === 0 ? "Own Server / DB" : `${plan.sizeGb} GB`}
                        </span>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-sky-700">
                        {plan.sizeGb === 0
                          ? "₹0 (Self-Hosted)"
                          : `${formatCurrency(selectedTenure === "MONTHLY" ? plan.monthlyPrice : plan.annualPrice)}/${selectedTenure === "MONTHLY" ? "mo" : "yr"}`}
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-1 block">
                        {plan.sizeGb === 0 ? "Bring your own DB" : plan.recommendedBusinessSize || "Cloud NVMe"}
                      </span>
                    </button>
                  );
                })}

                {/* Custom Storage Option */}
                <button
                  type="button"
                  onClick={() => setIsCustomDatabase(true)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    isCustomDatabase
                      ? "border-sky-600 bg-sky-50/50 shadow-xs ring-1 ring-sky-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
                      + Custom GB
                    </span>
                    {isCustomDatabase && (
                      <span className="h-4 w-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-sky-700">
                    ₹299/GB/yr
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-1 mt-1 block">
                    Tailored Enterprise Size
                  </span>
                </button>
              </div>

              {/* Custom GB Input if toggled */}
              {isCustomDatabase && (
                <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-sky-950 block">Enter Custom Database Storage Size:</span>
                    <span className="text-[10px] text-sky-700">Calculated at ₹299 per GB / year</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      step="5"
                      value={customDatabaseGb}
                      onChange={(e) => setCustomDatabaseGb(Math.max(1, Number(e.target.value)))}
                      className="w-24 px-3 py-1.5 rounded-xl border border-sky-300 bg-white font-mono font-bold text-center text-sm"
                    />
                    <span className="font-bold text-sky-900">GB</span>
                  </div>
                </div>
              )}

              {/* Dynamic Capacity Visual Indicator Widget */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Database className="w-4 h-4 text-sky-600" />
                    <span>Estimated Capacity Status:</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${capacityEstimates.statusBorder}`}>
                    {capacityEstimates.statusBadge} ({capacityEstimates.usagePercent}% Allocated)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${capacityEstimates.statusColor} transition-all duration-500`}
                    style={{ width: `${Math.min(100, capacityEstimates.usagePercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Est. DB Space: ~{capacityEstimates.totalDbGb} GB / {selectedDatabaseGb} GB</span>
                  <span>Est. Annual Bills: ~{capacityEstimates.estimatedBillsPerYear.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Sticky Configuration Summary (4 Cols) */}
          <div className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Dynamic Solution Summary</h4>
                    <span className="text-[10px] text-slate-400">Live Itemized Estimator</span>
                  </div>
                </div>

                {/* Reset */}
                <button
                  onClick={() => {
                    setSelectedProductCodes(["POS-BILLING", "GST-BILLING"]);
                    setSelectedAddonIds([]);
                    setSelectedDatabaseGb(5);
                  }}
                  className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  title="Reset configuration"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Selected Software Items List */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Included Software ({pricingSummary.selectedProductsList.length}):
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {pricingSummary.selectedProductsList.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/60"
                    >
                      <div className="truncate pr-2">
                        <span className="font-bold block truncate">{p.name}</span>
                        <span className="text-[10px] text-slate-400">{p.code}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-sky-300">
                          {p.isPriceOnRequest ? "On Request" : formatCurrency(p.basePrice)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProduct(p.code);
                          }}
                          className="ml-2 text-slate-400 hover:text-rose-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Business Features Added */}
              {customFeatures.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Custom Features Added ({customFeatures.length}):
                  </span>
                  <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                    {customFeatures.map((cf) => (
                      <div
                        key={cf.id}
                        className="flex items-center justify-between p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px]"
                      >
                        <span className="truncate pr-1 text-amber-200">✨ {cf.text}</span>
                        <button
                          type="button"
                          onClick={() => setCustomFeatures((prev) => prev.filter((item) => item.id !== cf.id))}
                          className="text-amber-400 hover:text-white shrink-0 font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Database & Tenure Subscription Switcher */}
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/70 space-y-3 text-xs">
                {/* Database Selector Dropdown */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Database Storage Tier:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {isCustomDatabase ? `${customDatabaseGb} GB (Custom)` : selectedDatabaseGb === 0 ? "Self-Hosted" : `${selectedDatabaseGb} GB NVMe`}
                    </span>
                  </div>
                  <select
                    value={isCustomDatabase ? "CUSTOM" : selectedDatabaseGb}
                    onChange={(e) => {
                      if (e.target.value === "CUSTOM") {
                        setIsCustomDatabase(true);
                      } else {
                        setIsCustomDatabase(false);
                        setSelectedDatabaseGb(Number(e.target.value));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {databasePlans.map((p) => (
                      <option key={p.id} value={p.sizeGb}>
                        {p.sizeGb === 0
                          ? "Customer's Own Server / DB (₹0/yr)"
                          : `${p.sizeGb} GB Cloud NVMe - ${formatCurrency(p.annualPrice)}/yr`}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Custom Storage Size ({customDatabaseGb} GB)</option>
                  </select>
                </div>

                {/* Tenure Switcher: 1 Year / 3 Years (15% Off) / 5 Years (25% Off) / Monthly */}
                <div className="pt-2 border-t border-slate-700/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Subscription Tenure:</span>
                    <span className="text-[10px] font-bold text-sky-400">
                      {selectedTenure === "3_YEARS" ? "15% Savings" : selectedTenure === "5_YEARS" ? "25% Savings" : "Standard"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedTenure("1_YEAR")}
                      className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
                        selectedTenure === "1_YEAR"
                          ? "bg-sky-600 border-sky-500 text-white shadow-xs"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      1 Year (Annual)
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTenure("3_YEARS")}
                      className={`py-1.5 px-2 rounded-xl border transition-all text-center relative ${
                        selectedTenure === "3_YEARS"
                          ? "bg-sky-600 border-sky-500 text-white shadow-xs"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span>3 Years</span>
                      <span className="ml-1 text-[9px] px-1 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black">
                        -15%
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTenure("5_YEARS")}
                      className={`py-1.5 px-2 rounded-xl border transition-all text-center relative ${
                        selectedTenure === "5_YEARS"
                          ? "bg-sky-600 border-sky-500 text-white shadow-xs"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      <span>5 Years</span>
                      <span className="ml-1 text-[9px] px-1 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black">
                        -25%
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTenure("MONTHLY")}
                      className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
                        selectedTenure === "MONTHLY"
                          ? "bg-sky-600 border-sky-500 text-white shadow-xs"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                </div>
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Software Base Cost:</span>
                  <span className="font-mono text-white">{formatCurrency(pricingSummary.oneTimeSubtotal)}</span>
                </div>

                {pricingSummary.bundleDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-semibold">
                    <span>Multi-Software Bundle Discount:</span>
                    <span className="font-mono">-{formatCurrency(pricingSummary.bundleDiscount)}</span>
                  </div>
                )}

                {pricingSummary.tenureSavings > 0 && (
                  <div className="flex items-center justify-between text-amber-300 font-semibold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 text-[11px]">
                    <span>Tenure Discount Savings ({pricingSummary.tenureMultiplier} Yrs):</span>
                    <span className="font-mono">-{formatCurrency(pricingSummary.tenureSavings)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-400">
                  <span>
                    {selectedTenure === "MONTHLY"
                      ? "Monthly Cloud Infrastructure:"
                      : `Cloud Infrastructure (${pricingSummary.tenureMultiplier} Yr${pricingSummary.tenureMultiplier > 1 ? "s" : ""}):`}
                  </span>
                  <span className="font-mono text-white">
                    {formatCurrency(pricingSummary.chosenRecurring)}
                    <span className="text-[10px] text-slate-400 ml-1">
                      {selectedTenure === "MONTHLY" ? "/mo" : `(${pricingSummary.tenureMultiplier} Yr)`}
                    </span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>GST Applicable (18%):</span>
                  <span className="font-mono text-white">{formatCurrency(pricingSummary.taxAmount)}</span>
                </div>

                <div className="pt-3 border-t border-slate-700 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">Estimated Investment</span>
                    <span className="text-[10px] text-slate-500">
                      {pricingSummary.tenureLabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 font-mono">
                      {pricingSummary.hasCustomPrice ? "Custom Quote" : formatCurrency(pricingSummary.grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setActiveTab("QUOTATION")}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-[0.98] cursor-pointer"
                >
                  <span>Submit for Official Quotation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20configured%20a%20solution%20package%20(${pricingSummary.selectedProductsList
                    .map((p) => p.name)
                    .join(", ")}%20+%20${selectedDatabaseGb}GB%20DB)%20on%20your%20website.%20Please%20share%20the%20official%20quote.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400" />
                  <span>Consult Architect on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: SOFTWARE CATALOG (EXPLORATION & CARDS)
      ========================================================================= */}
      {activeTab === "CATALOG" && (
        <div className="space-y-6">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search software catalog (e.g. POS, ERP, Mobile, Pharmacy)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All Software" },
                { id: "BUSINESS_MANAGEMENT", label: "Business & ERP" },
                { id: "INDUSTRY_SPECIFIC", label: "Industry Solutions" },
                { id: "WEBSITE_DEV", label: "Website Dev" },
                { id: "APP_DEV", label: "Mobile Apps" },
                { id: "INFRASTRUCTURE", label: "Cloud & DevOps" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    categoryFilter === c.id
                      ? "bg-slate-950 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((prod) => {
              const isSelected = selectedProductCodes.includes(prod.code);
              const features = parseJsonArray(prod.keyFeatures);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:border-sky-300 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Header with image/cover - Compact Modern Aspect */}
                    {prod.imageUrl && (
                      <div className="relative h-28 sm:h-32 w-full bg-slate-900 overflow-hidden">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-sky-300 border border-slate-700">
                            {prod.category}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-4 sm:p-5 space-y-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block">{prod.code}</span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">{prod.name}</h3>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {prod.shortDescription}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-1 pt-1.5 border-t border-slate-100 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Core Features:
                        </span>
                        {features.slice(0, 2).map((f, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight truncate">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Tag */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">One-Time License</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {prod.isPriceOnRequest ? "Custom Quote" : formatCurrency(prod.basePrice)}
                          </span>
                        </div>
                        {prod.recurringPrice > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">SLA / Cloud</span>
                            <span className="font-semibold text-slate-700 text-xs">
                              +{formatCurrency(prod.recurringPrice)}/{prod.recurringInterval === "MONTHLY" ? "mo" : "yr"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!selectedProductCodes.includes(prod.code)) {
                          toggleProduct(prod.code);
                        }
                        setExpandedProductCode(prod.code);
                        setActiveTab("BUILDER");
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-slate-950 hover:bg-slate-800 text-white shadow-xs"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Configured (Customize)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Customize & Add</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: READY-MADE PACKAGES (TEMPLATES WITH 1-CLICK CUSTOMIZE)
      ========================================================================= */}
      {activeTab === "PACKAGES" && (
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              READY-TO-DEPLOY TURNKEY SUITES
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950">
              Curated Software Bundles & Pre-Configured Packages
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Every package is a fully customizable starting point. Click &ldquo;Customize This Package&rdquo; to modify modules, storage, and add-ons.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => {
              const features = parseJsonArray(pkg.includedFeatures);

              return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl bg-white p-6 sm:p-8 border-2 flex flex-col justify-between relative transition-all ${
                    pkg.isFeatured
                      ? "border-sky-500 shadow-xl ring-2 ring-sky-500/20"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-sky-600 to-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {pkg.badge}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{pkg.name}</h3>
                      <p className="text-xs text-sky-700 font-semibold mt-0.5">{pkg.tagline}</p>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="py-4 border-t border-b border-slate-100 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">Base Investment:</span>
                        <span className="text-2xl font-black text-slate-900 font-mono">
                          {formatCurrency(pkg.basePrice)}
                        </span>
                      </div>
                      {pkg.discountAmount > 0 && (
                        <div className="flex items-center justify-between text-xs text-emerald-600 font-bold">
                          <span>Bundle Discount:</span>
                          <span>-{formatCurrency(pkg.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t">
                        <span>Recurring Infrastructure:</span>
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(pkg.recurringPrice)}/year
                        </span>
                      </div>
                    </div>

                    {/* Inclusions */}
                    <div className="space-y-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included Suite Specifications:
                      </span>
                      {features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 space-y-2">
                    <button
                      onClick={() => customizePackage(pkg)}
                      className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Customize This Package</span>
                    </button>

                    <button
                      onClick={() => {
                        customizePackage(pkg);
                        setActiveTab("QUOTATION");
                      }}
                      className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center block transition-colors"
                    >
                      Instant Quote for {pkg.name}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 4: DATABASE & SMART CAPACITY ESTIMATOR
      ========================================================================= */}
      {activeTab === "DATABASE" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Estimator Sliders (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                SMART DATABASE CAPACITY ESTIMATOR
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                Configure Your Estimated Business Scale
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Adjust your expected transaction volume to calculate precise database consumption, image CDN offload, and multi-year storage utilization.
              </p>
            </div>

            {/* Interactive Sliders */}
            <div className="space-y-5 text-xs">
              {/* Products Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Total Products / SKUs:</label>
                  <span className="font-mono font-black text-sky-600 text-sm">
                    {estProductsCount.toLocaleString("en-IN")} SKUs
                  </span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="50000"
                  step="200"
                  value={estProductsCount}
                  onChange={(e) => setEstProductsCount(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>200 SKUs</span>
                  <span>10,000 SKUs</span>
                  <span>50,000+ SKUs</span>
                </div>
              </div>

              {/* Bills per Day Slider */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Daily Billing Volume:</label>
                  <span className="font-mono font-black text-sky-600 text-sm">
                    {estBillsPerDay} Invoices / Day
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={estBillsPerDay}
                  onChange={(e) => setEstBillsPerDay(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>5 / day (1,800/yr)</span>
                  <span>100 / day (36,500/yr)</span>
                  <span>500+ / day (180,000/yr)</span>
                </div>
              </div>

              {/* Customers Count */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Registered Customer Accounts:</label>
                  <span className="font-mono font-black text-sky-600 text-sm">
                    {estCustomersCount.toLocaleString("en-IN")} Clients
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={estCustomersCount}
                  onChange={(e) => setEstCustomersCount(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>

              {/* Images per Product */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Product Images per SKU:</label>
                  <span className="font-mono font-black text-sky-600 text-sm">
                    {estImagesPerProduct} Images each (~300 KB each)
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 5, 8].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEstImagesPerProduct(num)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        estImagesPerProduct === num
                          ? "bg-sky-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {num} {num === 1 ? "Image" : "Images"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Architecture Disclosure Callout */}
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs text-sky-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Modern Cloud Storage Architecture Note:</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                {capacityEstimates.rule.externalStorageNotice}
              </p>
            </div>
          </div>

          {/* Right: Real-time Visual Capacity Gauge & Recommended Plan (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 sticky top-24">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Calculated Capacity Gauge</h3>
                    <span className="text-[10px] text-slate-400">Database Tier: {selectedDatabaseGb} GB</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${capacityEstimates.statusBorder}`}>
                  {capacityEstimates.statusBadge}
                </span>
              </div>

              {/* Big Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Storage Utilization:</span>
                  <span className="font-mono text-sm">{capacityEstimates.usagePercent}%</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className={`h-full ${capacityEstimates.statusColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, capacityEstimates.usagePercent)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">{capacityEstimates.statusText}</p>
              </div>

              {/* Data Breakdown Table */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Relational Database Data:</span>
                  <span className="font-mono font-bold text-slate-900">~{capacityEstimates.totalDbGb} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Annual Invoices:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {capacityEstimates.estimatedBillsPerYear.toLocaleString("en-IN")} bills
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">External Image CDN Storage:</span>
                  <span className="font-mono font-bold text-slate-900">~{capacityEstimates.totalImageGb} GB</span>
                </div>
                <div className="flex justify-between pt-1 border-t text-slate-700">
                  <span>Remaining Safety Headroom:</span>
                  <span className="font-mono font-black text-emerald-600">~{capacityEstimates.remainingGb} GB</span>
                </div>
              </div>

              {/* Change Tier Directly */}
              <div className="space-y-2 pt-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Switch Database Plan:
                </label>
                <select
                  value={isCustomDatabase ? "CUSTOM" : selectedDatabaseGb}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") {
                      setIsCustomDatabase(true);
                    } else {
                      setIsCustomDatabase(false);
                      setSelectedDatabaseGb(Number(e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {databasePlans.map((p) => (
                    <option key={p.id} value={p.sizeGb}>
                      {p.sizeGb === 0
                        ? "Customer's Own Database / Server (BYO - ₹0/yr)"
                        : `${p.sizeGb} GB - ${formatCurrency(p.annualPrice)}/yr (${p.label})`}
                    </option>
                  ))}
                  <option value="CUSTOM">+ Custom Storage ({customDatabaseGb} GB)</option>
                </select>
              </div>

              <button
                onClick={() => setActiveTab("BUILDER")}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Apply & Return to Configurator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 5: CUSTOM WEBSITE CONFIGURATOR (DYNAMIC PAGE-WISE CALCULATOR)
      ========================================================================= */}
      {activeTab === "WEBSITE" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              PAGE-BY-PAGE WEBSITE CALCULATOR
            </span>
            <h2 className="text-2xl font-black text-slate-950">
              Configure Your Custom Business Website
            </h2>
            <p className="text-xs text-slate-500">
              Transparent page-by-page pricing: ₹2,999 for first 3 pages + ₹499 per additional page. Includes fast NVMe cloud hosting & SSL.
            </p>
          </div>

          <div className="space-y-6 text-xs">
            {/* Website Type */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Select Website Category:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  "Corporate Business",
                  "Retail & Shop Showcase",
                  "Doctor / Clinic Portfolio",
                  "Hotel / Restaurant Website",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setWebsiteType(type)}
                    className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                      websiteType === type
                        ? "border-sky-600 bg-sky-50/50 text-sky-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Pages Slider & Price Display */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50/30 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-900 text-sm block">Number of Custom Pages:</label>
                  <span className="text-[11px] text-slate-500">
                    Base ₹2,999 for up to 3 pages (+ ₹499 per extra page)
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-sky-600 text-xl block">{websitePagesCount} Pages</span>
                  <span className="text-[11px] font-bold text-slate-600">
                    Pages Cost: {formatCurrency(2999 + Math.max(0, websitePagesCount - 3) * 499)}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={websitePagesCount}
                onChange={(e) => setWebsitePagesCount(Number(e.target.value))}
                className="w-full accent-sky-600"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>1 Page (Landing: ₹2,999)</span>
                <span>5 Pages (Business: ₹3,997)</span>
                <span>10 Pages (Corporate: ₹6,492)</span>
                <span>20+ Pages (Portal)</span>
              </div>
            </div>

            {/* Optional Website Features & Add-ons */}
            <div className="space-y-2.5">
              <label className="block font-bold text-slate-800">Select Website Add-ons & Integrations:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: "whatsapp-widget", name: "WhatsApp Direct Floating Chat & Lead Bot", price: 499 },
                  { id: "local-seo", name: "Google Maps & Local Search SEO Setup", price: 999 },
                  { id: "payment-gateway", name: "Online Payment Gateway (UPI QR / Razorpay)", price: 1499 },
                  { id: "cms-admin", name: "Admin CMS Panel to Edit Text & Photos Yourself", price: 1999 },
                  { id: "domain-in", name: "1-Year .in Domain Registration & DNS Setup", price: 799 },
                ].map((addon) => {
                  const isChecked = webAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleWebAddon(addon.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? "border-sky-500 bg-sky-50/50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded text-sky-600"
                        />
                        <span className="font-semibold text-slate-800 text-[11px]">{addon.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 shrink-0 text-xs">
                        +{formatCurrency(addon.price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculated Total Banner & Add to Solution Action */}
            <div className="p-5 rounded-2xl bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                  CALCULATED WEBSITE INVESTMENT
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-sky-400 font-mono">
                    {formatCurrency(calculatedWebsitePrice)}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    ({websitePagesCount} Pages + {webAddons.length} Addons)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedProductCodes.includes("WEBSITE-PAGEWISE")) {
                      setSelectedProductCodes([...selectedProductCodes, "WEBSITE-PAGEWISE"]);
                    }
                    setActiveTab("BUILDER");
                  }}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedProductCodes.includes("WEBSITE-PAGEWISE")
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/30"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedProductCodes.includes("WEBSITE-PAGEWISE")
                      ? "Website Added to Solution (Update)"
                      : "Add Custom Website to Solution"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: PACKAGE COMPARISON TABLE (REALISTIC SMB TIERS)
      ========================================================================= */}
      {activeTab === "COMPARISON" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-slate-900">Side-by-Side Solution Comparison</h3>
            <p className="text-xs text-slate-500">Compare inclusions across our turnkey retail and business packages.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-4 px-6">Criteria / Capabilities</th>
                  <th className="py-4 px-6 text-slate-900 font-black text-sm">Starter Retail</th>
                  <th className="py-4 px-6 text-sky-600 font-black text-sm bg-sky-50/50">Retail Pro + Showcasing</th>
                  <th className="py-4 px-6 text-slate-900 font-black text-sm">Complete All-in-One Multi-Store</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Annual Investment</td>
                  <td className="py-3.5 px-6 font-mono font-bold">₹5,999 / yr</td>
                  <td className="py-3.5 px-6 font-mono font-black text-sky-600 bg-sky-50/30 text-base">₹14,999 / yr</td>
                  <td className="py-3.5 px-6 font-mono font-bold">₹19,999 / yr</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Included Cloud Database</td>
                  <td className="py-3.5 px-6">2 GB NVMe Included</td>
                  <td className="py-3.5 px-6 font-bold text-sky-700 bg-sky-50/30">15 GB NVMe Included</td>
                  <td className="py-3.5 px-6 font-bold">25 GB Enterprise NVMe</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">POS & Thermal Slip Billing</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Included (1 Counter)</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold bg-sky-50/30">✓ Multi-Counter (Up to 5)</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Up to 10 Counters</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Stock & Inventory Management</td>
                  <td className="py-3.5 px-6 text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold bg-sky-50/30">✓ Barcode Labels & Low-Stock Alerts</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Multi-Warehouse Sync</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Online Product Showcasing</td>
                  <td className="py-3.5 px-6 text-slate-400">—</td>
                  <td className="py-3.5 px-6 bg-sky-50/30 font-bold text-emerald-600">✓ Digital Catalog & WhatsApp Orders</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Catalog + E-Commerce Link</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Udhar Khata & WhatsApp Reminders</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold bg-sky-50/30">✓ Automated तकादा with UPI QR</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Vendor + Customer Ledger</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">WhatsApp Marketing & Broadcast</td>
                  <td className="py-3.5 px-6 text-slate-400">Optional</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-sky-50/30">✓ E-Receipts & Alerts</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Festival Bulk Broadcasts</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-800">Action</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => customizePackage(packages.find((p) => p.slug === "starter-retail-billing") || packages[1])}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-slate-100"
                    >
                      Select Starter
                    </button>
                  </td>
                  <td className="py-4 px-6 bg-sky-50/30">
                    <button
                      onClick={() => customizePackage(packages.find((p) => p.slug === "retail-pro-15gb") || packages[0])}
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-xs hover:bg-sky-700"
                    >
                      Select Retail Pro (₹14,999)
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => customizePackage(packages.find((p) => p.slug === "complete-retail-allinone") || packages[2])}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-slate-100"
                    >
                      Select All-in-One
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 7: OFFICIAL QUOTATION REVIEW & SUBMISSION
      ========================================================================= */}
      {activeTab === "QUOTATION" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
          {submittedQuoteNumber ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-600 uppercase tracking-widest block">
                REFERENCE #{submittedQuoteNumber}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Quotation Request Logged Successfully!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you! Our enterprise solution architects have received your customized package specifications. You will receive an official technical roadmap and quotation within 24 hours.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/919876543210?text=Hello%20ABECSA!%20I%20just%20submitted%20package%20quotation%20request%20%23${submittedQuoteNumber}.%20Please%20verify%20with%20me.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Verify Directly on WhatsApp</span>
                </a>

                <button
                  onClick={() => {
                    setSubmittedQuoteNumber(null);
                    setActiveTab("BUILDER");
                  }}
                  className="px-5 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                >
                  Configure Another Package
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between border-b pb-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
                    FINAL STEP • QUOTATION SPECIFICATIONS
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Review Configuration & Request Quotation
                  </h2>
                  <p className="text-xs text-slate-500">
                    Submit your itemized package configuration to receive an official formal proposal with terms and SLA.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Estimated Total</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {pricingSummary.hasCustomPrice ? "Custom Quote" : formatCurrency(pricingSummary.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Inclusions summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Configured Software Modules:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {pricingSummary.selectedProductsList.map((p) => (
                    <div key={p.id} className="flex items-center gap-1.5 text-slate-700 font-semibold">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{p.name} ({p.code})</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t text-slate-600 flex flex-wrap justify-between gap-2">
                  <span>Selected Database: <strong>{pricingSummary.effectiveGb === 0 ? "Customer's Own Database / Server (BYO - ₹0)" : `${pricingSummary.effectiveGb} GB Managed Cloud NVMe`}</strong></span>
                  <span>Subscription Tenure: <strong>{pricingSummary.tenureLabel}</strong></span>
                </div>
              </div>

              {/* Customer Contact Form */}
              <form onSubmit={handleSubmitQuotation} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Sharma"
                      value={quoteForm.customerName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Business / Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma Retail Pvt Ltd"
                      value={quoteForm.businessName}
                      onChange={(e) => setQuoteForm({ ...quoteForm, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@sharmaretail.com"
                      value={quoteForm.email}
                      onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Mobile Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98765 43210"
                      value={quoteForm.phone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Bengaluru, Delhi NCR"
                      value={quoteForm.city}
                      onChange={(e) => setQuoteForm({ ...quoteForm, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Preferred Communication</label>
                    <select
                      value={quoteForm.preferredContact}
                      onChange={(e) => setQuoteForm({ ...quoteForm, preferredContact: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="WHATSAPP">WhatsApp Message & PDF</option>
                      <option value="EMAIL">Official Corporate Email</option>
                      <option value="PHONE">Direct Architecture Phone Call</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={submittingQuote}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 active:scale-[0.98] cursor-pointer"
                  >
                    <span>{submittingQuote ? "Submitting..." : "Generate & Submit Quotation Request"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <span className="text-[11px] text-slate-400 text-center">
                    🔒 No obligation estimate • 24h technical proposal turnaround
                  </span>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MOBILE STICKY CONFIGURATION DRAWER (Visible on mobile screens)
      ========================================================================= */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-2xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="truncate pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-semibold truncate">
              {pricingSummary.selectedProductsList.length} Apps • {pricingSummary.effectiveGb === 0 ? "Own DB" : `${pricingSummary.effectiveGb}GB`}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-sky-900 text-sky-200">
              {selectedTenure === "3_YEARS" ? "3 Yrs (-15%)" : selectedTenure === "5_YEARS" ? "5 Yrs (-25%)" : "1 Yr"}
            </span>
          </div>
          <span className="text-base font-black text-sky-400 font-mono block">
            {pricingSummary.hasCustomPrice ? "Custom Quote" : formatCurrency(pricingSummary.grandTotal)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab("BUILDER")}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold"
          >
            Config
          </button>
          <button
            onClick={() => setActiveTab("QUOTATION")}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[11px] font-bold shadow-md shadow-sky-500/20"
          >
            Get Quote
          </button>
        </div>
      </div>
    </div>
  );
}
