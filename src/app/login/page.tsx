"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BadgeCheck,
  ArrowLeft,
  Cpu,
} from "lucide-react";
import { UserAccount, USERS } from "@/lib/auth";

export default function StandaloneLoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aegis_user_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) setCurrentUser(parsed.user);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLoginSuccess = (user: UserAccount, token: string) => {
    localStorage.setItem("aegis_user_session", JSON.stringify({ user, token }));
    localStorage.setItem("aegis_role_token", token);
    localStorage.setItem("aegis_user_role", user.pipelineRole);
    setCurrentUser(user);
    setToastMessage(`Signed in as ${user.name}`);
    setTimeout(() => {
      router.push("/");
    }, 800);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Official Email or User ID.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your clearance password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success" && data.user) {
        handleLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch {
      setError("Network or server connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoSelect = async (account: UserAccount) => {
    setIdentifier(account.email);
    setPassword(account.password);
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: account.email,
          password: account.password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success" && data.user) {
        handleLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || "Failed to authenticate with demo user.");
      }
    } catch {
      setError("Network error authenticating demo user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("aegis_user_session");
    localStorage.removeItem("aegis_role_token");
    localStorage.removeItem("aegis_user_role");
    setCurrentUser(null);
    setToastMessage("Signed out of session.");
  };

  const getClearanceStyle = (level: number) => {
    switch (level) {
      case 4:
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case 3:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case 2:
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-zinc-100 flex flex-col justify-between p-4 sm:p-8 relative selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Background ambient dark green glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/5 rounded-3xl blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Header bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between z-10">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 glass-pill hover:bg-white/10 text-xs text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cockpit</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>AEGIS-AI Reverse Proxy Gateway</span>
        </div>
      </header>

      {/* Main card */}
      <main className="max-w-xl w-full mx-auto my-auto z-10 pt-4 pb-8">
        <div
          className="bg-[#121419]/90 border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 backdrop-blur-xl relative"
          style={{
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(16, 185, 129, 0.08)",
          }}
        >
          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Shield className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
                  AEGIS<span className="text-emerald-400">-AI</span> Security Gateway
                </h1>
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                CyberCup 6.0 Enterprise Authentication Portal &bull; Zero-Trust Access Control (RBAC)
              </p>
            </div>
          </div>

          {toastMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {currentUser ? (
            /* Active Profile Display */
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-emerald-500/30 text-2xl flex items-center justify-center shrink-0">
                  {currentUser.avatar}
                </div>
                <div className="space-y-0.5 overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-zinc-100 truncate">{currentUser.name}</h2>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getClearanceStyle(
                        currentUser.classification_level
                      )}`}
                    >
                      L{currentUser.classification_level} {currentUser.clearance}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate">{currentUser.title}</p>
                  <p className="text-[11px] font-mono text-zinc-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Granted Permissions</span>
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {currentUser.access_permissions.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-800/80 border border-white/10 text-zinc-200"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{p}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <span>Launch Gateway Cockpit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 px-4 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Form */
            <div className="space-y-4 pt-1">
              <form onSubmit={handleFormSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-zinc-300">
                    Official Email or User ID
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        setError("");
                      }}
                      placeholder="e.g. madhav.gupta@sentinel.ai or USER-001"
                      className="w-full glass-pill border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-zinc-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Enter clearance password"
                      className="w-full glass-pill border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-colors"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <span>{isSubmitting ? "Authenticating..." : "Sign In with Enterprise Clearance"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* 1-Click Evaluation Accounts */}
              <div className="space-y-2 pt-2 border-t border-white/8">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block text-center">
                  1-Click Evaluator Accounts (From CSV Dataset)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {USERS.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickDemoSelect(acc)}
                      className="p-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-left transition-all duration-150 group cursor-pointer flex flex-col justify-between space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{acc.avatar}</span>
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate max-w-[140px]">
                            {acc.name}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold border ${getClearanceStyle(
                            acc.classification_level
                          )}`}
                        >
                          L{acc.classification_level}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 truncate">{acc.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/5 font-mono">
                        <span className="truncate max-w-[110px]">{acc.email}</span>
                        <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
                          <span>Login</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer badge */}
          <div className="pt-2 border-t border-white/8 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted Tunnel &bull; Zero-Knowledge Audit &bull; SHA-256 HMAC</span>
          </div>
        </div>
      </main>

      <footer className="max-w-4xl w-full mx-auto text-center text-[11px] text-zinc-500 font-mono z-10">
        CyberCup 6.0 &bull; Problem Statement CC6-AI03 &bull; Sentinel AI Gateway
      </footer>
    </div>
  );
}
