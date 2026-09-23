"""
FinGuard Configuration & Governance Hyperparameters
"""

from dataclasses import dataclass
from typing import Dict

@dataclass(frozen=True)
class FinGuardConfig:
    # 6-Factor Deterministic Risk Engine Weights (Sum of weights: 9.0)
    # W_composite = sum(w_i * f_i) / 45.0 * 100.0
    WEIGHT_DATA_SENSITIVITY: float = 1.2
    WEIGHT_FINANCIAL_MAGNITUDE: float = 1.8
    WEIGHT_IRREVERSIBILITY: float = 2.0
    WEIGHT_EVIDENCE_COVERAGE: float = 1.4
    WEIGHT_TOOL_PRIVILEGE: float = 1.6
    WEIGHT_MODEL_UNCERTAINTY: float = 1.0

    # Static Baseline Thresholds (Empirical Baseline)
    STATIC_TAU_LOW: float = 24.0      # AUTO -> VERIFY cutoff
    STATIC_TAU_MED: float = 49.0      # VERIFY -> APPROVE cutoff
    STATIC_TAU_HIGH: float = 74.0     # APPROVE -> BLOCK cutoff

    # Safety Asymmetric Loss Alpha & Beta
    # Under-conservative threshold prediction is penalized 10x higher
    ASYM_LOSS_ALPHA: float = 10.0
    ASYM_LOSS_BETA: float = 1.0

    # Role Privilege Level Weights
    ROLE_LEVELS: Dict[str, float] = None

    def __post_init__(self):
        object.__setattr__(self, 'ROLE_LEVELS', {
            "ANALYST": 1.0,
            "AUDITOR": 2.0,
            "RISK_MANAGER": 3.0,
            "TREASURY_OFFICER": 4.0,
            "CFO": 5.0
        })

DEFAULT_CONFIG = FinGuardConfig()
