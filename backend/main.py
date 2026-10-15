from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
from typing import Optional

from backend.ocr_engine import process_and_redact_image
from backend.sample_generator import generate_sample_pan_card, generate_sample_salary_slip

app = FastAPI(title="AEGIS-AI OCR & Visual Redaction Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RedactionRequest(BaseModel):
    image_base64: str  # Can be data URL or raw base64 string
    mime_type: Optional[str] = "image/png"

@app.get("/health")
def health():
    return {"status": "ok", "service": "AEGIS-AI-Visual-Redactor", "engine": "RapidOCR+OpenCV"}

@app.get("/api/samples")
def get_sample_documents():
    return {
        "pan_card": generate_sample_pan_card(),
        "salary_slip": generate_sample_salary_slip()
    }

@app.post("/api/ocr/redact")
def redact_image_endpoint(req: RedactionRequest):
    try:
        raw_b64 = req.image_base64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",")[1]
            
        img_bytes = base64.b64decode(raw_b64)
        result = process_and_redact_image(img_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
