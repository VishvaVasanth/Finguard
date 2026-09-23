"""
FinGuard Data Models & Core Dataclasses
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional, Any
import time

class ActionTier(str, Enum):
    AUTO = "AUTO"          # Low Risk: Autonomous Execution with Citations
    VERIFY = "VERIFY"      # Moderate Risk: Highlight & Discrepancy Resolution
    APPROVE = "APPROVE"    # High Exposure: Human-in-the-Loop Signoff Required
    BLOCK = "BLOCK"        # Critical Risk / Adversarial: Quarantined & Denied

class IntentType(str, Enum):
    FINANCIAL_QA = "FINANCIAL_QA"
    CALCULATION = "CALCULATION"
    CONFLICT_ANALYSIS = "CONFLICT_ANALYSIS"
    TRANSFER = "TRANSFER"
    CONTRACT_MODIFICATION = "CONTRACT_MODIFICATION"
    ADVERSARIAL = "ADVERSARIAL"

@dataclass
class TaskContext:
    task_id: str
    query: str
    intent: IntentType = IntentType.FINANCIAL_QA
    financial_magnitude: float = 1.0     # Scale 1.0 - 5.0
    tool_privilege: float = 0.0          # Scale 0.0 - 5.0
    caller_role: str = "ANALYST"         # ANALYST, AUDITOR, RISK_MANAGER, TREASURY_OFFICER, CFO
    caller_role_level: float = 1.0       # Scale 1.0 - 5.0
    evidence_coverage: float = 0.9       # Scale 0.0 - 1.0
    has_conflicts: bool = False          # Document contradiction flag
    irreversibility: float = 0.0         # Scale 0.0 - 5.0
    data_sensitivity: float = 1.0        # Scale 1.0 - 5.0
    model_uncertainty: float = 1.0       # Scale 1.0 - 5.0
    adversarial_flag: bool = False       # Prompt injection / jailbreak detected
    dataset_source: str = "FinanceBench"

@dataclass
class RiskBreakdown:
    data_sensitivity_score: float
    financial_magnitude_score: float
    irreversibility_score: float
    evidence_coverage_penalty: float
    tool_privilege_score: float
    model_uncertainty_score: float
    composite_risk_score: float

@dataclass
class DynamicThresholds:
    tau_low: float      # Cutoff for Autonomous Execution
    tau_med: float      # Cutoff for Verification Flag
    tau_high: float     # Cutoff for Human Approval vs Block
    method: str = "LightGBM"

@dataclass
class GovernanceDecision:
    task_id: str
    action: ActionTier
    composite_risk_score: float
    thresholds: DynamicThresholds
    risk_breakdown: RiskBreakdown
    reasoning: str
    quarantined: bool = False
    review_queue: Optional[str] = None
    citations: List[Dict[str, Any]] = field(default_factory=list)
    timestamp: float = field(default_factory=time.time)

@dataclass
class AuditLogEntry:
    entry_id: str
    task_id: str
    query: str
    caller_role: str
    composite_risk_score: float
    decision_action: ActionTier
    thresholds: Dict[str, float]
    sha256_hash: str
    previous_hash: str
    timestamp: float = field(default_factory=time.time)

@dataclass
class Document:
    doc_id: str
    title: str
    ticker: str
    doc_type: str
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
