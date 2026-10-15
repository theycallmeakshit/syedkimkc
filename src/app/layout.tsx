import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AEGIS-AI | Enterprise AI Security Gateway & SOC Dashboard",
  description: "CyberCup 6.0 Problem Statement CC6-AI03: Reverse-Proxy Security Gateway, Visual OCR Redaction, PII Tokenization, Prompt Injection Guard, Access-Controlled RAG, Outbound Egress Filter, and Zero-Knowledge Audit Logging.",
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://gateway.aegis-ai.internal"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080d1a] text-slate-100 antialiased selection:bg-cyan-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
