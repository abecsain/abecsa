"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Database,
  Tag,
  Package,
  FileSpreadsheet,
  Settings,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  AlertCircle,
  Eye,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminSolutionsManagementPage() {
  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "PACKAGES" | "DATABASE" | "ESTIMATOR" | "REQUESTS">("PRODUCTS");
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [databasePlans, setDatabasePlans] = useState<any[]>([]);
  const [estimatorRule, setEstimatorRule] = useState<any | null>(null);
  const [quotationRequests, setQuotationRequests] = useState<any[]>([]);

  // Search
  const [search, setSearch] = useState("");

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({
    code: "",
    name: "",
    category: "BUSINESS_MANAGEMENT",
    shortDescription: "",
    fullDescription: "",
    icon: "Layers",
    basePrice: 45000,
    recurringPrice: 1500,
    recurringInterval: "MONTHLY",
    isPriceOnRequest: false,
    keyFeatures: "",
    suitableFor: "",
    recommendedDatabaseTier: "5 GB",
    deploymentOptions: "Cloud SaaS",
    isFeatured: false,
  });

  // Package Modal
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any | null>(null);
  const [packageForm, setPackageForm] = useState({
    slug: "",
    name: "",
    category: "SOFTWARE",
    tagline: "",
    description: "",
    badge: "Popular Choice",
    basePrice: 95000,
    recurringPrice: 18000,
    recurringInterval: "ANNUALLY",
    discountAmount: 15000,
    includedProductCodes: "",
    includedFeatures: "",
    databaseTier: "5 GB",
    userLimit: "Up to 5 Users",
    productLimit: "5,000 Products",
    supportTier: "Priority WhatsApp & Email",
    isFeatured: true,
  });

  // DB Tier Modal
  const [showDbModal, setShowDbModal] = useState(false);
  const [editingDbPlan, setEditingDbPlan] = useState<any | null>(null);
  const [dbForm, setDbForm] = useState({
    sizeGb: 10,
    label: "10 GB High-Speed NVMe Storage",
    monthlyPrice: 2999,
    annualPrice: 29990,
    storageType: "Managed PostgreSQL / NVMe SSD",
    recommendedBusinessSize: "Retail Stores & Distributors",
    backupInfo: "Automated Daily Cloud Backups + Point-in-Time Recovery",
  });

  // Request Inspection Modal
  const [inspectRequest, setInspectRequest] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, reqRes] = await Promise.all([
        fetch("/api/solutions/catalog"),
        fetch("/api/solutions/quotations"),
      ]);

      const catData = await catRes.json();
      const reqData = await reqRes.json();

      if (catData.products) setProducts(catData.products);
      if (catData.packages) setPackages(catData.packages);
      if (catData.databasePlans) setDatabasePlans(catData.databasePlans);
      if (catData.estimatorRule) setEstimatorRule(catData.estimatorRule);
      if (reqData.requests) setQuotationRequests(reqData.requests);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Product Actions
  const handleOpenProductEdit = (p: any) => {
    setEditingProduct(p);
    let feat = p.keyFeatures;
    try {
      const parsed = JSON.parse(p.keyFeatures);
      if (Array.isArray(parsed)) feat = parsed.join("\n");
    } catch {}

    setProductForm({
      code: p.code,
      name: p.name,
      category: p.category,
      shortDescription: p.shortDescription,
      fullDescription: p.fullDescription || "",
      icon: p.icon || "Layers",
      basePrice: p.basePrice,
      recurringPrice: p.recurringPrice,
      recurringInterval: p.recurringInterval || "MONTHLY",
      isPriceOnRequest: p.isPriceOnRequest,
      keyFeatures: feat,
      suitableFor: p.suitableFor || "",
      recommendedDatabaseTier: p.recommendedDatabaseTier || "5 GB",
      deploymentOptions: p.deploymentOptions || "Cloud SaaS",
      isFeatured: p.isFeatured,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featArr = productForm.keyFeatures.split("\n").map((s) => s.trim()).filter(Boolean);
      const payload = {
        ...productForm,
        keyFeatures: JSON.stringify(featArr),
        id: editingProduct?.id,
      };

      const res = await fetch("/api/solutions/catalog", {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.product) {
          setProducts((prev) => {
            if (editingProduct) {
              return prev.map((item) => (item.id === json.product.id || item.code === json.product.code ? json.product : item));
            } else {
              return [json.product, ...prev];
            }
          });
        }
        setShowProductModal(false);
        setStatusMsg("Product saved successfully!");
        setTimeout(() => setStatusMsg(""), 3000);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save product");
      }
    } catch {
      alert("Error saving product");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Delete product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/solutions/catalog?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMsg("Product deleted.");
        setTimeout(() => setStatusMsg(""), 3000);
        fetchData();
      }
    } catch {
      alert("Error deleting product");
    }
  };

  // Package Actions
  const handleOpenPackageEdit = (pkg: any) => {
    setEditingPackage(pkg);
    let feat = pkg.includedFeatures;
    try {
      const parsed = JSON.parse(pkg.includedFeatures);
      if (Array.isArray(parsed)) feat = parsed.join("\n");
    } catch {}

    let codes = pkg.includedProductCodes;
    try {
      const parsed = JSON.parse(pkg.includedProductCodes);
      if (Array.isArray(parsed)) codes = parsed.join(", ");
    } catch {}

    setPackageForm({
      slug: pkg.slug || "",
      name: pkg.name || "",
      category: pkg.category || "SOFTWARE",
      tagline: pkg.tagline || "",
      description: pkg.description || "",
      badge: pkg.badge || "Popular Choice",
      basePrice: pkg.basePrice || 0,
      recurringPrice: pkg.recurringPrice || 0,
      recurringInterval: pkg.recurringInterval || "ANNUALLY",
      discountAmount: pkg.discountAmount || 0,
      includedProductCodes: codes || "",
      includedFeatures: feat || "",
      databaseTier: pkg.databaseTier || "5 GB",
      userLimit: pkg.userLimit || "Up to 5 Users",
      productLimit: pkg.productLimit || "5,000 Products",
      supportTier: pkg.supportTier || "Priority WhatsApp & Email",
      isFeatured: Boolean(pkg.isFeatured),
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const featArr = packageForm.includedFeatures.split("\n").map((s) => s.trim()).filter(Boolean);
      const codeArr = packageForm.includedProductCodes.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const payload = {
        ...packageForm,
        includedFeatures: JSON.stringify(featArr),
        includedProductCodes: JSON.stringify(codeArr),
        id: editingPackage?.id,
      };

      const res = await fetch("/api/solutions/packages", {
        method: editingPackage ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.package) {
          setPackages((prev) => {
            if (editingPackage) {
              return prev.map((item) => (item.id === json.package.id || item.slug === json.package.slug ? json.package : item));
            } else {
              return [json.package, ...prev];
            }
          });
        }
        setShowPackageModal(false);
        setStatusMsg("Package saved successfully!");
        setTimeout(() => setStatusMsg(""), 3000);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save package");
      }
    } catch {
      alert("Error saving package");
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    if (!confirm(`Delete package "${name}"?`)) return;
    try {
      const res = await fetch(`/api/solutions/packages?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMsg("Package deleted.");
        setTimeout(() => setStatusMsg(""), 3000);
        fetchData();
      }
    } catch {
      alert("Error deleting package");
    }
  };

  // DB Tier Actions
  const handleOpenDbEdit = (plan: any) => {
    setEditingDbPlan(plan);
    setDbForm({
      sizeGb: plan.sizeGb || 10,
      label: plan.label || "",
      monthlyPrice: plan.monthlyPrice || 0,
      annualPrice: plan.annualPrice || 0,
      storageType: plan.storageType || "Managed PostgreSQL / NVMe SSD",
      recommendedBusinessSize: plan.recommendedBusinessSize || "General",
      backupInfo: plan.backupInfo || "Automated Daily Cloud Backups + Point-in-Time Recovery",
    });
    setShowDbModal(true);
  };

  const handleSaveDb = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...dbForm,
        id: editingDbPlan?.id,
      };

      const res = await fetch("/api/solutions/database-plans", {
        method: editingDbPlan ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.plan) {
          setDatabasePlans((prev) => {
            if (editingDbPlan) {
              return prev.map((item) => (item.id === json.plan.id || item.sizeGb === json.plan.sizeGb ? json.plan : item));
            } else {
              return [...prev, json.plan].sort((a, b) => a.sizeGb - b.sizeGb);
            }
          });
        }
        setShowDbModal(false);
        setStatusMsg("Database Tier saved successfully!");
        setTimeout(() => setStatusMsg(""), 3000);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save database tier");
      }
    } catch {
      alert("Error saving database tier");
    }
  };

  const handleDeleteDb = async (id: string, label: string) => {
    if (!confirm(`Delete storage tier "${label}"?`)) return;
    try {
      const res = await fetch(`/api/solutions/database-plans?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setStatusMsg("Database tier deleted.");
        setTimeout(() => setStatusMsg(""), 3000);
        fetchData();
      }
    } catch {
      alert("Error deleting database tier");
    }
  };

  // Save Estimator Rules
  const handleSaveEstimatorRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!estimatorRule) return;
    try {
      const res = await fetch("/api/solutions/database-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ESTIMATOR_RULE",
          ...estimatorRule,
        }),
      });
      if (res.ok) {
        setStatusMsg("Capacity Estimator assumptions updated!");
        setTimeout(() => setStatusMsg(""), 3000);
      }
    } catch {
      alert("Error updating estimator rules");
    }
  };

  // Update Quotation Status
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/solutions/quotations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchData();
        if (inspectRequest && inspectRequest.id === id) {
          setInspectRequest({ ...inspectRequest, status: newStatus });
        }
      }
    } catch {
      alert("Error updating status");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-sky-50 text-sky-600">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Software Solutions, Packages & Dynamic Pricing Hub
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Control the live Software Catalog, Package Builder, Database Capacity Estimator, and Customer Quotation Requests. Live public view at <Link href="/solutions" target="_blank" className="text-sky-600 font-semibold underline">/solutions</Link> and <Link href="/services" target="_blank" className="text-sky-600 font-semibold underline">/services</Link>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/solutions"
            target="_blank"
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <span>Public Configurator</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "PRODUCTS", label: "Catalog Products", count: products.length, icon: Layers },
          { id: "PACKAGES", label: "Ready-Made Packages", count: packages.length, icon: Package },
          { id: "DATABASE", label: "Database Storage Tiers", count: databasePlans.length, icon: Database },
          { id: "ESTIMATOR", label: "Smart Capacity Estimator", icon: Sliders },
          { id: "REQUESTS", label: "Quotation Requests", count: quotationRequests.length, icon: FileSpreadsheet, badge: quotationRequests.filter((r) => r.status === "NEW").length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-slate-950 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && tab.badge > 0 ? (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {tab.badge} New
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB 1: CATALOG PRODUCTS */}
      {activeTab === "PRODUCTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Manage Software Products ({products.length})
            </h3>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  code: "",
                  name: "",
                  category: "BUSINESS_MANAGEMENT",
                  shortDescription: "",
                  fullDescription: "",
                  icon: "Layers",
                  basePrice: 50000,
                  recurringPrice: 1500,
                  recurringInterval: "MONTHLY",
                  isPriceOnRequest: false,
                  keyFeatures: "Instant barcode checkout\nGST Tax Invoices\nReal-time stock sync",
                  suitableFor: "Wholesalers, Retail Stores",
                  recommendedDatabaseTier: "5 GB",
                  deploymentOptions: "Cloud SaaS",
                  isFeatured: false,
                });
                setShowProductModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Catalog Product</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-sky-600 font-bold block">{p.code}</span>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {p.category}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {p.shortDescription}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">One-Time Base</span>
                      <span className="font-extrabold text-slate-900">
                        {p.isPriceOnRequest ? "Price on Request" : formatCurrency(p.basePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Recurring</span>
                      <span className="font-extrabold text-slate-900">
                        {p.recurringPrice > 0 ? `${formatCurrency(p.recurringPrice)}/${p.recurringInterval === "MONTHLY" ? "mo" : "yr"}` : "None"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Rec DB: {p.recommendedDatabaseTier || "5 GB"}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenProductEdit(p)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGES */}
      {activeTab === "PACKAGES" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Ready-Made Bundled Packages ({packages.length})
            </h3>
            <button
              onClick={() => {
                setEditingPackage(null);
                setPackageForm({
                  slug: "",
                  name: "",
                  category: "SOFTWARE",
                  tagline: "",
                  description: "",
                  badge: "Popular Choice",
                  basePrice: 95000,
                  recurringPrice: 18000,
                  recurringInterval: "ANNUALLY",
                  discountAmount: 15000,
                  includedProductCodes: "POS-BILLING, CRM-WHATSAPP",
                  includedFeatures: "Full POS Billing Desk\nWhatsApp Customer Chat\nManaged Database",
                  databaseTier: "5 GB",
                  userLimit: "Up to 5 Users",
                  productLimit: "5,000 Products",
                  supportTier: "Priority WhatsApp & Email",
                  isFeatured: true,
                });
                setShowPackageModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Bundled Package</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-sky-300 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-600 font-bold uppercase">{pkg.slug}</span>
                    {pkg.badge && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {pkg.badge}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{pkg.name}</h4>
                  <p className="text-xs text-slate-500">{pkg.tagline}</p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Base Price:</span>
                      <span className="font-extrabold text-slate-900">{formatCurrency(pkg.basePrice)}</span>
                    </div>
                    {pkg.discountAmount > 0 && (
                      <div className="flex items-center justify-between text-emerald-600 font-semibold">
                        <span>Bundle Discount:</span>
                        <span>-{formatCurrency(pkg.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t text-[11px] text-slate-500">
                      <span>Annual Recurring:</span>
                      <span className="font-bold text-slate-700">{formatCurrency(pkg.recurringPrice)}/yr</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>DB: <strong>{pkg.databaseTier}</strong> • Users: <strong>{pkg.userLimit}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenPackageEdit(pkg)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                      title="Edit Package"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                      title="Delete Package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE STORAGE PLANS */}
      {activeTab === "DATABASE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Database Storage Tiers & Pricing ({databasePlans.length})
            </h3>
            <button
              onClick={() => {
                setEditingDbPlan(null);
                setDbForm({
                  sizeGb: 10,
                  label: "10 GB NVMe Storage Tier",
                  monthlyPrice: 2499,
                  annualPrice: 24990,
                  storageType: "Managed PostgreSQL / NVMe SSD",
                  recommendedBusinessSize: "Growing Retail Stores",
                  backupInfo: "Automated Daily Cloud Backups + Point-in-Time Recovery",
                });
                setShowDbModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Storage Tier</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Size (GB)</th>
                  <th className="py-3 px-4">Tier Label</th>
                  <th className="py-3 px-4">Monthly Price</th>
                  <th className="py-3 px-4">Annual Price</th>
                  <th className="py-3 px-4">Storage Type</th>
                  <th className="py-3 px-4">Target Scale</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {databasePlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{plan.sizeGb} GB</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{plan.label}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatCurrency(plan.monthlyPrice)}/mo</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{formatCurrency(plan.annualPrice)}/yr</td>
                    <td className="py-3 px-4 text-slate-500">{plan.storageType}</td>
                    <td className="py-3 px-4 text-slate-500">{plan.recommendedBusinessSize || "General"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDbEdit(plan)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs"
                          title="Edit Tier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDb(plan.id, plan.label)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SMART CAPACITY ESTIMATOR ASSUMPTIONS */}
      {activeTab === "ESTIMATOR" && estimatorRule && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Smart Database Capacity Estimator Assumptions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              These configurable assumptions determine the dynamic storage calculations, item estimations, and warning threshold indicators (Green/Yellow/Red) shown to clients on the web configurator.
            </p>
          </div>

          <form onSubmit={handleSaveEstimatorRules} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Avg Product Record Size (Bytes)
                </label>
                <input
                  type="number"
                  placeholder="4096"
                  value={estimatorRule.avgProductRecordBytes === 0 ? "" : estimatorRule.avgProductRecordBytes}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setEstimatorRule({ ...estimatorRule, avgProductRecordBytes: val === "" ? 0 : Number(val) });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 4096 (4 KB per SKU)</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Avg Bill / Invoice Record Size (Bytes)
                </label>
                <input
                  type="number"
                  placeholder="3072"
                  value={estimatorRule.avgBillRecordBytes === 0 ? "" : estimatorRule.avgBillRecordBytes}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setEstimatorRule({ ...estimatorRule, avgBillRecordBytes: val === "" ? 0 : Number(val) });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 3072 (3 KB per invoice)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Database Index & Overhead Multiplier
                </label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="1.35"
                  value={estimatorRule.overheadAndIndexFactor === 0 ? "" : estimatorRule.overheadAndIndexFactor}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setEstimatorRule({ ...estimatorRule, overheadAndIndexFactor: val === "" ? 0 : Number(val) });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 1.35 (35% B-tree indexes & WAL)</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Safety Headroom Buffer (%)
                </label>
                <input
                  type="number"
                  placeholder="20"
                  value={estimatorRule.safetyBufferPercent === 0 ? "" : estimatorRule.safetyBufferPercent}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setEstimatorRule({ ...estimatorRule, safetyBufferPercent: val === "" ? 0 : Number(val) });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400">Default: 20% reserved capacity buffer</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                External Image Storage Disclosure Notice
              </label>
              <textarea
                rows={2}
                value={estimatorRule.externalStorageNotice}
                onChange={(e) => setEstimatorRule({ ...estimatorRule, externalStorageNotice: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs"
              >
                Save Capacity Estimator Assumptions
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: QUOTATION REQUESTS */}
      {activeTab === "REQUESTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Inbound Configurator Quotation Requests ({quotationRequests.length})
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Est. Grand Total</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotationRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-sky-600">{req.requestNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {req.customerName}
                      {req.businessName && <span className="block text-[10px] text-slate-400 font-normal">{req.businessName}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{req.phone}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{formatCurrency(req.grandTotal)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(req.createdAt)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={req.status}
                        onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                        className="px-2 py-1 rounded-md text-[10px] font-bold border border-slate-300 bg-white"
                      >
                        <option value="NEW">NEW</option>
                        <option value="REVIEWING">REVIEWING</option>
                        <option value="CONTACTED">CONTACTED</option>
                        <option value="QUOTATION_SENT">QUOTATION SENT</option>
                        <option value="NEGOTIATION">NEGOTIATION</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectRequest(req)}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1. PRODUCT EDIT / ADD MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Software Product"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure code, pricing, database tier, deliverables, and catalog settings.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Product Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={productForm.code}
                    onChange={(e) => setProductForm({ ...productForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ACCOUNTING-UDHAR"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono disabled:bg-slate-100 text-slate-900"
                  />
                  {editingProduct && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Product code cannot be changed once created</span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Product Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Udhar Khata & Accounting App"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Industry / Category *
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                  >
                    <option value="BUSINESS_MANAGEMENT">Business Management & Billing</option>
                    <option value="INDUSTRY_SPECIFIC">Industry Specific (Hospital, Pharmacy, Restaurant)</option>
                    <option value="WEBSITE_DEV">Custom Website Development</option>
                    <option value="APP_DEV">Mobile App & Android Solutions</option>
                    <option value="INFRASTRUCTURE">Cloud & Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Recommended Database Tier
                  </label>
                  <select
                    value={productForm.recommendedDatabaseTier}
                    onChange={(e) => setProductForm({ ...productForm, recommendedDatabaseTier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                  >
                    <option value="1 GB">1 GB (Starter / Web)</option>
                    <option value="2 GB">2 GB (Small Business / Udhar)</option>
                    <option value="5 GB">5 GB (Standard POS / CRM)</option>
                    <option value="10 GB">10 GB (High-Volume Retail)</option>
                    <option value="25 GB">25 GB (Multi-Branch / Enterprise)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Short Description (Card Summary) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  placeholder="Replace paper khata books with digital Udhar passbook, supplier balances, daily expense logs, and WhatsApp reminders..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-900 block">Pricing Structure</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      One-Time Base Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={productForm.isPriceOnRequest}
                      placeholder="0"
                      value={productForm.basePrice === 0 ? "" : productForm.basePrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "");
                        e.target.value = val;
                        setProductForm({ ...productForm, basePrice: val === "" ? 0 : Number(val) });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Recurring Price (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={productForm.recurringPrice === 0 ? "" : productForm.recurringPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "");
                        e.target.value = val;
                        setProductForm({ ...productForm, recurringPrice: val === "" ? 0 : Number(val) });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Recurring Interval
                    </label>
                    <select
                      value={productForm.recurringInterval}
                      onChange={(e) => setProductForm({ ...productForm, recurringInterval: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900"
                    >
                      <option value="MONTHLY">Monthly (/mo)</option>
                      <option value="ANNUALLY">Annually (/yr)</option>
                      <option value="ONE_TIME">None / One-Time</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="prodPriceOnRequest"
                    checked={productForm.isPriceOnRequest}
                    onChange={(e) => setProductForm({ ...productForm, isPriceOnRequest: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="prodPriceOnRequest" className="text-[11px] font-medium text-slate-700 cursor-pointer">
                    Price on Request (displays &quot;Price on Request&quot; on public cards)
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Suitable For (Target Audience)
                  </label>
                  <input
                    type="text"
                    value={productForm.suitableFor}
                    onChange={(e) => setProductForm({ ...productForm, suitableFor: e.target.value })}
                    placeholder="e.g. Retail Stores, Wholesalers, Distributors"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Deployment Mode
                  </label>
                  <input
                    type="text"
                    value={productForm.deploymentOptions}
                    onChange={(e) => setProductForm({ ...productForm, deploymentOptions: e.target.value })}
                    placeholder="e.g. Cloud SaaS, Hybrid, Self-Hosted"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Key Features & Deliverables (One per line)
                </label>
                <textarea
                  rows={4}
                  value={productForm.keyFeatures}
                  onChange={(e) => setProductForm({ ...productForm, keyFeatures: e.target.value })}
                  placeholder="Digital customer Udhar passbook with balance limits&#10;WhatsApp invoice & payment reminder delivery&#10;Daily expense & profit-loss counter ledger"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 font-sans"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prodFeatured"
                  checked={productForm.isFeatured}
                  onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="prodFeatured" className="text-[11px] font-semibold text-slate-800 cursor-pointer">
                  Featured Product (Highlight with badge in Catalog and Estimator)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingProduct ? "Update Product" : "Create Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PACKAGE EDIT / ADD MODAL */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingPackage ? `Edit Bundled Package: ${editingPackage.name}` : "Create New Bundled Package"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure turnkey packages with bundled products, discounts, and database tier.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPackageModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Package Slug (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPackage}
                    value={packageForm.slug}
                    onChange={(e) => setPackageForm({ ...packageForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    placeholder="e.g. startup-pro"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono disabled:bg-slate-100 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    placeholder="e.g. Complete Retail POS & E-Commerce Suite"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={packageForm.tagline}
                    onChange={(e) => setPackageForm({ ...packageForm, tagline: e.target.value })}
                    placeholder="e.g. Best for growing retail stores & multi-counter shops"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    value={packageForm.badge}
                    onChange={(e) => setPackageForm({ ...packageForm, badge: e.target.value })}
                    placeholder="e.g. Popular Choice, Best Value"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-slate-900 block">Package Pricing & Discount</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Base One-Time Price (₹) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="0"
                      value={packageForm.basePrice === 0 ? "" : packageForm.basePrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "");
                        e.target.value = val;
                        setPackageForm({ ...packageForm, basePrice: val === "" ? 0 : Number(val) });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Annual Recurring Fee (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={packageForm.recurringPrice === 0 ? "" : packageForm.recurringPrice}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "");
                        e.target.value = val;
                        setPackageForm({ ...packageForm, recurringPrice: val === "" ? 0 : Number(val) });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      Bundle Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={packageForm.discountAmount === 0 ? "" : packageForm.discountAmount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value.replace(/^0+(?=\d)/, "");
                        e.target.value = val;
                        setPackageForm({ ...packageForm, discountAmount: val === "" ? 0 : Number(val) });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Database Tier
                  </label>
                  <select
                    value={packageForm.databaseTier}
                    onChange={(e) => setPackageForm({ ...packageForm, databaseTier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  >
                    <option value="2 GB">2 GB</option>
                    <option value="5 GB">5 GB</option>
                    <option value="10 GB">10 GB</option>
                    <option value="25 GB">25 GB</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    User Limit
                  </label>
                  <input
                    type="text"
                    value={packageForm.userLimit}
                    onChange={(e) => setPackageForm({ ...packageForm, userLimit: e.target.value })}
                    placeholder="e.g. Up to 5 Users"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Support Tier
                  </label>
                  <input
                    type="text"
                    value={packageForm.supportTier}
                    onChange={(e) => setPackageForm({ ...packageForm, supportTier: e.target.value })}
                    placeholder="e.g. Priority WhatsApp & Email"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Bundled Product Codes (Comma-separated)
                </label>
                <input
                  type="text"
                  value={packageForm.includedProductCodes}
                  onChange={(e) => setPackageForm({ ...packageForm, includedProductCodes: e.target.value })}
                  placeholder="e.g. POS-BILLING, CRM-WHATSAPP, ACCOUNTING-UDHAR"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Included Features (One per line)
                </label>
                <textarea
                  rows={3}
                  value={packageForm.includedFeatures}
                  onChange={(e) => setPackageForm({ ...packageForm, includedFeatures: e.target.value })}
                  placeholder="POS Counter Billing Desk&#10;WhatsApp Payment Alerts&#10;Cloud Database Backup"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pkgFeatured"
                  checked={packageForm.isFeatured}
                  onChange={(e) => setPackageForm({ ...packageForm, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="pkgFeatured" className="text-[11px] font-semibold text-slate-800 cursor-pointer">
                  Featured on Public Packages Carousel
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingPackage ? "Update Package" : "Create Package"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DATABASE STORAGE TIER EDIT / ADD MODAL */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDbPlan ? `Edit Tier: ${editingDbPlan.label}` : "Add Database Storage Tier"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Set up capacity scale, monthly and annual rates for cloud databases.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDb} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Capacity (GB) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="1"
                    value={dbForm.sizeGb === 0 ? "" : dbForm.sizeGb}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setDbForm({ ...dbForm, sizeGb: val === "" ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tier Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={dbForm.label}
                    onChange={(e) => setDbForm({ ...dbForm, label: e.target.value })}
                    placeholder="e.g. 10 GB High-Speed NVMe Storage"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Monthly Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="0"
                    value={dbForm.monthlyPrice === 0 ? "" : dbForm.monthlyPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setDbForm({ ...dbForm, monthlyPrice: val === "" ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Annual Price (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    placeholder="0"
                    value={dbForm.annualPrice === 0 ? "" : dbForm.annualPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setDbForm({ ...dbForm, annualPrice: val === "" ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Storage Engine & Type
                </label>
                <input
                  type="text"
                  value={dbForm.storageType}
                  onChange={(e) => setDbForm({ ...dbForm, storageType: e.target.value })}
                  placeholder="e.g. Managed PostgreSQL / NVMe SSD"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Target Business Scale
                </label>
                <input
                  type="text"
                  value={dbForm.recommendedBusinessSize}
                  onChange={(e) => setDbForm({ ...dbForm, recommendedBusinessSize: e.target.value })}
                  placeholder="e.g. Retail Stores & Distributors"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Backup & High-Availability Info
                </label>
                <input
                  type="text"
                  value={dbForm.backupInfo}
                  onChange={(e) => setDbForm({ ...dbForm, backupInfo: e.target.value })}
                  placeholder="e.g. Automated Daily Cloud Backups + Point-in-Time Recovery"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm shadow-purple-600/30 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingDbPlan ? "Update Tier" : "Save Tier"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT REQUEST MODAL */}
      {inspectRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-600">{inspectRequest.requestNumber}</span>
                <h3 className="text-base font-bold text-slate-900">Quotation Specifications</h3>
              </div>
              <button onClick={() => setInspectRequest(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div><strong>Client:</strong> {inspectRequest.customerName} ({inspectRequest.businessName || "Direct"})</div>
                <div><strong>Email:</strong> {inspectRequest.email}</div>
                <div><strong>Phone / WhatsApp:</strong> {inspectRequest.phone}</div>
                <div><strong>Preferred Contact:</strong> {inspectRequest.preferredContact}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="font-bold text-slate-800">Financial Summary:</div>
                <div className="flex justify-between"><span>One-Time Cost:</span><span className="font-bold">{formatCurrency(inspectRequest.oneTimeTotal)}</span></div>
                <div className="flex justify-between"><span>Recurring Cost:</span><span className="font-bold">{formatCurrency(inspectRequest.recurringTotal)}/{inspectRequest.recurringInterval}</span></div>
                {inspectRequest.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600"><span>Discount:</span><span className="font-bold">-{formatCurrency(inspectRequest.discountTotal)}</span></div>
                )}
                <div className="flex justify-between pt-1 border-t text-sm font-black">
                  <span>Grand Total:</span>
                  <span className="text-sky-600">{formatCurrency(inspectRequest.grandTotal)}</span>
                </div>
              </div>

              <div>
                <span className="font-bold block mb-1">Selected Database Tier:</span>
                <span className="px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 font-bold">
                  {inspectRequest.selectedDatabaseTier || "Standard 5 GB"}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <a
                  href={`https://wa.me/${inspectRequest.phone.replace(/\D/g, "")}?text=Hello%20${encodeURIComponent(
                    inspectRequest.customerName
                  )},%20we%20have%20reviewed%20your%20software%20package%20quotation%20request%20(${
                    inspectRequest.requestNumber
                  })%20on%20ABECSA.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
