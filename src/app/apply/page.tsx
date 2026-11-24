"use client";

import React, { useState } from "react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import { GraduationCap, Send, CheckCircle2, AlertCircle, Sparkles, Building, UserCheck } from "lucide-react";

export default function ApplyPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    courseName: "Full-Stack Enterprise Engineering",
    branch: "",
    message: "",
    type: "Course", // Course, Internship, Student Ambassador
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setErrorMessage(data.error || "Failed to submit application.");
      }
    } catch {
      setErrorMessage("Network error. Please try again or reach out on WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col selection:bg-sky-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold tracking-wide uppercase">
            <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
            <span>ABECSA Academy & Campus Talent</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight">
            Apply for <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600">Courses & Programs</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Join our enterprise engineering mentorship, practical software internships, or represent your campus as an ABECSA Student Ambassador.
          </p>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
            <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Application Submitted Successfully!</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Thank you, <strong className="text-slate-900">{formData.name}</strong>. Our admissions and talent team will review your application and contact you via WhatsApp / email within 24-48 hours.
            </p>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  courseName: "Full-Stack Enterprise Engineering",
                  branch: "",
                  message: "",
                  type: "Course",
                });
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
            >
              Submit Another Application
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                  Select Application Track:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "Course", label: "Specialized Course", desc: "Enterprise Full-Stack, AI & Cloud" },
                    { id: "Internship", label: "Software Internship", desc: "Hands-on projects with stipends" },
                    { id: "Student Ambassador", label: "Student Ambassador", desc: "Campus lead & community rewards" },
                  ].map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: track.id })}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        formData.type === track.id
                          ? "border-sky-600 bg-sky-50/50 shadow-xs ring-1 ring-sky-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">{track.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{track.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">College Branch / Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE / IT / BCA / MCA"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Target Program / Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full-Stack Web Systems, Mobile Flutter Engineering, etc."
                  value={formData.courseName}
                  onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Why do you want to join? (Optional message)</label>
                <textarea
                  rows={3}
                  placeholder="Briefly tell us about your background, career goals, or technical interests..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/20 active:scale-[0.99] transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Submitting Application..." : "Submit Application"}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
