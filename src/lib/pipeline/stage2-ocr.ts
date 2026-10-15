import { OcrResultData, PipelineStageResult } from "../types";

export async function executeStage2OcrRedaction(
  isMultiModal: boolean,
  imageDataUrl?: string
): Promise<{
  stageResult: PipelineStageResult;
  ocrData?: OcrResultData;
  extractedText: string;
}> {
  const start = performance.now();

  if (!isMultiModal || !imageDataUrl) {
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;
    return {
      stageResult: {
        stageNumber: 2,
        stageName: "OCR & Visual Redaction",
        status: "PASSED",
        decision: "PASSED",
        latencyMs: Math.max(1, latencyMs),
        summary: "Bypassed: Inbound payload is text-only (No image file attached).",
        details: [
          "Modality Check: Plaintext payload",
          "Visual Redaction Engine: Idle / Ready for multimodal uploads"
        ]
      },
      extractedText: ""
    };
  }

  try {
    // Call local FastAPI RapidOCR & OpenCV microservice
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch("http://127.0.0.1:8000/api/ocr/redact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageDataUrl }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OCR Microservice returned HTTP ${response.status}`);
    }

    const data: OcrResultData = await response.json();
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;

    const details: string[] = [
      `Engine: RapidOCR (ONNX) + OpenCV cv2.rectangle Solid Blackout`,
      `Total Text Elements Detected: ${data.total_detections}`,
      `Sensitive Identifiers Redacted: ${data.redacted_count}`,
      `Visual Redaction Latency: ${latencyMs}ms (Microservice reported ${data.ocr_latency_ms}ms)`,
    ];

    if (data.redacted_items && data.redacted_items.length > 0) {
      data.redacted_items.forEach((item, idx) => {
        details.push(
          `[Item #${idx + 1}] Category: ${item.category} | Bounding Box: [x:${item.box.x}, y:${item.box.y}, w:${item.box.width}, h:${item.box.height}] -> Token: ${item.token}`
        );
      });
    }

    const stageResult: PipelineStageResult = {
      stageNumber: 2,
      stageName: "OCR & Visual Redaction",
      status: data.redacted_count > 0 ? "MODIFIED" : "PASSED",
      decision: data.redacted_count > 0 ? "MASKED" : "PASSED",
      latencyMs,
      summary: data.redacted_count > 0 
        ? `Applied solid cv2.rectangle blackout bounding boxes to ${data.redacted_count} sensitive identifier(s) detected via OCR.`
        : `OCR completed. No sensitive visual identifiers found in document.`,
      details,
      metadata: {
        totalDetections: data.total_detections,
        redactedCount: data.redacted_count,
        redactedItems: data.redacted_items
      }
    };

    return {
      stageResult,
      ocrData: data,
      extractedText: data.sanitized_extracted_text || data.raw_extracted_text || ""
    };
  } catch (err: any) {
    const latencyMs = Math.round((performance.now() - start) * 10) / 10;
    console.error("Stage 2 OCR Error:", err);

    return {
      stageResult: {
        stageNumber: 2,
        stageName: "OCR & Visual Redaction",
        status: "MODIFIED",
        decision: "MASKED",
        latencyMs,
        summary: `OCR microservice warning: ${err.message || 'Processing fallback'}. Applying defensive redaction mode.`,
        details: [
          `Fallback mode active`,
          `Warning: ${err.message}`
        ]
      },
      extractedText: ""
    };
  }
}
