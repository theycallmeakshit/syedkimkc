# AEGIS-AI: Enterprise AI Security Gateway & SOC Dashboard
> **CyberCup 6.0 — Problem Statement CC6-AI03**  
> *Middleware Reverse-Proxy Pattern for Enterprise LLMs & Access-Controlled RAG*

---

## 1. Executive Summary & Core Problem Addressed
Enterprises face critical compliance, intellectual property, and security exposures when internal employees or contractors feed untrusted prompts and multi-modal attachments into external Large Language Models (LLMs like OpenAI GPT-4, Google Gemini, or Anthropic Claude):

1. **Accidental Data Leakage:** Employees pasting personal identifiers (PAN, Aadhaar, SSN), credit cards, bank accounts, or credentials/API keys into model prompts.
2. **Adversarial Prompt Injections:** Direct and indirect jailbreak signatures ("ignore previous instructions", "system override", Base64 obfuscations, Leetspeak evasions) designed to hijack system prompts and extract confidential internals.
3. **Cross-Tenant / Cross-Role RAG Leakage:** Retrieval-Augmented Generation (RAG) vector stores inadvertently serving Level-3/4 confidential financial and executive documents to Level-1 interns or external contractors.
4. **Egress Canary Leaks:** External LLMs echoing proprietary canary tripwire tokens or internal database connection strings back to end users.

---

## 2. Architecture: Middleware Reverse-Proxy Pattern

```
                       ┌────────────────────────────────────────────────────────┐
                       │               AEGIS-AI SECURITY GATEWAY                │
                       │               (Reverse-Proxy Boundary)                 │
                       ├────────────────────────────────────────────────────────┤
[Client UI]            │ [Stage 1] Inbound Modality Router (Text & Images)      │           [External LLM /
(50/50 Cockpit) <────> │ [Stage 2] OCR & Visual Redaction (cv2.rectangle)       │ <───────>  Vector Store]
                       │ [Stage 3] Sensitive Identifier & PII Sanitizer (Vault) │
                       │ [Stage 4] Prompt Injection Heuristics (403 Forbidden)  │
                       │ [Stage 5] Access-Controlled RAG via RBAC               │
                       │ [Stage 6] Outbound Egress Filter (Canary Neutralizer)  │
                       │ [Stage 7] Telemetry & Zero-Knowledge Audit Log         │
                       └────────────────────────────────────────────────────────┘
```

---

## 3. The 7 Mandatory Pipeline Stages

