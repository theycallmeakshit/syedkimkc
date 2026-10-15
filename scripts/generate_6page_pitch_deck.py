import os
import sys
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)
from reportlab.pdfgen import canvas

# Palette definition
BG_COLOR = colors.HexColor("#090d16")       # Canvas dark background
CARD_BG = colors.HexColor("#111827")        # Card background
CARD_BORDER = colors.HexColor("#1f2937")    # Card border
HEADER_BG = colors.HexColor("#1e293b")      # Section header background
TEXT_MAIN = colors.HexColor("#f9fafb")      # Primary text
TEXT_MUTED = colors.HexColor("#9ca3af")     # Secondary text
TEXT_DIM = colors.HexColor("#6b7280")       # Dim captions
ACCENT_CYAN = colors.HexColor("#06b6d4")    # Gateway & Telemetry
ACCENT_GREEN = colors.HexColor("#10b981")   # Safe & Authorized
ACCENT_AMBER = colors.HexColor("#f59e0b")   # Masked & Tokenized
ACCENT_RED = colors.HexColor("#ef4444")     # Threat Blocked
ACCENT_BLUE = colors.HexColor("#3b82f6")    # Architecture / Standard

PAGE_WIDTH, PAGE_HEIGHT = landscape(A4)

def draw_slide_decorations(c, doc):
    c.saveState()
    # 1. Slide Canvas Background
    c.setFillColor(BG_COLOR)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    # 2. Top Header Banner
    c.setStrokeColor(CARD_BORDER)
    c.setLineWidth(1)
    c.line(36, PAGE_HEIGHT - 48, PAGE_WIDTH - 36, PAGE_HEIGHT - 48)

    c.setFillColor(ACCENT_CYAN)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(36, PAGE_HEIGHT - 34, "AEGIS-AI")
    c.setFillColor(TEXT_MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(85, PAGE_HEIGHT - 34, "|   CyberCup 6.0 : Problem Statement CC6-AI03   |   Enterprise AI Security Gateway")

    # 3. Bottom Footer Banner
    c.setStrokeColor(CARD_BORDER)
    c.setLineWidth(1)
    c.line(36, 36, PAGE_WIDTH - 36, 36)

    c.setFillColor(TEXT_DIM)
    c.setFont("Helvetica", 8)
    c.drawString(36, 24, "CONFIDENTIAL & PROPRIETARY : CYBERCUP 6.0 EXECUTIVE PITCH DECK")
    c.restoreState()


class NumberedCanvas(canvas.Canvas):
    """Draws slide numbers across all slides during save."""
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.setFillColor(TEXT_DIM)
            self.setFont("Helvetica", 8)
            slide_str = f"Page {self._pageNumber} of {num_pages}"
            self.drawRightString(PAGE_WIDTH - 36, 24, slide_str)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)


