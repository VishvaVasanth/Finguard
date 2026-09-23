export type UserRole = 'USER' | 'ADMIN' | 'REVIEWER' | 'DOMAIN_EXPERT';

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GovernanceMode = 'AUTO' | 'VERIFY' | 'APPROVE' | 'ESCALATE' | 'BLOCK';

export type RequestStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'WAITING_FOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'BLOCKED'
  | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  authorizedAccounts?: string[];
  transferLimitDaily?: number;
}

export interface RiskVector {
  sensitivity: number; // 0-5
  financial_impact: number; // 0-5
  irreversibility: number; // 0-5
  evidence_requirement: number; // 0-5
  tool_risk: number; // 0-5
  model_uncertainty: number; // 0-5
}

export interface RiskAssessment {
  vector: RiskVector;
  score: number; // 0-100 normalized
  tier: RiskTier;
  factors: string[];
}

export interface EvidenceItem {
  id: string;
  document_id: string;
  document_title: string;
  chunk_id: string;
  text: string;
  page?: number;
  section?: string;
  relevance_score: number; // 0-1
  retrieval_method: 'lexical' | 'vector' | 'hybrid';
  conflicts_with?: string;
}

export interface ToolExecutionRecord {
  tool_id: string;
  tool_name: string;
  arguments: Record<string, any>;
  result?: any;
  executed: boolean;
  blocked_reason?: string;
  timestamp: string;
}

export interface ReviewMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  message: string;
  visibility: 'USER_VISIBLE' | 'PRIVATE';
  created_at: string;
}

export interface ReviewTask {
  id: string;
  request_id: string;
  assigned_role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  decision_notes?: string;
  decided_at?: string;
  decided_by?: string;
  messages: ReviewMessage[];
  created_at: string;
}

export interface GovernancePolicy {
  id: string;
  version: string;
  name: string;
  description: string;
  is_active: boolean;
  weights: {
    sensitivity: number;
    financial_impact: number;
    irreversibility: number;
    evidence_requirement: number;
    tool_risk: number;
    model_uncertainty: number;
  };
  thresholds: {
    low_max: number; // default 24
    medium_max: number; // default 49
    high_max: number; // default 74
  };
  evidence_coverage_threshold: number; // e.g. 0.75
  uncertainty_threshold: 'LOW' | 'MEDIUM' | 'HIGH';
  created_by: string;
  created_at: string;
  hash: string;
}

export interface FinancialTool {
  tool_id: string;
  name: string;
  description: string;
  risk_level: number; // 0-5
  allowed_roles: UserRole[];
  allowed_risk_tiers: RiskTier[];
  requires_approval: boolean;
  requires_evidence: boolean;
  irreversible: boolean;
  enabled: boolean;
  version: string;
}

export interface AuditEvent {
  id: string;
  request_id: string;
  trace_id: string;
  timestamp: string;
  node_name: string;
  action: string;
  summary: string;
  details?: Record<string, any>;
}

export interface RequestRecord {
  request_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  conversation_id: string;
  request_text: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  intent: string;
  task_type: string;
  governance_mode: GovernanceMode;
  risk_assessment: RiskAssessment;
  evidence_items: EvidenceItem[];
  evidence_coverage: number;
  uncertainty_level: 'LOW' | 'MEDIUM' | 'HIGH';
  safe_response: string;
  calculation_details?: string;
  yearly_data_table?: {
    headers: string[];
    rows: (string | number)[][];
  };
  model_used?: string;
  tool_calls: ToolExecutionRecord[];
  review_task?: ReviewTask;
  trace_id: string;
  prompt_injection_detected?: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  request_id?: string;
  type:
    | 'REQUEST_RECEIVED'
    | 'WAITING_FOR_REVIEW'
    | 'MORE_INFORMATION_REQUIRED'
    | 'APPROVED'
    | 'REJECTED'
    | 'ESCALATED'
    | 'BLOCKED'
    | 'COMPLETED';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface FinancialAccount {
  id: string;
  user_id: string;
  account_name: string;
  account_number_masked: string;
  account_type: 'CHECKING' | 'SAVINGS' | 'BUSINESS' | 'INVESTMENT';
  balance: number;
  currency: string;
  monthly_budget: number;
  monthly_spent: number;
}

export interface FinancialTransaction {
  id: string;
  account_id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  category: 'OPERATIONS' | 'FOOD_DINING' | 'UTILITIES' | 'SUPPLIES' | 'LEGAL_COMPLIANCE' | 'REVENUE' | 'TRANSFER';
  date: string;
  status: 'SETTLED' | 'PENDING' | 'FLAGGED';
}

export interface DocumentRecord {
  id: string;
  title: string;
  category: 'ANNUAL_REPORT' | 'CONTRACT' | 'POLICY' | 'TREASURY' | 'AUDIT';
  effective_date: string;
  content: string;
  chunks: {
    id: string;
    section: string;
    page: number;
    text: string;
  }[];
  authorized_roles: UserRole[];
  has_conflicts?: boolean;
  contains_adversarial_payload?: boolean;
}

export interface FinancialTask {
  task_id: string;
  dataset: 'FinanceBench' | 'TAT-QA' | 'FinOps Suite';
  split: 'DEVELOPMENT' | 'CALIBRATION' | 'HELD_OUT_TEST';
  question: string;
  intent: string;
  expected_answer: string;
  expected_action: string;
  required_evidence: string;
  allowed_tools: string[];
  success_criteria: string;
  risk_attributes: {
    sensitivity: number;
    financial_impact: number;
    irreversibility: number;
  };
  adversarial_flags: boolean;
}

export interface ExperimentRun {
  id: string;
  name: string;
  dataset: string;
  split: 'DEVELOPMENT' | 'CALIBRATION' | 'HELD_OUT_TEST';
  policy_id: string;
  model: string;
  sample_size: number;
  timestamp: string;
  metrics: {
    safety_score: number; // 0-100
    incident_rate: number; // %
    human_intervention_rate: number; // %
    task_success_rate: number; // %
    unsupported_claim_rate: number; // %
    avg_latency_ms: number;
    pareto_optimal: boolean;
  };
}
