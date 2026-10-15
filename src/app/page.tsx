"use client";

import React, { useState, useEffect } from "react";
import { UserRole, GatewayResponse, AuditLogEntry } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { UserSandbox } from "@/components/UserSandbox";
import { SocInspector } from "@/components/SocInspector";

export default function Home() {
  const [userRole, setUserRole] = useState<UserRole>("intern");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  // Chat timeline
  const [history, setHistory] = useState<Array<{
    id: string;
    prompt: string;
    role: UserRole;
    timestamp: string;
    imagePreview?: string;
    response?: GatewayResponse;
    error?: string;
  }>>([]);

  // Active response currently inspected in SOC
  const [currentResponse, setCurrentResponse] = useState<GatewayResponse | undefined>(undefined);

  // Audit Logs & Metrics
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    blockedRequests: 0,
    maskedRequests: 0,
    piiRedactedCount: 0,
    rbacQuarantinedCount: 0,
    canaryBreachesIntercepted: 0,
    avgLatencyMs: 0
  });

  // Fetch initial audit logs and metrics
  const fetchAuditData = async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setMetrics(data.metrics || metrics);
      }
    } catch (err) {
      console.error("Failed to fetch audit telemetry:", err);
    }
  };

  // Check Python FastAPI OCR health
  const checkBackendHealth = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/health");
      if (res.ok) {
        setIsBackendHealthy(true);
      } else {
        setIsBackendHealthy(false);
      }
    } catch {
      setIsBackendHealthy(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
    checkBackendHealth();
    const interval = setInterval(() => {
      checkBackendHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle sending a payload through the AEGIS-AI Gateway
  const handleSendPayload = async (prompt: string, image?: string, useRag: boolean = true) => {
    setIsLoading(true);
    const interactionId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    try {
      const response = await fetch("/api/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": userRole
        },
        body: JSON.stringify({
          prompt,
          image,
          userRole,
          useRag
        })
      });

      const data: GatewayResponse = await response.json();

      // Add to timeline
      setHistory(prev => [
        ...prev,
        {
          id: interactionId,
          prompt,
          role: userRole,
          timestamp,
          imagePreview: image,
          response: data
        }
      ]);

      // Set as currently active in SOC Inspector
      setCurrentResponse(data);

      // Refresh Audit Log and Metrics
      await fetchAuditData();

    } catch (err: any) {
      console.error("Gateway transmission failed:", err);
      setHistory(prev => [
        ...prev,
        {
          id: interactionId,
          prompt,
          role: userRole,
          timestamp,
          imagePreview: image,
          error: err.message || "Failed to communicate with AEGIS-AI Gateway."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample images (PAN Card or Salary Slip) from FastAPI microservice
  const handleLoadSampleImage = async (type: "pan_card" | "salary_slip"): Promise<string | null> => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/samples");
      if (res.ok) {
        const data = await res.json();
        return data[type] || null;
      }
    } catch (err) {
      console.error("Failed to load sample image:", err);
    }
    return null;
  };

  const handleResetSession = () => {
    setHistory([]);
    setCurrentResponse(undefined);
    fetchAuditData();
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* HEADER / NAVIGATION */}
      <Navbar
        onResetSession={handleResetSession}
        isBackendHealthy={isBackendHealthy}
      />

      {/* 50/50 SPLIT COCKPIT */}
      <div className="flex-1 p-3 md:p-4 max-w-[1920px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[calc(100vh-90px)]">
          {/* LEFT 50%: USER CHAT SANDBOX */}
          <div className="h-full">
            <UserSandbox
              userRole={userRole}
              onRoleChange={setUserRole}
              onSendPayload={handleSendPayload}
              isLoading={isLoading}
              history={history}
              onLoadSampleImage={handleLoadSampleImage}
            />
          </div>

          {/* RIGHT 50%: SOC INSPECTOR & PAYLOAD DIFF VIEWER */}
          <div className="h-full">
            <SocInspector
              currentResponse={currentResponse}
              metrics={metrics}
              auditLogs={auditLogs}
              onRefreshAudit={fetchAuditData}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
