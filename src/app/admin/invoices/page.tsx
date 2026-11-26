"use client";

import { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  X,
  FileText,
  Trash2,
  Edit2,
  MessageSquare,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateInvoicePdf } from "@/lib/pdf";

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: string;
  paymentTerms: string | null;
  notes: string | null;
  customer: {
    id: string;
    companyName: string;
    address: string | null;
    gstNumber: string | null;
    user: { name: string; email: string; phone?: string | null };
  };
  project: { id: string; name: string } | null;
  items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
  payments: Array<{ id: string; amount: number; paymentDate: string; paymentMethod: string; transactionReference: string }>;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Edit Invoice Form
  const [editFormData, setEditFormData] = useState({
    status: "UNPAID",
    dueDate: "",
    amountPaid: 0,
    paymentTerms: "",
    notes: "",
  });

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [transRef, setTransRef] = useState("");

  // Create Invoice Form
  const [formData, setFormData] = useState({
    customerId: "",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    paymentTerms: "Payment due within 15 days of issue",
    notes: "Bank details: HDFC Bank A/C 50200088991122, IFSC HDFC0001234",
    items: [{ description: "Milestone Delivery Payment", quantity: 1, unitPrice: 250000 }],
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/invoices");
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/users?role=CUSTOMER");
      const data = await res.json();
      if (data.users) {
        const custs = data.users
          .filter((u: { customerProfile: unknown }) => !!u.customerProfile)
          .map((u: { customerProfile: { id: string; companyName: string } }) => ({
            id: u.customerProfile.id,
            companyName: u.customerProfile.companyName,
          }));
        setCustomers(custs);
        if (custs.length > 0) {
          setFormData((prev) => ({
            ...prev,
            customerId: prev.customerId || custs[0].id,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = (inv: Invoice) => {
    const doc = generateInvoicePdf({
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.user.name,
      companyName: inv.customer.companyName,
      customerAddress: inv.customer.address || undefined,
      customerGst: inv.customer.gstNumber || undefined,
      issueDate: formatDate(inv.issueDate),
      dueDate: formatDate(inv.dueDate),
      items: inv.items,
      subtotal: inv.subtotal,
      taxAmount: inv.taxAmount,
      totalAmount: inv.totalAmount,
      amountPaid: inv.amountPaid,
      balanceAmount: inv.balanceAmount,
      paymentTerms: inv.paymentTerms || undefined,
      notes: inv.notes || undefined,
    });
    doc.save(`${inv.invoiceNumber}_ABECSA.pdf`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(payAmount),
          paymentMethod,
          transactionReference: transRef,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowPaymentModal(false);
        setPayAmount("");
        setTransRef("");
        fetchInvoices();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch {
      alert("Error recording payment");
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch {
      alert("Error creating invoice");
    }
  };

  const handleDeleteInvoice = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice "${invoiceNumber}"?`)) return;

    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchInvoices();
      } else {
        alert(data.error || "Failed to delete invoice");
      }
    } catch {
      alert("Error deleting invoice");
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchInvoices();
      } else {
        alert(data.error || "Failed to update invoice status");
      }
    } catch {
      alert("Error updating invoice status");
    }
  };

  const openEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditFormData({
      status: inv.status,
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "",
      amountPaid: inv.amountPaid || 0,
      paymentTerms: inv.paymentTerms || "",
      notes: inv.notes || "",
    });
    setShowEditModal(true);
  };

  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingInvoice.id,
          status: editFormData.status,
          dueDate: editFormData.dueDate,
          amountPaid: Number(editFormData.amountPaid),
          paymentTerms: editFormData.paymentTerms,
          notes: editFormData.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowEditModal(false);
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        alert(data.error || "Failed to update invoice");
      }
    } catch {
      alert("Error saving invoice changes");
    }
  };

  const handleSendWhatsAppInvoice = async (inv: Invoice, isReminder = false) => {
    const customerPhone = inv.customer?.user?.phone || "9876543214";
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customerPhone,
          invoiceData: {
            companyName: "ABECSA Software Solutions",
            invoiceNumber: inv.invoiceNumber,
            customerName: `${inv.customer.companyName} (${inv.customer.user.name})`,
            issueDate: formatDate(inv.issueDate),
            dueDate: formatDate(inv.dueDate),
            items: inv.items.map((it) => ({
              description: it.description,
              quantity: it.quantity,
              amount: it.amount,
            })),
            subtotal: inv.subtotal,
            taxAmount: inv.taxAmount,
            totalAmount: inv.totalAmount,
            amountPaid: inv.amountPaid,
            balanceAmount: inv.balanceAmount,
            paymentMode: "UPI / Bank Transfer",
            upiId: "abecsa@okhdfcbank",
          },
          isReminder,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✓ WhatsApp ${isReminder ? "Reminder (तकादा)" : "Invoice Bill"} sent automatically to ${customerPhone}!`);
      } else if (data.fallbackUrl) {
        window.open(data.fallbackUrl, "_blank");
      } else {
        alert(data.error || "Failed to send WhatsApp message");
      }
    } catch (err: any) {
      alert("Error dispatching WhatsApp: " + err.message);
    }
  };

  const filteredInvoices = invoices.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.customer.companyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Tax Invoicing & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue GST-compliant tax invoices, track partial payment receipts, and maintain financial verification trails.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              customerId: customers[0]?.id || "",
              dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
              paymentTerms: "Payment due within 15 days of issue",
              notes: "Bank details: HDFC Bank A/C 50200088991122, IFSC HDFC0001234",
              items: [{ description: "Milestone Delivery Payment", quantity: 1, unitPrice: 250000 }],
            });
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Tax Invoice</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number or client..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Invoice No / Date</th>
                <th className="py-3.5 px-4">Billed Customer</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Amount Paid</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-sky-600 block">{inv.invoiceNumber}</span>
                    <span className="text-[11px] text-slate-400">Issued: {formatDate(inv.issueDate)}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">{inv.customer.companyName}</p>
                    <p className="text-[11px] text-slate-400">{inv.customer.user.name}</p>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">
                    {formatCurrency(inv.amountPaid)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-rose-600">
                    {formatCurrency(inv.balanceAmount)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={inv.status}
                        onChange={(e) => handleQuickStatusChange(inv.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border cursor-pointer outline-none transition-colors ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : inv.status === "PARTIALLY_PAID"
                            ? "bg-amber-50 text-amber-700 border-amber-300"
                            : inv.status === "CANCELLED"
                            ? "bg-slate-100 text-slate-600 border-slate-300"
                            : "bg-rose-50 text-rose-700 border-rose-300"
                        }`}
                        title="Click to quickly change payment status"
                      >
                        <option value="UNPAID">UNPAID</option>
                        <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                        <option value="PAID">PAID</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      Due: {formatDate(inv.dueDate)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleDownloadPdf(inv)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        title="Download Tax Invoice PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => handleSendWhatsAppInvoice(inv, inv.balanceAmount > 0)}
                        className="px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        title={inv.balanceAmount > 0 ? "Send 1-Click WhatsApp Bill & तकादा Reminder" : "Send WhatsApp Receipt"}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{inv.balanceAmount > 0 ? "WhatsApp तकादा" : "WhatsApp"}</span>
                      </button>

                      <button
                        onClick={() => openEditInvoice(inv)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer text-xs"
                        title="Modify Invoice Details & Status"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                        <span>Edit</span>
                      </button>

                      {inv.balanceAmount > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPayAmount(String(inv.balanceAmount));
                            setShowPaymentModal(true);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold flex items-center gap-1 shadow-xs cursor-pointer text-xs"
                          title="Record Payment"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Record Payment</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
                <p className="text-xs text-slate-500">Invoice: {selectedInvoice.invoiceNumber}</p>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border flex justify-between">
                <span>Remaining Balance Due:</span>
                <span className="font-bold text-rose-600">{formatCurrency(selectedInvoice.balanceAmount)}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount to Record (INR) *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  max={selectedInvoice.balanceAmount}
                  value={payAmount === "0" ? "" : payAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setPayAmount(val);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                    <option value="UPI">Corporate UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="CHEQUE">Corporate Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Transaction Ref No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC-NEFT-998811"
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  Confirm & Verify Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INVOICE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900">Generate Tax Invoice</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Client *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Select Client...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={formData.items[0].description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      items: [{ ...formData.items[0], description: e.target.value }],
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount (Excl. GST) *</label>
                  <input
                    type="number"
                    required
                    placeholder="0"
                    value={formData.items[0].unitPrice === 0 ? "" : formData.items[0].unitPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value.replace(/^0+(?=\d)/, "");
                      e.target.value = val;
                      setFormData({
                        ...formData,
                        items: [{ ...formData.items[0], unitPrice: val === "" ? 0 : Number(val) }],
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div className="p-2 bg-slate-50 border rounded-lg text-right">
                  <span className="text-[10px] text-slate-500 block">Total with 18% GST</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatCurrency(formData.items[0].unitPrice * 1.18)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700"
                >
                  Issue Tax Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODIFY / EDIT INVOICE MODAL */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Modify Tax Invoice</h3>
                <p className="text-xs text-slate-500">Invoice: {editingInvoice.invoiceNumber} • {editingInvoice.customer.companyName}</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">TOTAL AMOUNT</span>
                  <span className="font-bold text-slate-900 text-xs">{formatCurrency(editingInvoice.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">AMOUNT PAID</span>
                  <span className="font-bold text-emerald-600 text-xs">{formatCurrency(editingInvoice.amountPaid)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">BALANCE DUE</span>
                  <span className="font-bold text-rose-600 text-xs">{formatCurrency(editingInvoice.balanceAmount)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status *</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-semibold text-xs"
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                    <option value="PAID">PAID</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Adjust Recorded Amount Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  max={editingInvoice.totalAmount}
                  value={editFormData.amountPaid === 0 ? "" : editFormData.amountPaid}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/^0+(?=\d)/, "");
                    e.target.value = val;
                    setEditFormData({ ...editFormData, amountPaid: val === "" ? 0 : Number(val) });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Changing amount paid will automatically recalculate balance due and update status.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={editFormData.paymentTerms}
                  onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
                  placeholder="e.g. Payment due within 15 days of issue"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Notes & Banking Details</label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Notes for client or accounting..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    handleDeleteInvoice(editingInvoice.id, editingInvoice.invoiceNumber);
                  }}
                  className="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Invoice</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 text-xs cursor-pointer shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
