"use client";

import { useEffect, useState } from "react";
import { Bell, ExternalLink, Check, Calendar } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function CustomerNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/notices");
      const data = await res.json();
      if (data.notices) setNotices(data.notices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (noticeId: string) => {
    try {
      await fetch("/api/notices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: noticeId }),
      });
      fetchNotices();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Manager Announcements & Notices
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Important sprint updates, sandbox inspection notices, and meeting schedules pushed specifically to your organization.
        </p>
      </div>

      <div className="space-y-4">
        {notices.map((n) => (
          <div
            key={n.id}
            className={`p-6 rounded-3xl border transition-all space-y-3 ${
              !n.isRead
                ? "bg-white border-sky-300 shadow-md ring-1 ring-sky-300/30"
                : "bg-white border-slate-200 shadow-xs opacity-90"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      n.priority === "IMPORTANT"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {n.priority}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    From {n.sender?.name || "Manager"} • {formatDateTime(n.createdAt)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{n.title}</h3>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-lg shrink-0 cursor-pointer"
                >
                  Mark read
                </button>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {n.message}
            </p>

            {n.actionUrl && (
              <div className="pt-1">
                <a
                  href={n.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 shadow-xs"
                >
                  <span>{n.actionLabel || "Open Action Link"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
