"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  FolderLock,
  FolderPlus,
  FileUp,
  Search,
  Folder,
  FileText,
  Image as ImageIcon,
  Eye,
  Lock,
  Globe,
  Download,
  X,
  ExternalLink,
  Trash2,
  Shield,
  UserCheck,
  Building,
  UploadCloud,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";

interface VaultFolder {
  id: string;
  name: string;
  isCustomerVisible: boolean;
  customerId: string | null;
  customer: { id: string; companyName: string; user?: { name: string; email: string } } | null;
  createdAt: string;
  _count: { files: number };
}

interface VaultFile {
  id: string;
  fileName: string;
  originalName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isCustomerVisible: boolean;
  customerId: string | null;
  customer: { id: string; companyName: string; user?: { name: string; email: string } } | null;
  description: string | null;
  createdAt: string;
  folder: { id: string; name: string } | null;
  uploadedBy: { name: string; role: string } | null;
}

export default function AdminVaultPage() {
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<Array<{ id: string; companyName: string; userName?: string }>>([]);

  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; type: "FOLDER" | "FILE"; name: string; visibility: "CONFIDENTIAL" | "SHOW_EVERYONE" | "ASSIGNED"; customerId: string } | null>(null);

  // Folder Form State
  const [folderName, setFolderName] = useState("");
  const [folderVisibility, setFolderVisibility] = useState<"CONFIDENTIAL" | "SHOW_EVERYONE" | "ASSIGNED">("SHOW_EVERYONE");
  const [folderCustomerId, setFolderCustomerId] = useState("");

  // File Upload Form State
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("/logo.png");
  const [fileType, setFileType] = useState("IMAGE");
  const [fileSize, setFileSize] = useState(256000);
  const [fileDesc, setFileDesc] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [fileVisibility, setFileVisibility] = useState<"CONFIDENTIAL" | "SHOW_EVERYONE" | "ASSIGNED">("SHOW_EVERYONE");
  const [fileCustomerId, setFileCustomerId] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchVault();
    fetchCustomers();
  }, []);

  const fetchVault = async () => {
    try {
      const res = await fetch("/api/vault");
      const data = await res.json();
      if (data.folders) setFolders(data.folders);
      if (data.files) setFiles(data.files);
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
          .map((u: { customerProfile: { id: string; companyName: string }; name: string }) => ({
            id: u.customerProfile.id,
            companyName: u.customerProfile.companyName,
            userName: u.name,
          }));
        setCustomers(custs);
        if (custs.length > 0) {
          setFolderCustomerId(custs[0].id);
          setFileCustomerId(custs[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFileName(selected.name);
    setFileSize(selected.size);

    // Determine type
    if (selected.type.startsWith("image/")) {
      setFileType("IMAGE");
    } else if (selected.type.includes("pdf")) {
      setFileType("PDF");
    } else if (selected.type.includes("zip") || selected.type.includes("tar") || selected.type.includes("compressed")) {
      setFileType("ZIP");
    } else if (selected.type.includes("word") || selected.type.includes("document")) {
      setFileType("DOCX");
    } else {
      setFileType("DOCX");
    }

    // Read file as base64 data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(selected);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOLDER",
          name: folderName,
          visibility: folderVisibility,
          customerId: folderVisibility === "ASSIGNED" ? folderCustomerId : undefined,
        }),
      });
      if (res.ok) {
        setShowFolderModal(false);
        setFolderName("");
        setFolderVisibility("SHOW_EVERYONE");
        fetchVault();
      }
    } catch {
      alert("Error creating folder");
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FILE",
          fileName,
          originalName: fileName,
          fileUrl,
          fileType,
          fileSize,
          description: fileDesc,
          folderId: selectedFolderId || undefined,
          visibility: fileVisibility,
          customerId: fileVisibility === "ASSIGNED" ? fileCustomerId : undefined,
        }),
      });
      if (res.ok) {
        setShowFileModal(false);
        setFileName("");
        setFileDesc("");
        setFileUrl("/logo.png");
        setFileVisibility("SHOW_EVERYONE");
        fetchVault();
      }
    } catch {
      alert("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const openAccessModal = (item: VaultFolder | VaultFile, type: "FOLDER" | "FILE") => {
    let currentVis: "CONFIDENTIAL" | "SHOW_EVERYONE" | "ASSIGNED" = "SHOW_EVERYONE";
    if (!item.isCustomerVisible) {
      currentVis = "CONFIDENTIAL";
    } else if (item.customerId) {
      currentVis = "ASSIGNED";
    } else {
      currentVis = "SHOW_EVERYONE";
    }

    setEditingItem({
      id: item.id,
      type,
      name: "originalName" in item ? item.originalName : item.name,
      visibility: currentVis,
      customerId: item.customerId || (customers[0]?.id || ""),
    });
    setShowAccessModal(true);
  };

  const handleSaveAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch("/api/vault", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          type: editingItem.type,
          visibility: editingItem.visibility,
          customerId: editingItem.visibility === "ASSIGNED" ? editingItem.customerId : null,
        }),
      });

      if (res.ok) {
        setShowAccessModal(false);
        setEditingItem(null);
        fetchVault();
      } else {
        alert("Failed to update access settings");
      }
    } catch {
      alert("Error saving access settings");
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete folder "${name}" and all its contents?`)) return;
    try {
      const res = await fetch(`/api/vault?id=${id}&type=FOLDER`, { method: "DELETE" });
      if (res.ok) fetchVault();
    } catch {
      alert("Error deleting folder");
    }
  };

  const handleDeleteFile = async (id: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete file "${fileName}"?`)) return;
    try {
      const res = await fetch(`/api/vault?id=${id}&type=FILE`, { method: "DELETE" });
      if (res.ok) fetchVault();
    } catch {
      alert("Error deleting file");
    }
  };

  const renderVisibilityBadge = (isCustomerVisible: boolean, customerId: string | null, customer: { companyName: string; user?: { name: string } } | null) => {
    if (!isCustomerVisible) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <Lock className="w-3 h-3 text-rose-600" />
          <span>Confidential (Internal Only)</span>
        </span>
      );
    }

    if (customerId && customer) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          <UserCheck className="w-3 h-3 text-sky-600" />
          <span className="truncate max-w-[130px]">Assigned: {customer.companyName}</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Globe className="w-3 h-3 text-emerald-600" />
        <span>Visible to Show Everyone</span>
      </span>
    );
  };

  const filteredFiles = files.filter(
    (f) =>
      f.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.customer?.companyName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Asset Vault & Secure Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Store documents with strict access controls: keep <strong>Confidential / Don&apos;t Show Anyone</strong>, publish <strong>Visible to Show Everyone</strong>, or <strong>Assign to Specific Customer</strong> so only their authenticated account can access it.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-slate-600" />
            <span>New Folder</span>
          </button>
          <button
            onClick={() => setShowFileModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Managed Vault Folders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Managed Vault Folders ({folders.length})
          </h3>
          <span className="text-[11px] text-slate-400">Click shield icon on any folder to adjust confidentiality</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-sky-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-sky-50 text-sky-600">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                      {folder.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {folder._count.files} Files • {formatDate(folder.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openAccessModal(folder, "FOLDER")}
                  className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                  title="Configure Confidentiality & Customer Access"
                >
                  <Shield className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {renderVisibilityBadge(folder.isCustomerVisible, folder.customerId, folder.customer)}

                <button
                  onClick={() => handleDeleteFolder(folder.id, folder.name)}
                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                  title="Delete Folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2 border-b">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Repository Files & Deliverables</h3>
            <p className="text-[11px] text-slate-500">Each file enforces real-time RBAC matching the uploader&apos;s visibility setting.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, clients, descriptions..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredFiles.map((f) => (
            <div
              key={f.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 transition-all flex flex-col justify-between space-y-3 group bg-white"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    {f.fileType === "IMAGE" ? (
                      <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{f.originalName}</h4>
                      <p className="text-[10px] text-slate-400">
                        {formatFileSize(f.fileSize)} • {formatDate(f.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => openAccessModal(f, "FILE")}
                    className="p-1 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                    title="Change Confidentiality & Assigned Customer"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                </div>

                {/* Visibility Badge */}
                <div>
                  {renderVisibilityBadge(f.isCustomerVisible, f.customerId, f.customer)}
                </div>

                {f.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {f.description}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  By {f.uploadedBy?.name || "System"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewFile(f)}
                    className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-sky-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800 cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => handleDeleteFile(f.id, f.fileName)}
                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE FOLDER MODAL */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Create Vault Folder</h3>
              </div>
              <button onClick={() => setShowFolderModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Folder Name *</label>
                <input
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Design Assets, SOW Contracts, Invoices"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Three Option Access Control */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-800">
                  Folder Access & Confidentiality Level *
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    folderVisibility === "CONFIDENTIAL" ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="folderVis"
                      checked={folderVisibility === "CONFIDENTIAL"}
                      onChange={() => setFolderVisibility("CONFIDENTIAL")}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        Don&apos;t Show Anyone / Confidential
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Internal team only (Admin, Manager, Engineer). No customers can see or open this folder.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    folderVisibility === "SHOW_EVERYONE" ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="folderVis"
                      checked={folderVisibility === "SHOW_EVERYONE"}
                      onChange={() => setFolderVisibility("SHOW_EVERYONE")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Visible to Show Everyone
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Published to all registered customer portals in their vault.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    folderVisibility === "ASSIGNED" ? "bg-sky-50/60 border-sky-300 ring-1 ring-sky-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="folderVis"
                      checked={folderVisibility === "ASSIGNED"}
                      onChange={() => setFolderVisibility("ASSIGNED")}
                      className="mt-0.5 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        Assign so Only Assigned Customer Can Log In & See
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Strictly isolated: only the specific chosen client sees this folder when they log in to their account.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Customer Selector Dropdown if ASSIGNED */}
              {folderVisibility === "ASSIGNED" && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1.5 animate-fadeIn">
                  <label className="block font-bold text-sky-950">
                    Select Target Assigned Customer Account *
                  </label>
                  <select
                    required
                    value={folderCustomerId}
                    onChange={(e) => setFolderCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white font-semibold text-xs"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.userName || "Customer Client"})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-sky-700">
                    Only this client account will see this folder in their Customer Portal.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowFolderModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer shadow-xs"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD FILE MODAL */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Upload Document to Vault</h3>
              </div>
              <button onClick={() => setShowFileModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
              {/* File Dropzone / Picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-5 border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-2xl bg-sky-50/40 text-center cursor-pointer transition-all space-y-1.5"
              >
                <UploadCloud className="w-8 h-8 text-sky-600 mx-auto" />
                <p className="font-bold text-slate-800">
                  {fileName ? fileName : "Click to select file from device"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports Images (PNG, JPG), PDF Contracts, ZIP Deliverables & Documents
                </p>
                {fileName && (
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 mt-1">
                    Ready: {formatFileSize(fileSize)} ({fileType})
                  </span>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLocalFileSelect}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">File Title / Name *</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Mobile App Navigation Prototype.png"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">File Category</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="IMAGE">Image / UI Mockup</option>
                    <option value="PDF">PDF Contract / Spec</option>
                    <option value="ZIP">ZIP Code Deliverable</option>
                    <option value="DOCX">DOCX Word Document</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Folder</label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="">Root Repository</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Version Notes</label>
                <textarea
                  rows={2}
                  value={fileDesc}
                  onChange={(e) => setFileDesc(e.target.value)}
                  placeholder="Notes about this deliverable, instructions, or scope..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              {/* Three Option Access Control */}
              <div className="space-y-2 pt-1 border-t">
                <label className="block font-semibold text-slate-800">
                  Document Access & Confidentiality Setting *
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    fileVisibility === "CONFIDENTIAL" ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="fileVis"
                      checked={fileVisibility === "CONFIDENTIAL"}
                      onChange={() => setFileVisibility("CONFIDENTIAL")}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        Don&apos;t Show Anyone / Confidential
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Internal team only (Admin, Manager, Engineer). No customers can see or download this file.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    fileVisibility === "SHOW_EVERYONE" ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="fileVis"
                      checked={fileVisibility === "SHOW_EVERYONE"}
                      onChange={() => setFileVisibility("SHOW_EVERYONE")}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Visible to Show Everyone
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        All registered customers will be able to view and download this file in their vault.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    fileVisibility === "ASSIGNED" ? "bg-sky-50/60 border-sky-300 ring-1 ring-sky-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="fileVis"
                      checked={fileVisibility === "ASSIGNED"}
                      onChange={() => setFileVisibility("ASSIGNED")}
                      className="mt-0.5 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        Assign so Only Assigned Customer Can Log In & See
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Private client delivery: only the selected customer account will be able to see this file.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Customer Selector Dropdown if ASSIGNED */}
              {fileVisibility === "ASSIGNED" && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1.5 animate-fadeIn">
                  <label className="block font-bold text-sky-950">
                    Assign to Customer Account *
                  </label>
                  <select
                    required
                    value={fileCustomerId}
                    onChange={(e) => setFileCustomerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white font-semibold text-xs"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.userName || "Customer Client"})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-sky-700">
                    When this customer logs into their portal, this file will appear in their vault. Other clients will never see it.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !fileName}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {uploading ? "Uploading & Syncing..." : "Upload & Sync"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCESS / VISIBILITY MODAL */}
      {showAccessModal && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Modify Access & Visibility</h3>
              </div>
              <button onClick={() => setShowAccessModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccess} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Item</span>
                <span className="font-bold text-slate-900 text-xs">{editingItem.name} ({editingItem.type})</span>
              </div>

              <div className="space-y-2">
                <label className="block font-semibold text-slate-800">
                  Select New Access Level
                </label>
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingItem.visibility === "CONFIDENTIAL" ? "bg-rose-50/60 border-rose-300 ring-1 ring-rose-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="editVis"
                      checked={editingItem.visibility === "CONFIDENTIAL"}
                      onChange={() => setEditingItem({ ...editingItem, visibility: "CONFIDENTIAL" })}
                      className="mt-0.5 text-rose-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        Don&apos;t Show Anyone / Confidential
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Instantly hide from all customer portals. Only company staff can see.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingItem.visibility === "SHOW_EVERYONE" ? "bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="editVis"
                      checked={editingItem.visibility === "SHOW_EVERYONE"}
                      onChange={() => setEditingItem({ ...editingItem, visibility: "SHOW_EVERYONE" })}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Visible to Show Everyone
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Make visible to all registered customer portals.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    editingItem.visibility === "ASSIGNED" ? "bg-sky-50/60 border-sky-300 ring-1 ring-sky-300" : "hover:bg-slate-50 border-slate-200"
                  }`}>
                    <input
                      type="radio"
                      name="editVis"
                      checked={editingItem.visibility === "ASSIGNED"}
                      onChange={() => setEditingItem({ ...editingItem, visibility: "ASSIGNED" })}
                      className="mt-0.5 text-sky-600"
                    />
                    <div>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        Assign so Only Assigned Customer Can Log In & See
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Restricted: only the assigned client can view this item when logged in.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {editingItem.visibility === "ASSIGNED" && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1.5">
                  <label className="block font-bold text-sky-950">
                    Assigned Customer Account
                  </label>
                  <select
                    value={editingItem.customerId}
                    onChange={(e) => setEditingItem({ ...editingItem, customerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-sky-300 bg-white font-semibold text-xs"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.userName || "Customer Client"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 cursor-pointer shadow-xs"
                >
                  Save Access Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewFile.originalName}</h3>
                <div className="mt-1">
                  {renderVisibilityBadge(previewFile.isCustomerVisible, previewFile.customerId, previewFile.customer)}
                </div>
              </div>
              <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-slate-100 rounded-xl p-4 min-h-[250px]">
              {previewFile.fileType === "IMAGE" ? (
                <div className="relative h-64 w-full">
                  <Image
                    src={previewFile.fileUrl}
                    alt={previewFile.originalName}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-xs text-slate-600">PDF / Document File Preview</p>
                  <a
                    href={previewFile.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                  >
                    <span>Open in Document Viewer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {previewFile.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg">
                {previewFile.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
