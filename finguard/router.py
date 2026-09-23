"""
FinGuard 4-Tier Policy Router
=============================
Evaluates task composite risk against dynamic threshold boundaries:
  - AUTO:    R_composite <= tau_low
  - VERIFY:  tau_low < R_composite <= tau_med
  - APPROVE: tau_med < R_composite <= tau_high
  - BLOCK:   R_composite > tau_high (or adversarial)
"""

from .models import TaskContext, RiskBreakdown, DynamicThresholds, GovernanceDecision, ActionTier

class GovernanceRouter:
    def route(
        self,
        task: TaskContext,
        risk: RiskBreakdown,
        thresholds: DynamicThresholds
    ) -> GovernanceDecision:
        score = risk.composite_risk_score
        tau_l = thresholds.tau_low
        tau_m = thresholds.tau_med
        tau_h = thresholds.tau_high

        # 1. Adversarial Check
        if task.adversarial_flag:
            return GovernanceDecision(
                task_id=task.task_id,
                action=ActionTier.BLOCK,
                composite_risk_score=score,
                thresholds=thresholds,
                risk_breakdown=risk,
                reasoning="ADVERSARIAL ATTACK INTERCEPTED: Unauthorized prompt injection detected. Quarantined.",
                quarantined=True,
                review_queue="Security Operations / CISO"
            )

        # 2. Hard Block Threshold
        if score > tau_h:
            return GovernanceDecision(
                task_id=task.task_id,
                action=ActionTier.BLOCK,
                composite_risk_score=score,
                thresholds=thresholds,
                risk_breakdown=risk,
                reasoning=f"Critical liability ceiling breached (Score: {score:.1f} > Cutoff: {tau_h:.1f}). Execution permanently denied.",
                quarantined=True,
                review_queue="Executive Risk Committee"
            )

        # 3. Human Signoff Queue (APPROVE)
        if score > tau_m:
            return GovernanceDecision(
                task_id=task.task_id,
                action=ActionTier.APPROVE,
                composite_risk_score=score,
                thresholds=thresholds,
                risk_breakdown=risk,
                reasoning=f"High-exposure action flagged (Score: {score:.1f} in {tau_m:.1f}-{tau_h:.1f}). Dual-authorization required before execution.",
                quarantined=True,
                review_queue="Treasury & Compliance Review Queue (Kumar / Thaheera)"
            )

        # 4. Discrepancy Verification (VERIFY)
        if score > tau_l or task.has_conflicts:
            reason = "Document contradiction detected across drafts." if task.has_conflicts else f"Moderate risk threshold reached (Score: {score:.1f} in {tau_l:.1f}-{tau_m:.1f})."
            return GovernanceDecision(
                task_id=task.task_id,
                action=ActionTier.VERIFY,
                composite_risk_score=score,
                thresholds=thresholds,
                risk_breakdown=risk,
                reasoning=f"{reason} Flagged for discrepancy reconciliation.",
                quarantined=False,
                review_queue="Senior Financial Analyst"
            )

        # 5. Autonomous Execution (AUTO)
        return GovernanceDecision(
            task_id=task.task_id,
            action=ActionTier.AUTO,
            composite_risk_score=score,
            thresholds=thresholds,
            risk_breakdown=risk,
            reasoning=f"Autonomous execution approved (Risk Score: {score:.1f} <= Cutoff: {tau_l:.1f}). Fully cited and grounded.",
            quarantined=False,
            review_queue=None
        )
