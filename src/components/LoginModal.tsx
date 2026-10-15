"use client";

import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  Lock,
  Key,
  User,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import { UserAccount, USERS } from "@/lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount, token: string) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<"signin" | "profile">(
    currentUser ? "profile" : "signin"
  );
  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If modal is closed, return null
  if (!isOpen) return null;

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
        onLoginSuccess(data.user, data.token);
        setError("");
        onClose();
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
        onLoginSuccess(data.user, data.token);
        setError("");
        onClose();
      } else {
        setError(data.error || "Failed to authenticate with demo user.");
      }
    } catch {
      setError("Network error authenticating demo user.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="max-w-xl w-full bg-[#111317]/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col p-5 sm:p-6 space-y-4 my-auto relative text-zinc-100"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/8 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Aegis Security Gateway
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">CyberCup 6.0</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
              {currentUser && activeTab === "profile"
                ? "Active Clearance Session"
                : "Enterprise Role Authentication"}
            </h2>
            <p className="text-xs text-zinc-400">
              Zero-Trust Reverse Proxy &amp; Role-Based Access Control (RBAC)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs (when logged in) */}
        {currentUser && (
          <div className="flex items-center p-1 bg-zinc-900/80 rounded-xl border border-white/8 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "profile"
                  ? "bg-white/15 text-zinc-100 border border-white/15 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span className="truncate max-w-[140px]">{currentUser.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "signin"
                  ? "bg-white/15 text-zinc-100 border border-white/15 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Sign In / Switch Role</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* 👤 ACTIVE LOGGED-IN USER PROFILE & SESSION VIEW           */}
        {/* ======================================================== */}
        {currentUser && activeTab === "profile" ? (
          <div className="space-y-4">
            {/* Profile Overview Card */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/8 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-emerald-500/30 text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                {currentUser.avatar || "👤"}
              </div>
              <div className="space-y-0.5 overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-zinc-100 truncate">
                    {currentUser.name}
                  </h3>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getClearanceStyle(
                      currentUser.classification_level
                    )}`}
                  >
                    Level {currentUser.classification_level} {currentUser.clearance}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 truncate">{currentUser.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-sm bg-emerald-400 animate-pulse"></span>
                  <span>Active Session • Gateway Cryptographic Bearer Issued</span>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Official ID &amp; Email
                </span>
                <p className="font-mono text-zinc-200 truncate">{currentUser.email}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Target Pipeline Role
                </span>
                <p className="font-mono text-emerald-400 font-semibold truncate">
                  {currentUser.pipelineRole}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-white/5 space-y-0.5 sm:col-span-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                  Role Authority Summary
                </span>
                <p className="text-zinc-300 text-xs leading-relaxed">{currentUser.description}</p>
              </div>
            </div>

            {/* Permissions Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Granted RBAC Clearance Permissions</span>
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {currentUser.access_permissions.map((perm, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-800/80 border border-white/10 text-zinc-200"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{perm}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons: Sign Out & Switch */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("signin")}
                className="flex-1 py-2 px-3 rounded-lg border border-white/10 glass-pill hover:bg-white/10 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Switch Role</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* 🔑 ENTERPRISE SIGN-IN & 1-CLICK DEMO ACCOUNTS             */
          /* ======================================================== */
          <div className="space-y-4">
            {/* Active user status banner if switching */}
            {currentUser && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-sm bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="truncate">
                    Active: <strong>{currentUser.name}</strong> ({currentUser.roleBadge})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className="underline hover:text-emerald-200 font-semibold ml-2 shrink-0"
                >
                  View Profile
                </button>
              </div>
            )}

            {/* Form */}
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
                <span>{isSubmitting ? "Authenticating..." : "Secure Gateway Login"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-1">
              <div className="border-t border-white/8 w-full"></div>
              <span className="absolute bg-[#111317] px-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                1-Click Evaluator Accounts (CSV Ground-Truth)
              </span>
            </div>

            {/* 4 One-Click Demo Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {USERS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleQuickDemoSelect(acc)}
                  className="p-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-left transition-all duration-150 group cursor-pointer flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{acc.avatar}</span>
                      <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate max-w-[150px]">
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

            {/* Modal Footer */}
            <div className="pt-2 border-t border-white/8 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>HMAC-SHA256 Token Authority • Full RBAC Clearance Enforced</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
