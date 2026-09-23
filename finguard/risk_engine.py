"""
FinGuard 6-Factor Deterministic Risk Engine
===========================================
Calculates deterministic composite risk on a 0-100 scale:
  R_composite = [ sum(w_i * f_i) / Max_Weighted_Score ] * 100

Factors:
  1. Data Sensitivity (w=1.2, scale 1-5)
  2. Financial Magnitude (w=1.8, scale 1-5)
  3. Action Irreversibility (w=2.0, scale 0-5)
  4. Evidence Grounding Gap: (1.0 - Evidence_Coverage) * 5.0 (w=1.4)
  5. Tool Execution Privilege (w=1.6, scale 0-5)
  6. Model Uncertainty / Ambiguity (w=1.0, scale 1-5)
"""

from .config import DEFAULT_CONFIG, FinGuardConfig
from .models import TaskContext, RiskBreakdown

class RiskEngine:
    def __init__(self, config: FinGuardConfig = DEFAULT_CONFIG):
        self.config = config

    def calculate_risk(self, task: TaskContext) -> RiskBreakdown:
        # Prompt injection / jailbreak instantly triggers max risk
        if task.adversarial_flag:
            return RiskBreakdown(
                data_sensitivity_score=5.0,
                financial_magnitude_score=5.0,
                irreversibility_score=5.0,
                evidence_coverage_penalty=5.0,
                tool_privilege_score=5.0,
                model_uncertainty_score=5.0,
                composite_risk_score=98.9
            )

        # 1. Data Sensitivity (1 to 5)
        f_sens = max(1.0, min(5.0, float(task.data_sensitivity)))

        # 2. Financial Magnitude (1 to 5)
        f_fin = max(1.0, min(5.0, float(task.financial_magnitude)))

        # 3. Action Irreversibility (0 to 5)
        f_irrev = max(0.0, min(5.0, float(task.irreversibility)))

        # 4. Evidence Grounding Gap: Inverted coverage (0.0 to 1.0 -> 5.0 to 0.0)
        # Low coverage = high risk penalty
        coverage = max(0.0, min(1.0, float(task.evidence_coverage)))
        f_evid = (1.0 - coverage) * 5.0
        if task.has_conflicts:
            f_evid = min(5.0, f_evid + 1.5)

        # 5. Tool Execution Privilege (0 to 5)
        f_tool = max(0.0, min(5.0, float(task.tool_privilege)))

        # 6. Model Uncertainty (1 to 5)
        f_uncert = max(1.0, min(5.0, float(task.model_uncertainty)))

        # Weighted Sum
        weighted_sum = (
            self.config.WEIGHT_DATA_SENSITIVITY * f_sens +
            self.config.WEIGHT_FINANCIAL_MAGNITUDE * f_fin +
            self.config.WEIGHT_IRREVERSIBILITY * f_irrev +
            self.config.WEIGHT_EVIDENCE_COVERAGE * f_evid +
            self.config.WEIGHT_TOOL_PRIVILEGE * f_tool +
            self.config.WEIGHT_MODEL_UNCERTAINTY * f_uncert
        )

        # Maximum possible weighted score:
        # (1.2*5) + (1.8*5) + (2.0*5) + (1.4*5) + (1.6*5) + (1.0*5) = 45.0
        max_possible = 45.0
        composite_score = round((weighted_sum / max_possible) * 100.0, 1)
        composite_score = max(0.0, min(100.0, composite_score))

        return RiskBreakdown(
            data_sensitivity_score=round(f_sens, 2),
            financial_magnitude_score=round(f_fin, 2),
            irreversibility_score=round(f_irrev, 2),
            evidence_coverage_penalty=round(f_evid, 2),
            tool_privilege_score=round(f_tool, 2),
            model_uncertainty_score=round(f_uncert, 2),
            composite_risk_score=composite_score
        )
