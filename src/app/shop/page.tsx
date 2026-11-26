"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Code2,
  ArrowRight,
  Plus,
  X,
  Zap,
} from "lucide-react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import { formatCurrency } from "@/lib/utils";

interface SoftwareProduct {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  billingType: string;
  badge: string | null;
  features: string;
  demoUrl: string | null;
  techStack: string | null;
  whatsappPhone: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<SoftwareProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Admin Add Product Modal State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    code: "",
    name: "",
    category: "ERP & Management",
    description: "",
    price: "",
    badge: "New Release",
    features: "",
    techStack: "Next.js, TypeScript, PostgreSQL",
  });
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    fetchProducts();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.user.effectiveRole === "ADMIN") {
          setIsAdmin(true);
        }
      }
    } catch {
      // not logged in
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        const cats = Array.from(new Set(data.products.map((p: any) => p.category))) as string[];
        setCategories(cats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const featureList = newProduct.features.split("\n").filter((f) => f.trim().length > 0);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          features: featureList,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewProduct({
          code: "",
          name: "",
          category: "ERP & Management",
          description: "",
          price: "",
          badge: "New Release",
          features: "",
          techStack: "Next.js, TypeScript, PostgreSQL",
        });
        fetchProducts();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create product");
      }
    } catch {
      alert("Error creating product");
    } finally {
      setSavingProduct(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getWhatsAppLink = (product: SoftwareProduct) => {
    const text = `Hello ABECSA Team! I am interested in purchasing "${product.name}" (Product Code: ${product.code}, Price: ₹${product.price.toLocaleString("en-IN")}). Please share software license, demo walkthrough, and installation details.`;
    return `https://wa.me/919876543210?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200 pt-10 pb-12 sm:pt-16 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ABECSA Ready-to-Deploy Software Store</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Enterprise Software Store
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Purchase pre-built, production-tested software solutions for your business. Full source code, complete database schema, and direct WhatsApp license dispatch.
              </p>
            </div>

            {/* Admin Add Button */}
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md self-start"
              >
                <Plus className="w-4 h-4" />
                <span>Add Software to Store</span>
              </button>
            )}
          </div>

          {/* Genuine Purchase Guarantees */}
          <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full Source Code Included</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Free Cloud Setup Support</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct WhatsApp Order Desk</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>GST ITC Invoice Provided</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog View */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCategory("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Software ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search software catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            let featureList: string[] = [];
            try {
              featureList = JSON.parse(p.features);
            } catch {
              featureList = p.features ? p.features.split(",") : [];
            }

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-lg transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Bar: Code & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                      {p.code}
                    </span>
                    {p.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Title & Category */}
                  <div>
                    <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block">
                      {p.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  {/* Price Tag */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                        / One-Time License
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Zero Royalty
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {p.description}
                  </p>

                  {/* Key Features Checklist */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      What&apos;s Included:
                    </span>
                    {featureList.slice(0, 4).map((f, fi) => (
                      <div key={fi} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tech Stack */}
                  {p.techStack && (
                    <div className="pt-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Code2 className="w-3 h-3 text-slate-400" />
                      <span>{p.techStack}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Order via WhatsApp Button */}
                <div className="pt-5 mt-4 border-t border-slate-100 space-y-2">
                  <a
                    href={getWhatsAppLink(p)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>Order / Inquire via WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>

                  <Link
                    href={`/contact?type=quote&service=${encodeURIComponent(p.name)}`}
                    className="w-full py-2 px-3 rounded-lg text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-center block transition-colors"
                  >
                    Request Custom Feature Modification
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No software matches your criteria</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Looking for something custom? Our engineering team builds bespoke systems tailored to your exact workflows.
            </p>
            <Link
              href="/contact?type=quote"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold"
            >
              Request Custom Software
            </Link>
          </div>
        )}
      </main>

      {/* Admin Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900">Add New Software to Shop</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ABC-CRM-08"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="24999"
                    value={newProduct.price === "0" ? "" : newProduct.price}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setNewProduct({ ...newProduct, price: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Software Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABECSA Real Estate Broker & Builder CRM"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Badge</label>
                  <input
                    type="text"
                    value={newProduct.badge}
                    onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={2}
                  required
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Lead pipeline & automated WhatsApp followup&#10;Property catalog with floor plan viewer&#10;Commission split & agent ledger"
                  value={newProduct.features}
                  onChange={(e) => setNewProduct({ ...newProduct, features: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {savingProduct ? "Publishing..." : "Publish to Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
