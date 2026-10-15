export type UserRole = 
  | 'intern' 
  | 'contractor' 
  | 'employee' 
  | 'finance_analyst' 
  | 'c_suite_executive' 
  | 'security_admin';

export type StageStatus = 'IDLE' | 'PROCESSING' | 'PASSED' | 'MODIFIED' | 'BLOCKED' | 'FAILED';

export type GatewayAction = 'ALLOW' | 'MASK' | 'BLOCK';

export type ThreatCategory = 
  | 'NONE'
  | 'PII_FINANCIAL'
  | 'PII_IDENTIFIER'
  | 'PROMPT_INJECTION_DIRECT'
  | 'PROMPT_INJECTION_BASE64'
  | 'PROMPT_INJECTION_LEET'
  | 'RBAC_RAG_RESTRICTION'
  | 'CANARY_EGRESS_LEAK'
  | 'CREDENTIAL_LEAK';

export interface PipelineStageResult {
  stageNumber: number;
  stageName: string;
  status: StageStatus;
  latencyMs: number;
  decision: 'PASSED' | 'MASKED' | 'BLOCKED';
  summary: string;
  details: string[];
  metadata?: Record<string, any>;
}

export interface RagChunk {
  id: string;
  title: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL_FINANCIAL' | 'RESTRICTED_EXECUTIVE' | 'SECURITY_AUDIT';
  requiredClearanceLevel: number;
  content: string;
  allowed: boolean;
  quarantineReason?: string;
}

export interface OcrDetectionItem {
  text: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  polygon?: number[][];
  is_sensitive: boolean;
  category: string;
  redacted: boolean;
  replacement_token?: string;
}

export interface OcrResultData {
  width: number;
  height: number;
  total_detections: number;
  redacted_count: number;
  redacted_items: Array<{
    original_text: string;
    category: string;
    token: string;
    box: { x: number; y: number; width: number; height: number };
  }>;
  detections: OcrDetectionItem[];
  raw_extracted_text: string;
  sanitized_extracted_text: string;
  original_image_data_url?: string;
  redacted_image_data_url?: string;
  ocr_latency_ms: number;
}

export interface GatewayResponse {
  requestId: string;
  timestamp: string;
  action: GatewayAction;
  httpStatus: number;
  userRole: UserRole;
  riskScore: number;
  threatClassification: ThreatCategory;
  summary: string;
  originalPayload: string;
  sanitizedPayload: string;
  rawModelResponse?: string;
  egressFilteredResponse: string;
  tokenVaultMap: Record<string, string>;
  stageResults: PipelineStageResult[];
  ragMetadata?: {
    totalRetrieved: number;
    allowedCount: number;
    blockedCount: number;
    chunks: RagChunk[];
  };
  ocrData?: OcrResultData;
  zeroKnowledgeHash: string;
  totalLatencyMs: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  clientIp: string;
  userRole: UserRole;
  action: GatewayAction;
  httpStatus: number;
  riskScore: number;
  threat: ThreatCategory;
  summary: string;
  zeroKnowledgeHash: string;
  latencyMs: number;
  piiTokensCount: number;
  ragQuarantinedCount: number;
  canaryDetected: boolean;
  stagesPassed: number;
}
