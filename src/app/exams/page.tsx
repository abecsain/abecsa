"use client";

import React, { useState, useEffect } from "react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import { FileText, Clock, AlertTriangle, ShieldCheck, CheckCircle2, Play, ExternalLink } from "lucide-react";

interface ExamItem {
  id: string;
  name: string;
  googleFormUrl: string;
  startTime: string;
  durationMinutes: number;
  _count?: { attempts: number };
}

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<ExamItem | null>(null);
  const [isAttempting, setIsAttempting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/exams");
      const data = await res.json();
      if (data.success && data.exams) {
        setExams(data.exams);
      }
    } catch (err) {
      console.error("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  // Proctoring tab-switch & window blur tracking
  useEffect(() => {
    if (!isAttempting || !activeExam) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setViolationCount((prev) => prev + 1);
        try {
          await fetch(`/api/exams/${activeExam.id}/attempt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "flag",
              violationReason: "Browser tab switched or minimized during examination",
            }),
          });
        } catch (e) {
          console.error("Failed to log proctor violation:", e);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAttempting, activeExam]);

  // Exam Countdown Timer
  useEffect(() => {
    if (!isAttempting || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAttempting, timeLeft]);

  const handleStartExam = async (exam: ExamItem) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Please log in to take the assessment.");
        return;
      }
      setActiveExam(exam);
      setIsAttempting(true);
      setTimeLeft(exam.durationMinutes * 60);
      setViolationCount(0);
    } catch {
      alert("Failed to start exam. Please ensure you are logged in.");
    }
  };

  const handleFinishExam = async () => {
    if (!activeExam) return;
    try {
      await fetch(`/api/exams/${activeExam.id}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
    } catch (e) {
      console.error(e);
    }
    setIsAttempting(false);
    setActiveExam(null);
    alert("Assessment finished and submitted successfully!");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      {!isAttempting && <PublicNavbar />}

      {isAttempting && activeExam ? (
        /* Fullscreen Proctored Exam Environment */
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col">
          {/* Top Proctoring Header */}
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold">{activeExam.name}</h3>
                <span className="text-[10px] text-slate-400">Proctored Assessment Session Active</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {violationCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{violationCount} Tab Switch Warning{violationCount > 1 ? "s" : ""}</span>
                </div>
              )}

              <div className="flex items-center gap-2 font-mono text-sm font-black bg-slate-800 px-3.5 py-1.5 rounded-xl border border-slate-700">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className={timeLeft < 300 ? "text-rose-400 animate-pulse" : "text-white"}>
                  {formatTimer(timeLeft)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFinishExam}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Complete & Submit
              </button>
            </div>
          </div>

          {/* Embedded Exam Frame */}
          <div className="flex-1 w-full bg-white">
            <iframe
              src={activeExam.googleFormUrl}
              className="w-full h-full border-0"
              title={activeExam.name}
            />
          </div>
        </div>
      ) : (
        /* Exam Listing Screen */
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-10">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Proctored Assessment Portal</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
              ABECSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">Online Assessments</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Certification evaluations, student ambassador screening, and technical candidate entrance assessments.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-3xl border border-slate-200 p-8 animate-pulse h-48" />
              ))}
            </div>
          ) : exams.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No Scheduled Assessments</h3>
              <p className="text-xs text-slate-500">There are currently no active assessments open for registration.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-sky-300 transition-all space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        Proctored Online Test
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{exam.durationMinutes} Minutes</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-950">{exam.name}</h3>

                    <div className="space-y-1.5 text-xs text-slate-500">
                      <div>Start Date: {new Date(exam.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      <div>Attempts: {exam._count?.attempts || 0} candidates recorded</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Fullscreen Proctoring Active</span>

                    <button
                      type="button"
                      onClick={() => handleStartExam(exam)}
                      className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-sky-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Assessment</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {!isAttempting && <PublicFooter />}
    </div>
  );
}
