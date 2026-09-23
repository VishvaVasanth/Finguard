import { GovernanceMode, GovernancePolicy, RiskAssessment, UserRole } from '../types.ts';

export interface GovernanceDecision {
  mode: GovernanceMode;
  reason: string;
  policy_rule_id: string;
  requires_human_review: boolean;
  assigned_role?: UserRole;
  safe_halt_execution: boolean;
}

export class GovernanceEngine {
  public decide(params: {
    riskAssessment: RiskAssessment;
    policy: GovernancePolicy;
    evidenceCoverage: number;
    hasConflicts: boolean;
    isMissingEvidence: boolean;
    containsPromptInjection: boolean;
    userRole: UserRole;
    toolRequired?: {
      tool_id: string;
      risk_level: number;
      allowed_roles: UserRole[];
      requires_approval: boolean;
    };
  }): GovernanceDecision {
    const {
      riskAssessment,
      policy,
      evidenceCoverage,
      hasConflicts,
      isMissingEvidence,
      containsPromptInjection,
      userRole,
      toolRequired,
    } = params;

    // Rule 1: Prompt Injection / Adversarial Canary Detection -> BLOCK
    if (containsPromptInjection) {
      return {
        mode: 'BLOCK',
        reason: 'CRITICAL_SECURITY_INTERCEPT: Adversarial prompt injection detected in payload or retrieved document.',
        policy_rule_id: 'SEC-POL-001',
        requires_human_review: false,
        safe_halt_execution: true,
      };
    }

    // Rule 2: Unauthorized Tool Invocation (e.g. Standard User requesting wire transfer) -> BLOCK
    if (toolRequired && !toolRequired.allowed_roles.includes(userRole)) {
      if (toolRequired.tool_id === 'tool-wire-transfer' || !toolRequired.requires_approval) {
        return {
          mode: 'BLOCK',
          reason: `ROLE_ENTITLEMENT_VIOLATION: User role [${userRole}] lacks permission to execute tool [${toolRequired.tool_id}].`,
          policy_rule_id: 'AUTH-POL-401',
          requires_human_review: false,
          safe_halt_execution: true,
        };
      }
    }

    // Rule 3: Irreversible High Financial Action or Critical Risk Tier -> BLOCK / ESCALATE
    if (riskAssessment.tier === 'CRITICAL') {
      return {
        mode: 'BLOCK',
        reason: 'CRITICAL_RISK_BREACH: Normalized risk score exceeds safe governance threshold. Execution halted.',
        policy_rule_id: 'GOV-RULE-CRIT',
        requires_human_review: false,
        safe_halt_execution: true,
      };
    }

    // Rule 4: High Risk Tier OR Tool requires explicit approval OR Contract Action -> APPROVE
    if (riskAssessment.tier === 'HIGH' || (toolRequired && toolRequired.requires_approval)) {
      return {
        mode: 'APPROVE',
        reason: 'HUMAN_APPROVAL_REQUIRED: High-impact or contract liability action requires human reviewer signoff.',
        policy_rule_id: 'GOV-RULE-APPROVE-L3',
        requires_human_review: true,
        assigned_role: 'REVIEWER',
        safe_halt_execution: true, // Do not execute tool until human approves
      };
    }

    // Rule 5: Conflicting Evidence or Missing Evidence or Medium Tier -> VERIFY
    if (hasConflicts || isMissingEvidence || riskAssessment.tier === 'MEDIUM' || evidenceCoverage < policy.evidence_coverage_threshold) {
      const conflictReason = hasConflicts
        ? 'CONTRADICTION_FLAGGED: Disputed records detected in knowledge base.'
        : isMissingEvidence
        ? 'EVIDENCE_ABSENCE: Insufficient verified documentation available.'
        : 'COVERAGE_INSUFFICIENT: Evidence coverage fell below policy threshold.';

      return {
        mode: 'VERIFY',
        reason: conflictReason,
        policy_rule_id: 'GOV-RULE-VERIFY-MED',
        requires_human_review: false,
        safe_halt_execution: false,
      };
    }

    // Rule 6: Low Risk + Strong Evidence + Authorized -> AUTO
    return {
      mode: 'AUTO',
      reason: 'AUTONOMOUS_CLEARANCE: Low risk, verified citations, and high coverage satisfied policy criteria.',
      policy_rule_id: 'GOV-RULE-AUTO-L1',
      requires_human_review: false,
      safe_halt_execution: false,
    };
  }
}

export const governanceEngine = new GovernanceEngine();
