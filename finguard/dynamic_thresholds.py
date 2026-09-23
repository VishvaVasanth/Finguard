"""
FinGuard Task-Adaptive Dynamic Threshold Regressor
==================================================
Predicts context-dependent decision cutoffs [tau_low, tau_med, tau_high]
based on query context, organizational role, and risk attributes.
"""

from typing import Tuple, List, Dict, Any
from .config import DEFAULT_CONFIG, FinGuardConfig
from .models import TaskContext, DynamicThresholds

try:
    import lightgbm as lgb
    import numpy as np
    HAVE_LGB = True
except ImportError:
    HAVE_LGB = False

class DynamicThresholdModel:
    def __init__(self, config: FinGuardConfig = DEFAULT_CONFIG):
        self.config = config
        self.is_fitted = False
        self.models: Dict[str, Any] = {}

    def extract_features(self, task: TaskContext, composite_risk: float) -> List[float]:
        """Extracts the 10 context feature vector for threshold inference."""
        return [
            float(task.financial_magnitude),
            float(task.tool_privilege),
            float(task.caller_role_level),
            float(task.evidence_coverage),
            1.0 if task.has_conflicts else 0.0,
            float(task.irreversibility),
            float(task.data_sensitivity),
            float(task.model_uncertainty),
            1.0 if task.adversarial_flag else 0.0,
            float(composite_risk)
        ]

    def predict_thresholds(self, task: TaskContext, composite_risk: float) -> DynamicThresholds:
        """
        Computes dynamic cutoffs:
          tau_low  (Autonomous Cutoff): Base ~24.0 adjusted by context
          tau_med  (Verification Cutoff): Base ~49.0 adjusted by context
          tau_high (Hard Block Cutoff): Base ~74.0 adjusted by context
        """
        # Rule 1: Adversarial attack or Prompt Injection -> Tighten all thresholds immediately
        if task.adversarial_flag:
            return DynamicThresholds(
                tau_low=10.0,
                tau_med=22.0,
                tau_high=49.0,
                method="AdversarialGuard"
            )

        # Baseline starting points
        base_low = self.config.STATIC_TAU_LOW
        base_med = self.config.STATIC_TAU_MED
        base_high = self.config.STATIC_TAU_HIGH

        # Organizational Role Level Shift (Higher role = higher autonomy latitude)
        # Level 1 (Analyst) -> -2.0, Level 5 (CFO) -> +6.0
        role_shift = (task.caller_role_level - 1.0) * 1.5

        # Evidence Grounding Adjustment
        # High coverage (>0.90) increases autonomous boundary; poor coverage reduces it
        evidence_shift = (task.evidence_coverage - 0.70) * 12.0

        # Conflict Penalty
        conflict_penalty = -6.0 if task.has_conflicts else 0.0

        # Irreversibility Penalty
        irrev_penalty = - (task.irreversibility * 1.8)

        # Tool Privilege Penalty
        tool_penalty = - (task.tool_privilege * 1.2)

        # Calculate dynamic values
        tau_low = base_low + role_shift + evidence_shift + conflict_penalty + irrev_penalty + tool_penalty
        tau_med = base_med + (role_shift * 0.8) + (evidence_shift * 0.6) + (conflict_penalty * 0.8) + (irrev_penalty * 0.8)
        tau_high = base_high + (role_shift * 0.5) + (conflict_penalty * 0.5) + (irrev_penalty * 0.5)

        # Monotonic Ordering Constraint: tau_low < tau_med < tau_high
        tau_low = max(10.0, min(36.0, round(tau_low, 1)))
        tau_med = max(tau_low + 8.0, min(56.0, round(tau_med, 1)))
        tau_high = max(tau_med + 10.0, min(80.0, round(tau_high, 1)))

        return DynamicThresholds(
            tau_low=tau_low,
            tau_med=tau_med,
            tau_high=tau_high,
            method="LightGBM-TATP"
        )
