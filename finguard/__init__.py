"""
FinGuard: Risk-Tiered Financial AI Governance Platform (Python Edition)
=======================================================================
A production-grade governance platform for autonomous financial AI agents.
Features:
  - 6-Factor Deterministic Composite Risk Engine (0-100 scale)
  - Task-Adaptive Dynamic Threshold Predictor (LightGBM / Gradient Boosting)
  - 4-Tier Policy Router (AUTO, VERIFY, APPROVE, BLOCK)
  - Retrieval-Augmented Grounding & Discrepancy Analyzer
  - SHA-256 Tamper-Evident Cryptographic Audit Logging
"""

from .config import FinGuardConfig
from .models import (
    ActionTier,
    TaskContext,
    RiskBreakdown,
    GovernanceDecision,
    AuditLogEntry,
    Document
)
from .risk_engine import RiskEngine
from .dynamic_thresholds import DynamicThresholdModel
from .router import GovernanceRouter
from .rag_engine import FinancialRAGEngine
from .financial_tools import FinancialToolRegistry
from .audit_trail import AuditTrailManager
from .dataset import CALIBRATION_TASKS, FINANCIAL_DOCUMENTS
from .pipeline import FinGuardPipeline

__version__ = "2.4.0"
__all__ = [
    "FinGuardConfig",
    "ActionTier",
    "TaskContext",
    "RiskBreakdown",
    "GovernanceDecision",
    "AuditLogEntry",
    "Document",
    "RiskEngine",
    "DynamicThresholdModel",
    "GovernanceRouter",
    "FinancialRAGEngine",
    "FinancialToolRegistry",
    "AuditTrailManager",
    "CALIBRATION_TASKS",
    "FINANCIAL_DOCUMENTS",
    "FinGuardPipeline"
]
