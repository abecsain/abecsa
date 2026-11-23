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

  // Selected Software in Configuration Builder
  const [selectedProductCodes, setSelectedProductCodes] = useState<string[]>(["POS-BILLING", "GST-BILLING", "INVENTORY-MGMT"]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedDatabaseGb, setSelectedDatabaseGb] = useState<number>(5);
  const [recurringBillingCycle, setRecurringBillingCycle] = useState<"MONTHLY" | "ANNUALLY">("ANNUALLY");

  // Mobile Bottom Drawer State
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Estimator Slider States
  const [estProductsCount, setEstProductsCount] = useState(2500);
  const [estImagesPerProduct, setEstImagesPerProduct] = useState(2);
  const [estBillsPerDay, setEstBillsPerDay] = useState(40);
  const [estCustomersCount, setEstCustomersCount] = useState(3000);

  // Website Configurator State
  const [websiteType, setWebsiteType] = useState("Corporate Business");
  const [websitePagesCount, setWebsitePagesCount] = useState(6);
  const [webFeatures, setWebFeatures] = useState<string[]>([
    "Mobile Responsive Design",
    "On-Page Technical SEO",
    "WhatsApp Lead Widget",
    "Contact & Inquiry Forms",
  ]);
  const [webHostingChoice, setWebHostingChoice] = useState("ABECSA Managed Edge Cloud");
  const [webDomainChoice, setWebDomainChoice] = useState("New .com / .in Domain");

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

  // Load a Pre-Made Package into the Configuration Builder
  const customizePackage = (pkg: CatalogPackage) => {
    const includedCodes = parseJsonArray(pkg.includedProductCodes);
    setSelectedProductCodes(includedCodes);
    if (pkg.databaseTier) {
      const match = pkg.databaseTier.match(/\d+/);
      if (match) setSelectedDatabaseGb(Number(match[0]));
    }
    setActiveTab("BUILDER");
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // Dynamic Pricing Calculations
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
          // If this addon shares a module that's already applied, discount it
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

    // Database Tier Cost
    const selectedDbPlan = databasePlans.find((p) => p.sizeGb === selectedDatabaseGb);
    let dbMonthly = 0;
    let dbAnnual = 0;
    if (selectedDbPlan) {
      dbMonthly = selectedDbPlan.monthlyPrice;
      dbAnnual = selectedDbPlan.annualPrice || selectedDbPlan.monthlyPrice * 10; // 2 months free annual
      if (recurringBillingCycle === "ANNUALLY") {
        recurringAnnualSubtotal += dbAnnual;
        recurringMonthlySubtotal += Math.round(dbAnnual / 12);
      } else {
        recurringMonthlySubtotal += dbMonthly;
        recurringAnnualSubtotal += dbMonthly * 12;
      }
    }

    // Multi-Product Bundle Discount: 10% for 2 products, 15% for 3+ products
    let bundleDiscount = 0;
    if (selectedProductsList.length >= 3) {
      bundleDiscount = Math.round(oneTimeSubtotal * 0.15);
    } else if (selectedProductsList.length === 2) {
      bundleDiscount = Math.round(oneTimeSubtotal * 0.1);
    }

    const netOneTime = Math.max(0, oneTimeSubtotal - bundleDiscount);
    const chosenRecurring = recurringBillingCycle === "ANNUALLY" ? recurringAnnualSubtotal : recurringMonthlySubtotal;

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
      taxAmount,
      grandTotal,
      hasCustomPrice,
      selectedDbPlan,
    };
  }, [
    products,
    selectedProductCodes,
    selectedAddonIds,
    selectedDatabaseGb,
    databasePlans,
    recurringBillingCycle,
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
          basePrice: p.basePrice,
          recurringPrice: p.recurringPrice,
        })),
        selectedDatabaseTier: `${selectedDatabaseGb} GB Storage Tier`,
        websiteRequirements: activeTab === "WEBSITE" ? { websiteType, websitePagesCount, webFeatures, webHostingChoice, webDomainChoice } : null,
        oneTimeTotal: pricingSummary.netOneTime,
        recurringTotal: pricingSummary.chosenRecurring,
        recurringInterval: recurringBillingCycle,
        discountTotal: pricingSummary.bundleDiscount,
        taxAmount: pricingSummary.taxAmount,
        grandTotal: pricingSummary.grandTotal,
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
            {/* Step 1: Select Software Products */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                    STEP 1 OF 3 • SELECT CORE SOFTWARE MODULES
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    Select Your Business Software Applications
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Combine multiple compatible software products into one integrated system. Shared modules are automatically deduplicated.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-700 block">Selected:</span>
                  <span className="text-lg font-black text-sky-600">
                    {selectedProductCodes.length} Software
                  </span>
                </div>
              </div>

              {/* Products Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {products.map((prod) => {
                  const isSelected = selectedProductCodes.includes(prod.code);
                  const features = parseJsonArray(prod.keyFeatures);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleProduct(prod.code)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        isSelected
                          ? "border-sky-600 bg-sky-50/40 shadow-sm ring-1 ring-sky-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                            {prod.code}
                          </span>
                          <div
                            className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-sky-600 border-sky-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {prod.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {prod.shortDescription}
                          </p>
                        </div>

                        {/* Top Features bullets */}
                        <div className="space-y-1 pt-1 text-[11px] text-slate-600">
                          {features.slice(0, 2).map((f, i) => (
                            <div key={i} className="flex items-center gap-1.5 truncate">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Base Price</span>
                          <span className="font-extrabold text-slate-900">
                            {prod.isPriceOnRequest ? "On Request" : formatCurrency(prod.basePrice)}
                          </span>
                        </div>
                        {prod.recurringPrice > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Recurring</span>
                            <span className="font-bold text-slate-600 text-[11px]">
                              +{formatCurrency(prod.recurringPrice)}/mo
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Database Capacity & Tier Selection */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                    STEP 2 OF 3 • SELECT MANAGED DATABASE CAPACITY
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                    Database Storage & High-Speed Cloud Engine
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Select the database plan matching your business transaction velocity. Automatic daily cloud backups included.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("DATABASE")}
                  className="px-3 py-1.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <Sliders className="w-3 h-3 text-sky-600" />
                  <span>Open Estimator</span>
                </button>
              </div>

              {/* Database Tiers Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {databasePlans.map((plan) => {
                  const isSelected = selectedDatabaseGb === plan.sizeGb;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedDatabaseGb(plan.sizeGb)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-sky-600 bg-sky-50/50 shadow-xs ring-1 ring-sky-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base font-black text-slate-900 font-mono">
                          {plan.sizeGb} GB
                        </span>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-sky-700">
                        {formatCurrency(recurringBillingCycle === "ANNUALLY" ? plan.annualPrice : plan.monthlyPrice)}
                        <span className="text-[10px] text-slate-400 font-normal">
                          /{recurringBillingCycle === "ANNUALLY" ? "yr" : "mo"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 line-clamp-1 mt-1 block">
                        {plan.recommendedBusinessSize || "General"}
                      </span>
                    </button>
                  );
                })}
              </div>

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

            {/* Step 3: Optional Features & Add-ons */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-sky-600 block">
                  STEP 3 OF 3 • OPTIONAL EXTENSIONS & HARDWARE PLUGINS
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                  Enhance with Optional Features
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Add specialized hardware connectors, automated WhatsApp sync, or mobile apps.
                </p>
              </div>

              <div className="space-y-2">
                {pricingSummary.selectedProductsList.flatMap((p) => {
                  const addons = parseJsonArray(p.configurableAddons);
                  return addons.map((addon: any) => {
                    const isChecked = selectedAddonIds.includes(addon.id);
                    return (
                      <div
                        key={addon.id}
                        onClick={() => toggleAddon(addon.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isChecked
                            ? "border-sky-500 bg-sky-50/30"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="h-4 w-4 rounded text-sky-600"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              {addon.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Linked with {p.name}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">
                            +{formatCurrency(addon.price)}
                          </span>
                          {addon.recurringPrice > 0 && (
                            <span className="text-[10px] text-slate-400">
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

              {/* Database & Recurring Cycle Switcher */}
              <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database Storage:</span>
                  <span className="font-bold text-amber-400 font-mono">{selectedDatabaseGb} GB Cloud NVMe</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Billing Cycle:</span>
                  <div className="flex gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setRecurringBillingCycle("MONTHLY")}
                      className={`px-2 py-0.5 rounded-md ${
                        recurringBillingCycle === "MONTHLY" ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecurringBillingCycle("ANNUALLY")}
                      className={`px-2 py-0.5 rounded-md ${
                        recurringBillingCycle === "ANNUALLY" ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      Annual (Save 15%)
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

                <div className="flex items-center justify-between text-slate-400">
                  <span>Recurring Infrastructure:</span>
                  <span className="font-mono text-white">
                    {formatCurrency(pricingSummary.chosenRecurring)}/{recurringBillingCycle === "ANNUALLY" ? "yr" : "mo"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>GST Applicable (18%):</span>
                  <span className="font-mono text-white">{formatCurrency(pricingSummary.taxAmount)}</span>
                </div>

                <div className="pt-3 border-t border-slate-700 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">Estimated Investment</span>
                    <span className="text-[10px] text-slate-500">Official quotation on submission</span>
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
                    {/* Header with image/cover */}
                    {prod.imageUrl && (
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <Image
                          src={prod.imageUrl}
                          alt={prod.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        <div className="absolute top-3 left-3">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-sky-300 border border-slate-700">
                            {prod.category}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-6 space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold block">{prod.code}</span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{prod.name}</h3>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          {prod.shortDescription}
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Core Features:
                        </span>
                        {features.slice(0, 3).map((f, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-tight">{f}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Tag */}
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
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
                  <div className="p-6 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        toggleProduct(prod.code);
                        setActiveTab("BUILDER");
                      }}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-slate-950 hover:bg-slate-800 text-white shadow-xs"
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Configured (Edit)</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Solution</span>
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
                  value={selectedDatabaseGb}
                  onChange={(e) => setSelectedDatabaseGb(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                >
                  {databasePlans.map((p) => (
                    <option key={p.id} value={p.sizeGb}>
                      {p.sizeGb} GB - {formatCurrency(p.monthlyPrice)}/mo ({p.label})
                    </option>
                  ))}
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
          MODULE 5: CUSTOM WEBSITE CONFIGURATOR
      ========================================================================= */}
      {activeTab === "WEBSITE" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-xs font-black uppercase tracking-widest text-sky-600 block">
              CUSTOM WEBSITE & PORTAL BUILDER
            </span>
            <h2 className="text-2xl font-black text-slate-950">
              Configure Your Custom Web Presence
            </h2>
            <p className="text-xs text-slate-500">
              Select website type, required pages, and integrations for a customized architecture estimate.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            {/* Website Type */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">Select Website Category:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  "Corporate Business",
                  "Foundation / NGO Trust",
                  "E-Commerce Storefront",
                  "Client Web Portal",
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

            {/* Pages Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">Estimated Page Count:</label>
                <span className="font-mono font-black text-sky-600 text-sm">{websitePagesCount} Pages</span>
              </div>
              <input
                type="range"
                min="3"
                max="30"
                value={websitePagesCount}
                onChange={(e) => setWebsitePagesCount(Number(e.target.value))}
                className="w-full accent-sky-600"
              />
            </div>

            {/* Hosting & Domain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Managed Hosting Setup:</label>
                <select
                  value={webHostingChoice}
                  onChange={(e) => setWebHostingChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="ABECSA Managed Edge Cloud">ABECSA Managed Edge Cloud (Vercel / Cloudflare)</option>
                  <option value="Client AWS Account VPC">Client AWS / GCP VPC Deployment</option>
                  <option value="Self-Hosted On-Premise">Self-Hosted On-Premise Server</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Domain Registration:</label>
                <select
                  value={webDomainChoice}
                  onChange={(e) => setWebDomainChoice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="New .com / .in Domain">New .com / .in Domain Registration</option>
                  <option value="Connect Existing Domain">Connect Client&apos;s Existing Domain</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={() => setActiveTab("QUOTATION")}
                className="px-8 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Quotation Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 6: PACKAGE COMPARISON TABLE
      ========================================================================= */}
      {activeTab === "COMPARISON" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b">
            <h3 className="text-lg font-bold text-slate-900">Side-by-Side Suite Comparison</h3>
            <p className="text-xs text-slate-500">Compare inclusions across our flagship package templates.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-4 px-6">Criteria / Capabilities</th>
                  <th className="py-4 px-6 text-slate-900 font-black text-sm">Starter</th>
                  <th className="py-4 px-6 text-sky-600 font-black text-sm bg-sky-50/50">Retail Pro (Popular)</th>
                  <th className="py-4 px-6 text-slate-900 font-black text-sm">Business Complete ERP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">One-Time Base Investment</td>
                  <td className="py-3.5 px-6 font-mono font-bold">₹65,000</td>
                  <td className="py-3.5 px-6 font-mono font-black text-sky-600 bg-sky-50/30">₹1,25,000</td>
                  <td className="py-3.5 px-6 font-mono font-bold">₹2,45,000</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Included DB Storage</td>
                  <td className="py-3.5 px-6">2 GB NVMe</td>
                  <td className="py-3.5 px-6 font-bold text-sky-700 bg-sky-50/30">5 GB NVMe</td>
                  <td className="py-3.5 px-6 font-bold">15 GB High-Concurrency</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">POS & Thermal Billing</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Included</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold bg-sky-50/30">✓ Multi-Counter</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Multi-Branch Consolidated</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">GST E-Way & E-Invoice</td>
                  <td className="py-3.5 px-6 text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold bg-sky-50/30">✓ Full GSTIN Filing</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Multi-GSTIN Branches</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">Multi-Warehouse Inventory</td>
                  <td className="py-3.5 px-6 text-slate-400">Single Store</td>
                  <td className="py-3.5 px-6 bg-sky-50/30 font-semibold">Batch & Expiry</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Multi-Warehouse Manifests</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">HR & Staff Payroll</td>
                  <td className="py-3.5 px-6 text-slate-400">—</td>
                  <td className="py-3.5 px-6 bg-sky-50/30 text-slate-400">—</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Biometrics & Salary Slips</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-bold text-slate-800">WhatsApp Sync Engine</td>
                  <td className="py-3.5 px-6 text-slate-400">Optional</td>
                  <td className="py-3.5 px-6 font-bold text-emerald-600 bg-sky-50/30">✓ Included (E-Receipts)</td>
                  <td className="py-3.5 px-6 text-emerald-600 font-bold">✓ Automated Billing & Reminders</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold text-slate-800">Action</td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => customizePackage(packages.find((p) => p.slug === "starter") || packages[0])}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-slate-100"
                    >
                      Select Starter
                    </button>
                  </td>
                  <td className="py-4 px-6 bg-sky-50/30">
                    <button
                      onClick={() => customizePackage(packages.find((p) => p.slug === "retail-pro") || packages[1])}
                      className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold shadow-xs hover:bg-sky-700"
                    >
                      Configure Retail Pro
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => customizePackage(packages.find((p) => p.slug === "business-complete") || packages[2])}
                      className="px-3 py-1.5 rounded-lg border text-xs font-bold hover:bg-slate-100"
                    >
                      Select Complete ERP
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
                <div className="pt-2 border-t text-slate-600 flex justify-between">
                  <span>Selected Database: <strong>{selectedDatabaseGb} GB Managed Cloud Storage</strong></span>
                  <span>Billing Cycle: <strong>{recurringBillingCycle}</strong></span>
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
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950 text-white rounded-2xl p-3 shadow-2xl border border-slate-800 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] text-slate-400 block font-semibold">
            {pricingSummary.selectedProductsList.length} Software Selected
          </span>
          <span className="text-sm font-black text-sky-400 font-mono">
            {pricingSummary.hasCustomPrice ? "Custom Quote" : formatCurrency(pricingSummary.grandTotal)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("BUILDER")}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-[11px] font-bold"
          >
            Config
          </button>
          <button
            onClick={() => setActiveTab("QUOTATION")}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white text-[11px] font-bold shadow-xs"
          >
            Get Quote
          </button>
        </div>
      </div>
    </div>
  );
}
