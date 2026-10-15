"use client";

import React, { useState } from "react";
import { OcrResultData } from "@/lib/types";
import { Scan, Eye, EyeOff, ShieldCheck, CheckCircle2, Box } from "lucide-react";

interface VisualRedactionViewerProps {
  ocrData?: OcrResultData;
}

export const VisualRedactionViewer: React.FC<VisualRedactionViewerProps> = ({ ocrData }) => {
  const [viewMode, setViewMode] = useState<"sideBySide" | "redactedOnly" | "originalOnly">("sideBySide");
  const [showBoxesOverlay, setShowBoxesOverlay] = useState<boolean>(true);

  if (!ocrData || !ocrData.original_image_data_url) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
          <Scan className="w-6 h-6" />
        </div>
        <div className="text-sm font-semibold text-slate-300">No Visual Document Inspected Yet</div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Upload an image file (e.g. PAN Card, Invoice, Salary Slip) or click one of the preset sample document buttons in the Sandbox to inspect local RapidOCR and OpenCV <code className="text-cyan-400">cv2.rectangle</code> visual blackout redaction in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewMode("sideBySide")}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === "sideBySide"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Side-by-Side Diff
            </button>
            <button
              onClick={() => setViewMode("redactedOnly")}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === "redactedOnly"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Redacted (OpenCV)
            </button>
            <button
              onClick={() => setViewMode("originalOnly")}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === "originalOnly"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Original Raw
            </button>
          </div>

          <button
            onClick={() => setShowBoxesOverlay(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono border flex items-center gap-1.5 transition-colors ${
              showBoxesOverlay
                ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-300"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Overlay Boxes</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
            OCR: {ocrData.ocr_latency_ms}ms
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 font-bold">
            {ocrData.redacted_count} Sensitive IDs Blacked Out
          </span>
        </div>
      </div>

      {/* Visual Canvas Display */}
      <div className={`grid gap-3 ${viewMode === "sideBySide" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {/* ORIGINAL IMAGE */}
        {(viewMode === "sideBySide" || viewMode === "originalOnly") && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden flex flex-col">
            <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                Raw Uploaded Image (Pre-Sanitization)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {ocrData.width} × {ocrData.height} px
              </span>
            </div>
            <div className="p-3 flex items-center justify-center bg-slate-900/30 overflow-hidden relative">
              <img
                src={ocrData.original_image_data_url}
                alt="Original document"
                className="max-h-[340px] w-auto object-contain rounded-lg border border-slate-800 shadow-md"
              />
            </div>
          </div>
        )}

        {/* REDACTED IMAGE (CV2.RECTANGLE BLACKOUT) */}
        {(viewMode === "sideBySide" || viewMode === "redactedOnly") && (
          <div className="rounded-xl border border-rose-900/50 bg-slate-950/80 overflow-hidden flex flex-col">
            <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                Redacted Image (cv2.rectangle Blackout)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                SOLID BLACKOUT APPLIED
              </span>
            </div>
            <div className="p-3 flex items-center justify-center bg-slate-900/30 overflow-hidden relative">
              <img
                src={ocrData.redacted_image_data_url}
                alt="Redacted document"
                className="max-h-[340px] w-auto object-contain rounded-lg border border-rose-950 shadow-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* DETECTIONS & COORDINATES TABLE */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="font-semibold text-slate-200 flex items-center gap-2">
            <Scan className="w-3.5 h-3.5 text-cyan-400" />
            Detected OCR Entities & Bounding Box Coordinates
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {ocrData.total_detections} Total Detections
          </span>
        </div>

        <div className="overflow-x-auto max-h-[220px]">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2 px-3">Classification</th>
                <th className="py-2 px-3">Detected Text String</th>
                <th className="py-2 px-3">Bounding Box [x, y, w, h]</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Assigned Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 bg-slate-900/40">
              {ocrData.detections.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/40 ${
                    item.redacted ? "bg-rose-950/20" : ""
                  }`}
                >
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.redacted
                          ? "bg-rose-900/60 text-rose-300 border border-rose-700/60"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-200 font-semibold truncate max-w-[200px]" title={item.text}>
                    {item.text}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">
                    [{item.box.x}, {item.box.y}, {item.box.width}, {item.box.height}]
                  </td>
                  <td className="py-2 px-3">
                    {item.redacted ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                        <EyeOff className="w-3 h-3" /> BLACKOUT
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PASSED
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-emerald-400 font-bold text-[11px]">
                    {item.replacement_token || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
