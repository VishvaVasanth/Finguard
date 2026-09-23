"""
FinGuard End-to-End Governance Pipeline
=======================================
Orchestrates:
  Task Query -> RAG Grounding & Contradiction Detection ->
  6-Factor Deterministic Risk -> Task-Adaptive Dynamic Cutoffs ->
  4-Tier Policy Routing -> Cryptographic Audit Logging
"""

from typing import Dict, Any, Optional
from .config import DEFAULT_CONFIG, FinGuardConfig
from .models import TaskContext, GovernanceDecision, IntentType
from .risk_engine import RiskEngine
from .dynamic_thresholds import DynamicThresholdModel
from .router import GovernanceRouter
from .rag_engine import FinancialRAGEngine
from .audit_trail import AuditTrailManager
from .dataset import FINANCIAL_DOCUMENTS

class FinGuardPipeline:
    def __init__(self, config: FinGuardConfig = DEFAULT_CONFIG):
        self.config = config
        self.risk_engine = RiskEngine(config)
        self.threshold_model = DynamicThresholdModel(config)
        self.router = GovernanceRouter()
        self.rag_engine = FinancialRAGEngine(FINANCIAL_DOCUMENTS)
        self.audit_manager = AuditTrailManager()

    def evaluate(self, task: TaskContext) -> GovernanceDecision:
        # 1. RAG Retrieval & Citation Grounding
        retrieved = self.rag_engine.retrieve(task.query, top_k=2)
        citations = [
            {"doc_id": doc.doc_id, "title": doc.title, "relevance": score, "snippet": doc.content[:100] + "..."}
            for doc, score in retrieved
        ]

        # 2. Contradiction & Ambiguity Check
        has_conflict, conflict_reason = self.rag_engine.detect_contradiction(task.query, retrieved)
        if has_conflict:
            task.has_conflicts = True

        # 3. 6-Factor Deterministic Risk Calculation (0-100)
        risk_breakdown = self.risk_engine.calculate_risk(task)

        # 4. Task-Adaptive Dynamic Threshold Prediction
        thresholds = self.threshold_model.predict_thresholds(task, risk_breakdown.composite_risk_score)

        # 5. 4-Tier Policy Routing
        decision = self.router.route(task, risk_breakdown, thresholds)
        decision.citations = citations

        # 6. Immutable SHA-256 Audit Trail Entry
        self.audit_manager.record_decision(task, decision)

        return decision

    def quick_evaluate(self, query: str, caller_role: str = "ANALYST") -> GovernanceDecision:
        """Helper to quickly evaluate any arbitrary financial query."""
        lower_q = query.lower()
        
        # Detect adversarial intent
        is_adversarial = any(w in lower_q for w in ["ignore", "bypass", "dump", "master key", "root", "jailbreak"])
        is_wire = any(w in lower_q for w in ["wire", "transfer", "disburse", "pay", "payment"])
        is_conflict = any(w in lower_q for w in ["dispute", "conflict", "penalty", "amendment", "clause"])

        role_levels = {"ANALYST": 1.0, "AUDITOR": 2.0, "RISK_MANAGER": 3.0, "TREASURY_OFFICER": 4.0, "CFO": 5.0}
        role_level = role_levels.get(caller_role.upper(), 1.0)

        task = TaskContext(
            task_id=f"TASK-CLI-{hash(query) % 10000:04d}",
            query=query,
            intent=IntentType.ADVERSARIAL if is_adversarial else (IntentType.TRANSFER if is_wire else IntentType.FINANCIAL_QA),
            financial_magnitude=5.0 if is_wire else 1.5,
            tool_privilege=5.0 if is_wire else (0.0 if not is_adversarial else 5.0),
            caller_role=caller_role.upper(),
            caller_role_level=role_level,
            evidence_coverage=0.3 if is_adversarial else (0.5 if is_conflict else 0.95),
            has_conflicts=is_conflict,
            irreversibility=5.0 if is_wire else 0.0,
            data_sensitivity=5.0 if is_adversarial else (4.0 if is_wire else 1.0),
            model_uncertainty=5.0 if is_adversarial else (4.0 if is_conflict else 1.0),
            adversarial_flag=is_adversarial
        )

        return self.evaluate(task)