| Stage | Name | Description & Technology |
|---|---|---|
| **Stage 1** | **Inbound Modality Router** | Validates text payloads and multi-modal uploads (PNG, JPG, WebP), extracts `X-User-Role`, and generates a SHA-256 Zero-Knowledge hash. |
| **Stage 2** | **OCR & Visual Redaction** | Runs local RapidOCR (ONNX) to extract text coordinates and executes **`cv2.rectangle` solid black-out bounding boxes** over sensitive IDs (PAN, DOB, Phone, Financial accounts). |
| **Stage 3** | **Sensitive Identifier & PII Sanitizer** | Regex & NER scanner identifying PAN (`[A-Z]{5}[0-9]{4}[A-Z]{1}`), Aadhaar, SSN, Credit Cards, Bank Accounts, Emails, and API Keys (OpenAI, AWS, Anthropic). Substitutes them with reversible tokens (`{{REDACTED_FINANCIAL_1}}`, `{{REDACTED_IDENTIFIER_1}}`) stored in an in-memory session vault. |
| **Stage 4** | **Prompt Injection Heuristics** | Evaluates direct overrides ("ignore previous instructions", "system override", "DAN"), Base64 obfuscated payloads, and Leetspeak evasions. Triggers an immediate **HTTP 403 Forbidden** security interception. |
| **Stage 5** | **Access-Controlled RAG via RBAC** | Evaluates `X-User-Role` against document metadata classifications (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL_FINANCIAL`, `RESTRICTED_EXECUTIVE`, `SECURITY_AUDIT`). Quarantines unauthorized chunks before LLM prompt composition. |
| **Stage 6** | **Outbound Egress Filter** | Inspects upstream model responses for canary secrets (`AEGIS-CANARY-SEC-99823`), database URLs, or exfiltrated API keys, neutralizing leaks before delivery. |
| **Stage 7** | **Telemetry & Zero-Knowledge Audit Log** | Emits latency metrics, decision action (`ALLOW`, `MASK`, `BLOCK`), risk scoring (0-100), and SHA-256 hashes without storing any raw sensitive plaintext in persistent storage. |

---

## 4. 50/50 Split Cockpit Layout

The interface is built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**:

* **Left Half: User Chat Sandbox**
  * Dynamic `X-User-Role` switcher (`intern`, `contractor`, `employee`, `finance_analyst`, `c_suite_executive`, `security_admin`).
  * One-click Attack and PII preset pills (Direct Jailbreak, Base64 attack, PAN/Bank leak, Cross-role RAG, Canary probe, Sample document loader).
  * Multi-modal file uploader with preview and remove controls.
  * Chat timeline displaying sanitized outputs, latency, risk score, and bold **HTTP 403 Forbidden** interception banners.

* **Right Half: SOC Inspector & Payload Diff Viewer**
  * **Threat Metrics Bar**: Real-time totals of Inspected requests, 403 Blocks, PII tokens sanitized, RBAC quarantines, Canary breaches, and average latency.
  * **Tab 1: 7-Stage Pipeline Visualizer**: Interactive stepper detailing per-stage latency, status, decision, and metadata.
  * **Tab 2: Payload Diff Viewer**: Side-by-side and unified word-level diff (Raw Inbound vs. Sanitized Transmitted, plus Reversible Token Vault and Outbound Egress Guard).
  * **Tab 3: Visual Redaction Studio**: Side-by-side inspection of raw document vs. OpenCV solid blackout redacted image, with bounding box coordinates `[x, y, w, h]` table.
  * **Tab 4: Zero-Knowledge Audit Log**: Searchable, filterable immutable audit table with SHA-256 digests and detail drawer.
  * **Tab 5: RBAC & Security Policy Matrix**: Role clearance permissions vs. data classifications, active canary tripwires, and PII regex catalog.

---

## 5. Quickstart & Running Locally

### Prerequisites
* Node.js v18+ or v20+
* Python 3.10+ (with `rapidocr-onnxruntime`, `opencv-python`, `fastapi`, `uvicorn`)

### Step 1: Install Dependencies
```bash
# Install frontend & gateway packages
npm install

# Install python OCR & cv2 dependencies
pip install rapidocr-onnxruntime opencv-python fastapi uvicorn
```

### Step 2: Start the Python OCR & Visual Redaction Microservice
```bash
python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

### Step 3: Start the Next.js AEGIS-AI Gateway & Cockpit
```bash
# Build and run production server
npm run build
npm run start
# Or start in development mode
# npm run dev
```

### Step 4: Access the Dashboard
Open your browser at:
`http://localhost:3000`

---

## 6. Running Automated Verification Tests
A test suite is included to verify all 7 pipeline stages:
```bash
python tests/test_gateway.py
```
Outputs:
* `TEST 1: Prompt Injection Heuristics (Stage 4)` -> **403 Forbidden (BLOCK)**
* `TEST 2: PII Sanitizer (Stage 3)` -> **200 OK (MASK)**
* `TEST 3: RBAC Cross-Role RAG (Stage 5)` -> **200 OK (MASK - Quarantined)**
* `TEST 4: Outbound Egress Filter (Stage 6)` -> **200 OK (MASK - Canary Caught)**
* `TEST 5: Multi-Modal OCR & cv2.rectangle (Stages 1 & 2)` -> **12 Detections, 4 Solid Blackout Redactions**
* `TEST 6: Zero-Knowledge Audit Log (Stage 7)` -> **SHA-256 Cryptographic Hash Verified**
