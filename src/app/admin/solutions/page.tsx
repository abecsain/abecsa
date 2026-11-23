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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
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

                <div className="text-[11px] text-slate-500 pt-2 border-t">
                  Included DB: <strong>{pkg.databaseTier}</strong> • Users: <strong>{pkg.userLimit}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE STORAGE PLANS */}
      {activeTab === "DATABASE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Database Storage Tiers & Pricing ({databasePlans.length})
            </h3>
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
                  value={estimatorRule.avgProductRecordBytes}
                  onChange={(e) => setEstimatorRule({ ...estimatorRule, avgProductRecordBytes: Number(e.target.value) })}
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
                  value={estimatorRule.avgBillRecordBytes}
                  onChange={(e) => setEstimatorRule({ ...estimatorRule, avgBillRecordBytes: Number(e.target.value) })}
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
                  value={estimatorRule.overheadAndIndexFactor}
                  onChange={(e) => setEstimatorRule({ ...estimatorRule, overheadAndIndexFactor: Number(e.target.value) })}
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
                  value={estimatorRule.safetyBufferPercent}
                  onChange={(e) => setEstimatorRule({ ...estimatorRule, safetyBufferPercent: Number(e.target.value) })}
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
