"""
FinGuard: Enterprise Financial AI Governance & Risk Engine (Python Edition)
Core 6-Factor Deterministic Risk Engine and Policy State
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import math

@dataclass
class RiskAttributes:
    data_sensitivity: float       # w1 = 1.2 (Scale 0-5)
    financial_impact: float       # w2 = 1.8 (Scale 0-5)
    irreversibility: float        # w3 = 2.0 (Scale 0-5)
    evidence_coverage: float      # w4 = 1.4 (Scale 0.0-1.0, inverted to risk 0-5)
    tool_privilege: float         # w5 = 1.6 (Scale 0-5)
    model_uncertainty: float      # w6 = 1.0 (Scale 0-5)

@dataclass
class GovernanceDecision:
    composite_risk_score: float
    action: str                   # 'AUTO', 'VERIFY', 'APPROVE', 'BLOCK'
    thresholds_applied: Dict[str, float]
    factor_breakdown: Dict[str, float]
    requires_human_signoff: bool
    quarantine_triggered: bool
    explanation: str

class FinGuardRiskEngine:
    """
    Implements deterministic 6-factor multi-dimensional risk assessment
    with task-adaptive threshold routing.
    """
    def __init__(self):
        # Default baseline weights
        self.weights = {
            'w_sens': 1.2,
            'w_fin': 1.8,
            'w_irrev': 2.0,
            'w_evid': 1.4,
            'w_tool': 1.6,
            'w_uncert': 1.0
        }
        self.total_weight = sum(self.weights.values()) # 9.0

        # Global static baseline thresholds (can be overridden dynamically)
        self.static_thresholds = {
            'low_max': 24.0,
            'med_max': 49.0,
            'high_max': 74.0
        }

    def calculate_composite_risk(self, attrs: RiskAttributes) -> Tuple[float, Dict[str, float]]:
        """
        Computes composite risk score: R = [sum(w_i * f_i) / (5 * sum(w_i))] * 100
        Normalized strictly to [0.0, 100.0].
        """
        # Invert evidence coverage (high coverage -> low risk)
        evidence_risk = max(0.0, min(5.0, (1.0 - attrs.evidence_coverage) * 5.0))

        # Clamp all input factors to 0-5 scale
        f_sens = max(0.0, min(5.0, attrs.data_sensitivity))
        f_fin = max(0.0, min(5.0, attrs.financial_impact))
        f_irrev = max(0.0, min(5.0, attrs.irreversibility))
        f_evid = evidence_risk
        f_tool = max(0.0, min(5.0, attrs.tool_privilege))
        f_uncert = max(0.0, min(5.0, attrs.model_uncertainty))

        weighted_sum = (
            f_sens * self.weights['w_sens'] +
            f_fin * self.weights['w_fin'] +
            f_irrev * self.weights['w_irrev'] +
            f_evid * self.weights['w_evid'] +
            f_tool * self.weights['w_tool'] +
            f_uncert * self.weights['w_uncert']
        )

        max_possible_weighted = 5.0 * self.total_weight
        normalized_score = round((weighted_sum / max_possible_weighted) * 100.0, 1)

        breakdown = {
            'data_sensitivity_weighted': round(f_sens * self.weights['w_sens'], 2),
            'financial_impact_weighted': round(f_fin * self.weights['w_fin'], 2),
            'irreversibility_weighted': round(f_irrev * self.weights['w_irrev'], 2),
            'evidence_coverage_weighted': round(f_evid * self.weights['w_evid'], 2),
            'tool_execution_weighted': round(f_tool * self.weights['w_tool'], 2),
            'model_uncertainty_weighted': round(f_uncert * self.weights['w_uncert'], 2),
        }

        return normalized_score, breakdown

    def route_decision(
        self,
        risk_score: float,
        has_conflict: bool = False,
        is_adversarial: bool = False,
        custom_thresholds: Optional[Dict[str, float]] = None
    ) -> GovernanceDecision:
        """
        Routes the task into AUTO, VERIFY, APPROVE, or BLOCK
        using calibrated or dynamic thresholds.
        """
        thresholds = custom_thresholds or self.static_thresholds
        low_max = thresholds.get('low_max', 24.0)
        med_max = thresholds.get('med_max', 49.0)
        high_max = thresholds.get('high_max', 74.0)

        # Adversarial Prompt Injection Hard Halt
        if is_adversarial:
            return GovernanceDecision(
                composite_risk_score=100.0,
                action='BLOCK',
                thresholds_applied=thresholds,
                factor_breakdown={},
                requires_human_signoff=False,
                quarantine_triggered=True,
                explanation="ADVERSARIAL ATTACK INTERCEPTED: Unauthorized prompt injection detected. Quarantined."
            )

        # Contradiction Handling (e.g. Master agreement vs disputed draft)
        if has_conflict and risk_score <= med_max:
            return GovernanceDecision(
                composite_risk_score=risk_score,
                action='VERIFY',
                thresholds_applied=thresholds,
                factor_breakdown={},
                requires_human_signoff=False,
                quarantine_triggered=False,
                explanation="DOCUMENT CONFLICT: Discrepancy identified across filings. Paused for user verification."
            )

        # Standard 4-Tier Cutoff Evaluation
        if risk_score <= low_max:
            action = 'AUTO'
            requires_human = False
            explanation = f"Autonomous execution permitted (Risk Score: {risk_score} <= {low_max})."
        elif risk_score <= med_max:
            action = 'VERIFY'
            requires_human = False
            explanation = f"Verification required: moderate complexity (Risk Score: {risk_score} in {low_max}-{med_max})."
        elif risk_score <= high_max:
            action = 'APPROVE'
            requires_human = True
            explanation = f"Human signoff required: high liability (Risk Score: {risk_score} in {med_max}-{high_max})."
        else:
            action = 'BLOCK'
            requires_human = False
            explanation = f"Execution blocked: critical threshold exceeded (Risk Score: {risk_score} > {high_max})."

        return GovernanceDecision(
            composite_risk_score=risk_score,
            action=action,
            thresholds_applied=thresholds,
            factor_breakdown={},
            requires_human_signoff=requires_human,
            quarantine_triggered=False,
            explanation=explanation
        )
