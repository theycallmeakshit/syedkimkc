import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "404: Page Not Found | Aegis Guard",
  description: "The requested resource could not be found.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#212121] text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full space-y-4">
        <div className="w-10 h-10 mx-auto rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <Shield className="w-5 h-5 text-emerald-500" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-100">404: Page not found</h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The requested page does not exist or has been relocated.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 border border-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
          >
            Return to gateway
          </Link>
        </div>
      </div>
    </div>
  );
}
