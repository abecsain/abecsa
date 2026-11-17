"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  FolderLock,
  Folder,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  X,
  ExternalLink,
  Search,
  UserCheck,
  Globe,
  Lock,
} from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";

export default function CustomerVaultPage() {
  const [folders, setFolders] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => {
        if (data.folders) setFolders(data.folders);
        if (data.files) setFiles(data.files);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredFiles = files.filter(
    (f) =>
      f.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (f.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Client Shared Vault & Document Repository
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Access high-fidelity UI design mockups, master services agreements, and verified project deliverables specifically shared with your organization.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vault documents..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Project Folders ({folders.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div key={folder.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{folder.name}</h4>
                    <p className="text-[10px] text-slate-400">{folder._count?.files || 0} Files Shared</p>
                  </div>
                </div>

                {folder.customerId ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    Direct Delivery
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Shared Asset
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Grid with Lightbox Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Shared Documents & Assets ({filteredFiles.length})
          </h3>
          <span className="text-[11px] text-slate-400">Secure end-to-end client access</span>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
            <FolderLock className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No documents in your vault yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any documents assigned to your company by your account manager will be displayed here securely.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((f) => (
              <div key={f.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-sky-300 transition-all">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {f.fileType === "IMAGE" ? (
                        <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                      ) : (
                        <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{f.originalName}</h4>
                        <p className="text-[10px] text-slate-400">{formatFileSize(f.fileSize)} • {formatDate(f.createdAt)}</p>
                      </div>
                    </div>

                    {f.customerId ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Private Client Delivery</span>
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Globe className="w-2.5 h-2.5" />
                        <span>Shared Asset</span>
                      </span>
                    )}
                  </div>

                  {f.description && (
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {f.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t flex items-center justify-between">
                  <button
                    onClick={() => setPreviewFile(f)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <a
                    href={f.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{previewFile.originalName}</h3>
                <span className="text-[10px] text-slate-400">
                  {formatFileSize(previewFile.fileSize)} • {previewFile.fileType}
                </span>
              </div>
              <button onClick={() => setPreviewFile(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-slate-100 rounded-2xl p-4 min-h-[250px]">
              {previewFile.fileType === "IMAGE" ? (
                <div className="relative h-72 w-full">
                  <Image src={previewFile.fileUrl} alt={previewFile.originalName} fill className="object-contain" />
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-xs text-slate-600">PDF / Document File</p>
                  <a
                    href={previewFile.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                  >
                    <span>Open in Document Viewer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {previewFile.description && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                {previewFile.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