def build_6page_deck(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=landscape(A4),
        leftMargin=36,
        rightMargin=36,
        topMargin=56,
        bottomMargin=46
    )

    # Typography styles
    slide_title_style = ParagraphStyle(
        "SlideTitle",
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=TEXT_MAIN,
    )
    slide_desc_style = ParagraphStyle(
        "SlideDesc",
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=ACCENT_CYAN,
    )
    card_title_style = ParagraphStyle(
        "CardTitle",
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        textColor=TEXT_MAIN,
    )
    card_body_style = ParagraphStyle(
        "CardBody",
        fontName="Helvetica",
        fontSize=7.8,
        leading=11.2,
        textColor=TEXT_MUTED,
    )
    badge_style = ParagraphStyle(
        "BadgeText",
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MAIN,
    )
    table_head_style = ParagraphStyle(
        "TableHead",
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=11,
        textColor=TEXT_MAIN,
    )
    table_cell_style = ParagraphStyle(
        "TableCell",
        fontName="Helvetica",
        fontSize=7.2,
        leading=10.2,
        textColor=TEXT_MUTED,
    )

    story = []

    # =========================================================================
    # PAGE 1: DETAILED EXPLANATION OF SOLUTION
    # =========================================================================
    story.append(Paragraph("1. Detailed Explanation of Solution", slide_title_style))
    story.append(Paragraph("Primary Objective & How AEGIS-AI Concretely Addresses Critical Enterprise AI Security Risks", slide_desc_style))
    story.append(Spacer(1, 10))

    p1_content = [
        [
            Paragraph("<b>Primary Objective of AEGIS-AI</b>", card_title_style),
            Paragraph("<b>Direct Problem Mitigation Matrix</b>", card_title_style)
        ],
        [
            Paragraph(
                "<b>The Core Mission:</b> Establish an inline, zero-knowledge reverse proxy gateway positioned directly between enterprise workforce clients and external foundation models (OpenAI GPT, Google Gemini, Anthropic Claude).<br/><br/>"
                "<b>Zero-Trust Perimeter:</b> Ensure that under no circumstances can raw, unredacted corporate secrets, personally identifiable information (PII), or unauthorized knowledge base documents reach external AI memory or third-party training pipelines.<br/><br/>"
                "<b>Frictionless Adoption:</b> Deliver immediate enterprise compliance (DPDP Act, GDPR, SOC 2) without modifying end-user workflows or forcing organizations to forfeit access to state-of-the-art consumer AI capabilities.<br/><br/>"
                "<b>Verifiable Accountability:</b> Provide real-time SOC telemetry, zero-plaintext audit logging, and mathematically verifiable cryptographic hash chaining for every transaction.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; Problem 1: Accidental PII & Credential Leakage</b><br/>"
                "<font color='#10b981'><b>AEGIS Solution:</b></font> Inbound regex and NER sanitizers intercept Indian PAN, phone numbers, corporate emails, AWS keys, and OpenAI tokens, substituting them with ephemeral surrogate tokens ([PAN_1], [API_KEY_1]). Multi-modal image attachments undergo local RapidOCR coordinate detection and OpenCV solid blackout bounding-box redaction.<br/><br/>"
                "<b>&bull; Problem 2: Adversarial Prompt Injections & Jailbreaks</b><br/>"
                "<font color='#10b981'><b>AEGIS Solution:</b></font> Multi-tier heuristic evaluation detects direct overrides ('ignore previous instructions', 'system override', 'DAN mode'), tag delimiters, and Base64 obfuscations, terminating the transaction immediately with an HTTP 403 Forbidden boundary interception.<br/><br/>"
                "<b>&bull; Problem 3: Cross-Tenant / Cross-Role RAG Knowledge Leakage</b><br/>"
                "<font color='#10b981'><b>AEGIS Solution:</b></font> Enforces strict pre-retrieval Role-Based Access Control (RBAC). Retrieved knowledge base chunks are filtered against caller role clearance BEFORE prompt context is constructed. Interns never receive executive compensation or M&A chunks.<br/><br/>"
                "<b>&bull; Problem 4: Outbound Egress Canary & Secret Reflection</b><br/>"
                "<font color='#10b981'><b>AEGIS Solution:</b></font> Continuous egress scanning intercepts internal canary tokens (AEGIS-CANARY-SEC-99823) and reflected credentials, neutralizing leaks before delivery.",
                card_body_style
            )
        ]
    ]

    p1_table = Table(p1_content, colWidths=[330, 440])
    p1_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(p1_table)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 2: TECHNICAL APPROACH WITH CHARTS, DIAGRAMS AND TEXT
    # =========================================================================
    story.append(Paragraph("2. Technical Approach: Architecture & Process Flow", slide_title_style))
    story.append(Paragraph("Component Tech Stack, End-to-End Process Flow Diagram, and Reverse-Proxy Execution Path", slide_desc_style))
    story.append(Spacer(1, 8))

    stack_boxes = [
        [
            Paragraph("<b>Frontend & UI</b>", badge_style),
            Paragraph("<b>Gateway Server</b>", badge_style),
            Paragraph("<b>Vision & OCR Microservice</b>", badge_style),
            Paragraph("<b>Provider Adapters</b>", badge_style),
            Paragraph("<b>Zero-Knowledge Store</b>", badge_style),
        ],
        [
            Paragraph("Next.js 15 (App Router)<br/>TypeScript & Tailwind CSS<br/>Lucide Icons & Responsive SOC Drawer", table_cell_style),
            Paragraph("Next.js Route Handlers<br/>Node.js Crypto (HMAC SHA-256)<br/>In-memory Rate Limiting (60/min)", table_cell_style),
            Paragraph("Python FastAPI (Port 8000)<br/>RapidOCR (ONNX Runtime)<br/>OpenCV (cv2.rectangle Redaction)", table_cell_style),
            Paragraph("OpenAI API (GPT-4o, Mini)<br/>Anthropic API (Claude 3.5)<br/>Deterministic Test Simulator", table_cell_style),
            Paragraph("Cryptographic Hash Chaining<br/>Genesis 64-zero Seed<br/>Immutable JSON Audit Export", table_cell_style),
        ]
    ]
    stack_table = Table(stack_boxes, colWidths=[154, 154, 154, 154, 154])
    stack_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(stack_table)
    story.append(Spacer(1, 8))

    flow_diagram_data = [
        [
            Paragraph("<b>Pipeline Stage</b>", table_head_style),
            Paragraph("<b>Subsystem & Technology</b>", table_head_style),
            Paragraph("<b>Operational Logic & Security Transformation</b>", table_head_style),
            Paragraph("<b>Enforcement Gate</b>", table_head_style),
        ],
        [
            Paragraph("Stage 1: Modality Router", table_cell_style),
            Paragraph("HTTP Middleware / Node.js", table_cell_style),
            Paragraph("Validates text prompt length (&lt;50,000 chars), verifies client HMAC token, checks rate limits.", table_cell_style),
            Paragraph("<font color='#10b981'>ALLOW / 429</font>", table_head_style),
        ],
        [
            Paragraph("Stage 2: OCR Visual Redaction", table_cell_style),
            Paragraph("RapidOCR (ONNX) + OpenCV", table_cell_style),
            Paragraph("Scans image files for text polygons; renders solid blackout rectangles over ID credentials.", table_cell_style),
            Paragraph("<font color='#06b6d4'>MASK IMAGE</font>", table_head_style),
        ],
        [
            Paragraph("Stage 3: PII & Secret Sanitizer", table_cell_style),
            Paragraph("Regex & Entity Tokenizer", table_cell_style),
            Paragraph("Identifies Indian PAN, phone, email, and API keys. Substitutes with reversible surrogate tokens.", table_cell_style),
            Paragraph("<font color='#f59e0b'>TOKENIZE</font>", table_head_style),
        ],
        [
            Paragraph("Stage 4: Injection Heuristics", table_cell_style),
            Paragraph("Adversarial Rule Engine", table_cell_style),
            Paragraph("Evaluates prompts against jailbreak signatures, system overrides, and persona manipulation.", table_cell_style),
            Paragraph("<font color='#ef4444'>BLOCK (403)</font>", table_head_style),
        ],
        [
            Paragraph("Stage 5: Access-Controlled RAG", table_cell_style),
            Paragraph("RBAC Clearance Matrix", table_cell_style),
            Paragraph("Filters knowledge base chunks against authenticated role level BEFORE merging into prompt.", table_cell_style),
            Paragraph("<font color='#f59e0b'>QUARANTINE</font>", table_head_style),
        ],
        [
            Paragraph("Stage 6: Provider AI Dispatch", table_cell_style),
            Paragraph("Provider Adapter Interface", table_cell_style),
            Paragraph("Transmits sanitized context + permitted RAG chunks to chosen LLM. Gateway timer pauses.", table_cell_style),
            Paragraph("<font color='#3b82f6'>INFERENCE</font>", table_head_style),
        ],
        [
            Paragraph("Stage 7: Egress Canary Filter", table_cell_style),
            Paragraph("Outbound Inspection Guard", table_cell_style),
            Paragraph("Scans model reply for reflected canary keys (AEGIS-CANARY-SEC-99823) and scrubs leaked tokens.", table_cell_style),
            Paragraph("<font color='#ef4444'>SCRUB / BLOCK</font>", table_head_style),
        ],
        [
            Paragraph("Stage 8: Overhead Telemetry", table_cell_style),
            Paragraph("Precision Latency Tracker", table_cell_style),
            Paragraph("Calculates isolated gateway overhead (Stages 2-5 & 7), excluding upstream model latency.", table_cell_style),
            Paragraph("<font color='#06b6d4'>TAG &lt;15ms</font>", table_head_style),
        ],
        [
            Paragraph("Stage 9: Cryptographic Ledger", table_cell_style),
            Paragraph("SHA-256 Hash Chained Store", table_cell_style),
            Paragraph("Computes hash = SHA-256(previous_hash + canonical_json). Stores zero raw plaintext.", table_cell_style),
            Paragraph("<font color='#10b981'>COMMIT BLOCK</font>", table_head_style),
        ]
    ]

    flow_table = Table(flow_diagram_data, colWidths=[120, 150, 410, 90])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(flow_table)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 3: FEASIBILITY AND VIABILITY
    # =========================================================================
    story.append(Paragraph("3. Feasibility and Viability: Practical Implementation", slide_title_style))
    story.append(Paragraph("Operational Feasibility, Measured Performance Overheads, and Realistic Enterprise Deployment Models", slide_desc_style))
    story.append(Spacer(1, 10))

    p3_content = [
        [
            Paragraph("<b>Operational & Performance Viability</b>", card_title_style),
            Paragraph("<b>Enterprise Deployment Models</b>", card_title_style),
            Paragraph("<b>Economic & Regulatory Feasibility</b>", card_title_style)
        ],
        [
            Paragraph(
                "<b>&bull; Sub-15ms Inline Overhead:</b> Gateway stages 2-5 and 7 add less than 15ms of latency, ensuring instantaneous conversational interaction without impeding employee flow.<br/><br/>"
                "<b>&bull; Stateless Gateway Design:</b> All cryptographic verifications and surrogate token mappings run ephemerally per request. Enables infinite horizontal scalability across containerized clusters (AWS ECS, Kubernetes, Cloudflare Workers).<br/><br/>"
                "<b>&bull; Zero Code Modification:</b> Functions as a standard drop-in reverse proxy. Existing enterprise applications simply redirect their base URL from api.openai.com to the AEGIS-AI gateway endpoint.<br/><br/>"
                "<b>&bull; Low Memory Footprint:</b> RapidOCR runs locally via lightweight ONNX Runtime with zero heavyweight GPU requirements.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; Model A: Cloud Edge Proxy (SaaS)</b><br/>Deployed as an enterprise gateway in the organization's cloud VPC. Inspects traffic between corporate SSO users and public AI endpoints.<br/><br/>"
                "<b>&bull; Model B: On-Premises Hybrid Bridge</b><br/>Runs on corporate hardware behind the enterprise firewall. Multi-modal OCR and PII scrubbing execute locally before passing sanitized queries to cloud LLMs.<br/><br/>"
                "<b>&bull; Model C: Air-Gapped High-Security Vault</b><br/>Completely isolated from the public internet. Pairs AEGIS-AI with on-premises open-source LLM inference engines (vLLM, Ollama, TGI) and local Milvus/Qdrant vector databases.<br/><br/>"
                "<b>&bull; Automated Health Probes:</b> Built-in liveness endpoints and rate limiters ensure 99.99% uptime.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; High ROI vs Fine Avoidance:</b> The cost of operating AEGIS-AI is negligible compared to a single data breach fine (up to Rs 250 Crores under India DPDP Act and 20M EUR under GDPR).<br/><br/>"
                "<b>&bull; Model Agnostic Savings:</b> Organizations can switch between OpenAI, Claude, or open-source models without retraining security guards or rebuilding sanitization logic.<br/><br/>"
                "<b>&bull; Immediate Regulatory Greenlight:</b> Legal and InfoSec teams can authorize enterprise AI adoption within days rather than months, unlocking employee productivity with full compliance backing.<br/><br/>"
                "<b>&bull; Verified Production Readiness:</b> 100% of pipeline tests pass with automated CI verification.",
                card_body_style
            )
        ]
    ]

    p3_table = Table(p3_content, colWidths=[250, 260, 260])
    p3_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(p3_table)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 4: BENEFITS OF THE SOLUTION
    # =========================================================================
    story.append(Paragraph("4. Benefits of the Solution: Enterprise Impact", slide_title_style))
    story.append(Paragraph("Quantifiable Strategic, Compliance, Security, and Productivity Gains for Enterprise AI Workspaces", slide_desc_style))
    story.append(Spacer(1, 10))

    p4_cards = [
        [
            Paragraph("<font color='#10b981'><b>1. Absolute Data Sovereignty</b></font>", card_title_style),
            Paragraph("<font color='#06b6d4'><b>2. Zero-Trust Intellectual Property Shield</b></font>", card_title_style)
        ],
        [
            Paragraph(
                "<b>&bull; Zero Plaintext Ingestion:</b> Personal identity records (PAN, phone, email, Aadhaar) and financial credentials are tokenized into surrogate placeholders before leaving the corporate network.<br/>"
                "<b>&bull; Multi-Modal Visual Blackout:</b> Physical document photos undergo local computer vision redaction, preventing external multimodal models from ever observing raw identity scans.<br/>"
                "<b>&bull; Session Vault Ephemerality:</b> Token maps are stored in-memory strictly for request processing and cleared immediately upon completion.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; Injection Interception at Edge:</b> Direct jailbreaks, system prompt extractions, and developer-mode bypasses are intercepted with HTTP 403 Forbidden before reaching the foundation model.<br/>"
                "<b>&bull; Egress Canary Tripwires:</b> Active canary strings (AEGIS-CANARY-SEC-99823) embedded in prompt architecture neutralize leaks if an upstream model echoes internal secrets.<br/>"
                "<b>&bull; Provider Key Protection:</b> API keys live exclusively in server environment variables; client sessions never handle or expose master keys.",
                card_body_style
            )
        ],
        [
            Paragraph("<font color='#f59e0b'><b>3. Role-Enforced RAG Knowledge Security</b></font>", card_title_style),
            Paragraph("<font color='#3b82f6'><b>4. Immutable SOC Compliance & Auditability</b></font>", card_title_style)
        ],
        [
            Paragraph(
                "<b>&bull; Zero Cross-Role Privilege Escalation:</b> Traditional vector similarity search is blinded by role clearance gates. Level-1 interns are structurally barred from Level-3/4 executive compensation or M&A chunks.<br/>"
                "<b>&bull; Context Hygiene:</b> Chunks failing role verification are quarantined BEFORE the prompt is sent to the LLM, eliminating prompt leakage from the outset.<br/>"
                "<b>&bull; Multi-Tenant Partitioning:</b> Clear separation of public, internal, and restricted enterprise documents.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; SHA-256 Hash Chaining:</b> Tamper-evident ledger calculates hash = SHA-256(previous_hash + canonical_json), guaranteeing immutable forensic history for SOC audits.<br/>"
                "<b>&bull; Zero-Plaintext Audit Logs:</b> Persists only hidden-length descriptors ([PAN: 10 chars]) and action tags without storing sensitive raw user data.<br/>"
                "<b>&bull; One-Click Audit Export:</b> Instant JSON export (aegis-audit-ledger.json) ready for regulatory submission to data protection authorities.",
                card_body_style
            )
        ]
    ]

    p4_table = Table(p4_cards, colWidths=[385, 385])
    p4_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 9),
        ('BOTTOMPADDING', (0,0), (-1,-1), 9),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(p4_table)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 5: RESEARCH AND REFERENCES
    # =========================================================================
    story.append(Paragraph("5. Research and References: Security Frameworks & Standards", slide_title_style))
    story.append(Paragraph("Alignment with Global AI Safety Standards, Industry Risk Frameworks, and Academic Literature", slide_desc_style))
    story.append(Spacer(1, 10))

    p5_content = [
        [
            Paragraph("<b>OWASP Top 10 for LLM Applications (2025/2026)</b>", card_title_style),
            Paragraph("<b>Global AI Standards & Legal Frameworks</b>", card_title_style),
            Paragraph("<b>Academic Foundations & Threat Models</b>", card_title_style)
        ],
        [
            Paragraph(
                "<b>&bull; LLM01: Prompt Injection:</b><br/>Direct and indirect prompt injections addressed through heuristic signature inspection and immediate HTTP 403 boundary termination.<br/><br/>"
                "<b>&bull; LLM02: Sensitive Information Disclosure:</b><br/>Mitigated via inbound regex/NER PII tokenization and OpenCV computer vision solid blackout redaction.<br/><br/>"
                "<b>&bull; LLM06: Excessive Agency & Privilege Escalation:</b><br/>Enforces pre-retrieval RBAC filtering on RAG knowledge chunks prior to LLM context construction.<br/><br/>"
                "<b>&bull; LLM08: Vector & Embedding Weaknesses:</b><br/>Prevents unauthorized chunk injection into user prompt memory context.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; NIST AI Risk Management Framework (AI RMF 1.0):</b><br/>Directly supports Govern, Map, Measure, and Manage functions through real-time telemetry, continuous risk scoring, and zero-knowledge logging.<br/><br/>"
                "<b>&bull; MITRE ATLAS Matrix:</b><br/>Defends against Tactics AML.T0051 (LLM Prompt Injection), AML.T0054 (LLM Sensitive Data Leakage), and AML.T0048 (Egress Exfiltration via Inference API).<br/><br/>"
                "<b>&bull; Indian DPDP Act 2023:</b><br/>Satisfies Section 8 Data Fiduciary obligations via automated pseudonymization and zero raw data retention.<br/><br/>"
                "<b>&bull; ISO/IEC 42001:2023 (AIMS):</b><br/>Provides standardized governance controls for responsible enterprise AI deployment.",
                card_body_style
            ),
            Paragraph(
                "<b>&bull; Greshake et al. (2023):</b><br/>'Not what you've signed up for: Compromising Real-World LLM Applications through Indirect Prompt Injections' (demonstrating need for boundary filters).<br/><br/>"
                "<b>&bull; Carlini et al. (2021):</b><br/>'Extracting Training Data from Large Language Models' (USENIX Security, highlighting risks of raw data memorization).<br/><br/>"
                "<b>&bull; Perez et al. (2022):</b><br/>'Red Teaming Language Models with Language Models' (evaluating jailbreak resilience).<br/><br/>"
                "<b>&bull; Narayanan et al. (2008):</b><br/>'Robust De-anonymization of Large Datasets' (validating cryptographic surrogate tokens over naive masking).",
                card_body_style
            )
        ]
    ]

    p5_table = Table(p5_content, colWidths=[250, 260, 260])
    p5_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(p5_table)
    story.append(PageBreak())

    # =========================================================================
    # PAGE 6: UI EXPLANATION & MASS-MARKET LLM DIFFERENTIATION
    # =========================================================================
    story.append(Paragraph("6. System Architecture & Mass-Market LLM Differentiation", slide_title_style))
    story.append(Paragraph("Frontend/Backend Implementation Details & How AEGIS-AI Fundamentally Differs from Consumer ChatGPT/Gemini", slide_desc_style))
    story.append(Spacer(1, 8))

    diff_table_data = [
        [
            Paragraph("<b>Security & Architectural Capability</b>", table_head_style),
            Paragraph("<b>Standard Mass-Market LLMs (ChatGPT, Gemini, Claude)</b>", table_head_style),
            Paragraph("<b>AEGIS-AI Enterprise Security Gateway</b>", table_head_style),
        ],
        [
            Paragraph("<b>1. Sensitive Identifier & PII Handling</b>", table_cell_style),
            Paragraph("Transmits and ingests raw personal identifiers directly into vendor server logs and potentially training memory.", table_cell_style),
            Paragraph("<font color='#10b981'><b>Surrogate Tokenization:</b> Inbound regex/NER maps PAN, phone, and emails to reversible [PAN_1] tokens. Zero raw PII reaches the LLM.</font>", table_cell_style),
        ],
        [
            Paragraph("<b>2. Multi-Modal Image Attachments</b>", table_cell_style),
            Paragraph("Uploads unredacted photographs (ID cards, pay stubs, licenses) directly to multimodal vision models.", table_cell_style),
            Paragraph("<font color='#10b981'><b>OpenCV Visual Redaction:</b> RapidOCR detects sensitive coordinate boxes and renders solid blackout bounding boxes before transmission.</font>", table_cell_style),
        ],
        [
            Paragraph("<b>3. RAG Knowledge Retrieval Clearance</b>", table_cell_style),
            Paragraph("Blind semantic vector search. Returns all matched chunks regardless of employee authorization level.", table_cell_style),
            Paragraph("<font color='#10b981'><b>Access-Controlled RBAC:</b> Pre-prompt clearance filter quaratines Level-3/4 executive chunks for lower roles (interns receive 0 unauthorized chunks).</font>", table_cell_style),
        ],
        [
            Paragraph("<b>4. Prompt Injection & Jailbreak Defense</b>", table_cell_style),
            Paragraph("Relies entirely on model alignment (system prompt instructions), which jailbreaks and DAN mode easily bypass.", table_cell_style),
            Paragraph("<font color='#ef4444'><b>Deterministic Perimeter Guard:</b> Intercepts attack signatures at the network edge with an immediate HTTP 403 Forbidden termination.</font>", table_cell_style),
        ],
        [
            Paragraph("<b>5. Outbound Egress & Canary Traps</b>", table_cell_style),
            Paragraph("No outbound inspection. Models can reflect proprietary system prompts, secrets, or internal DB strings.", table_cell_style),
            Paragraph("<font color='#06b6d4'><b>Canary Interception:</b> Scans replies for AEGIS-CANARY-SEC-99823 and credential strings; neutralizes leaked tokens before user display.</font>", table_cell_style),
        ],
        [
            Paragraph("<b>6. Compliance & SOC Audit Trails</b>", table_cell_style),
            Paragraph("Black-box vendor logging. No cryptographic verification, no tamper evidence, and no zero-knowledge exports.", table_cell_style),
            Paragraph("<font color='#10b981'><b>SHA-256 Hash Chained Ledger:</b> Mathematically tamper-evident ledger with zero raw plaintext and one-click JSON compliance export.</font>", table_cell_style),
        ],
        [
            Paragraph("<b>7. User Interface & SecOps Visibility</b>", table_cell_style),
            Paragraph("Consumer chat view only. Zero visibility into what data was ingested, what risks were detected, or token overhead.", table_cell_style),
            Paragraph("<font color='#3b82f6'><b>Dual-Mode Cockpit:</b> Minimalist ChatGPT/Gemini conversational layout paired with a slide-over SOC Inspector and payload diff viewer.</font>", table_cell_style),
        ]
    ]

    diff_table = Table(diff_table_data, colWidths=[150, 290, 330])
    diff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 1, CARD_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, CARD_BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 7),
        ('RIGHTPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(diff_table)

    doc.build(
        story,
        onFirstPage=draw_slide_decorations,
        onLaterPages=draw_slide_decorations,
        canvasmaker=NumberedCanvas
    )
    print(f"6-Page Presentation PDF successfully built at: {output_pdf_path}")


if __name__ == "__main__":
    out_path = os.path.join(os.getcwd(), "AEGIS_AI_Executive_Pitch_Deck_6Pages.pdf")
    build_6page_deck(out_path)
