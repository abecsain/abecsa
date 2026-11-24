"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = data.redirectUrl || "/admin";
      } else {
        setErrorMsg(data.error || "Authentication failed. Check your credentials.");
      }
    } catch (err) {
      setErrorMsg("Network error during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-transparent selection:bg-sky-500 selection:text-white">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-9 w-36">
            <Image
              src="/logo.png"
              alt="ABECSA"
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors"
        >
          ← Return to Public Website
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-sky-600/10 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Enterprise Portal Login
            </h1>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Sign in to access your role-based workspace (Admin, Manager, Engineer, or Customer).
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@abecsa.in or client email"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              <span>{loading ? "Verifying Credentials..." : "Access My Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Enterprise Security Notice */}
          <div className="pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enterprise Protected Workspace • TLS 1.3 Encrypted</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Authorized personnel only. All access attempts are logged for security compliance.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
        © 2026 ABECSA Software Solutions. Enterprise Access Protected by TLS 1.3 & Argon2/Bcrypt.
      </div>
    </div>
  );
}
