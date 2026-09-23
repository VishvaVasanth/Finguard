import { GovernancePolicy, RiskAssessment, RiskTier, RiskVector } from '../types.ts';

export class RiskEngine {
  /**
   * Computes risk vectors based on intent, financial values, irreversibility, tools, and uncertainty
   */
  public assess(params: {
    intent: string;
    requestText: string;
    hasFinancialAction: boolean;
    financialAmount?: number;
    irreversible: boolean;
    requiredToolRisk: number;
    uncertainty: 'LOW' | 'MEDIUM' | 'HIGH';
    evidenceCoverage: number;
    policy: GovernancePolicy;
    isAdversarial?: boolean;
    isUnauthorizedAction?: boolean;
  }): RiskAssessment {
    const {
      intent,
      requestText,
      hasFinancialAction,
      financialAmount = 0,
      irreversible,
      requiredToolRisk,
      uncertainty,
      evidenceCoverage,
      policy,
      isAdversarial,
      isUnauthorizedAction,
    } = params;

    const queryLower = requestText.toLowerCase();

    // 1. Sensitivity (0 - 5)
    let sensitivity = 1;
    if (isAdversarial || queryLower.includes('canary') || queryLower.includes('override')) {
      sensitivity = 5;
    } else if (isUnauthorizedAction || queryLower.includes('transfer') || queryLower.includes('banking')) {
      sensitivity = 4;
    } else if (intent.includes('CONTRACT') || queryLower.includes('coffee house') || queryLower.includes('agreement')) {
      sensitivity = 3;
    } else if (intent.includes('CALCULATION') || intent.includes('QA')) {
      sensitivity = 1;
    }

    // 2. Financial Impact (0 - 5)
    let financialImpact = 0;
    if (financialAmount > 1000000) {
      financialImpact = 5;
    } else if (financialAmount >= 50000 || queryLower.includes('50,000') || queryLower.includes('50000')) {
      financialImpact = 4;
    } else if (financialAmount > 0 || intent.includes('CONTRACT_APPROVAL') || intent.includes('CONTRACT_MODIFICATION')) {
      financialImpact = 3; // Contract commitments entail recurring liability
    } else if (queryLower.includes('penalty') || queryLower.includes('fee')) {
      financialImpact = 2;
    } else {
      financialImpact = 0;
    }

    // 3. Irreversibility (0 - 5)
    let irreversibilityScore = 0;
    if (irreversible || intent.includes('TRANSFER') || queryLower.includes('transfer')) {
      irreversibilityScore = 5; // Wire transfers cannot be undone autonomously
    } else if (intent.includes('CONTRACT_MODIFICATION')) {
      irreversibilityScore = 4;
    } else if (intent.includes('CONTRACT_APPROVAL')) {
      irreversibilityScore = 4;
    } else {
      irreversibilityScore = 0;
    }

    // 4. Evidence Requirement (0 - 5)
    let evidenceRequirement = 1;
    if (intent.includes('CONTRACT') || intent.includes('TRANSFER')) {
      evidenceRequirement = 5;
    } else if (intent.includes('CONFLICT') || queryLower.includes('penalty')) {
      evidenceRequirement = 4;
    } else if (intent.includes('CALCULATION')) {
      evidenceRequirement = 3;
    } else {
      evidenceRequirement = 2;
    }

    // 5. Tool Risk (0 - 5)
    const toolRisk = Math.min(5, Math.max(0, requiredToolRisk));

    // 6. Model Uncertainty (0 - 5)
    let uncertaintyScore = 1;
    if (uncertainty === 'HIGH' || evidenceCoverage < 0.4) {
      uncertaintyScore = 5;
    } else if (uncertainty === 'MEDIUM' || evidenceCoverage < 0.7) {
      uncertaintyScore = 3;
    } else {
      uncertaintyScore = 1;
    }

    // Adversarial or unauthorized overrides to maximum risk
    if (isAdversarial) {
      sensitivity = 5;
      financialImpact = 5;
      irreversibilityScore = 5;
    }

    const vector: RiskVector = {
      sensitivity,
      financial_impact: financialImpact,
      irreversibility: irreversibilityScore,
      evidence_requirement: evidenceRequirement,
      tool_risk: toolRisk,
      model_uncertainty: uncertaintyScore,
    };

    // Calculate normalized score using policy weights
    const w = policy.weights;
    const weightedSum =
      w.sensitivity * vector.sensitivity +
      w.financial_impact * vector.financial_impact +
      w.irreversibility * vector.irreversibility +
      w.evidence_requirement * vector.evidence_requirement +
      w.tool_risk * vector.tool_risk +
      w.model_uncertainty * vector.model_uncertainty;

    const totalWeight =
      w.sensitivity +
      w.financial_impact +
      w.irreversibility +
      w.evidence_requirement +
      w.tool_risk +
      w.model_uncertainty;

    // Normalization to 0-100 scale: (weightedSum / (5 * totalWeight)) * 100
    const rawScore = (weightedSum / (5 * totalWeight)) * 100;
    const score = Number(Math.min(100, Math.max(0, rawScore)).toFixed(1));

    // Determine Risk Tier
    let tier: RiskTier = 'LOW';
    if (score > policy.thresholds.high_max) {
      tier = 'CRITICAL';
    } else if (score > policy.thresholds.medium_max) {
      tier = 'HIGH';
    } else if (score > policy.thresholds.low_max) {
      tier = 'MEDIUM';
    } else {
      tier = 'LOW';
    }

    // Key qualitative factors explanation for Admin audit
    const factors: string[] = [];
    if (vector.sensitivity >= 4) factors.push(`High data sensitivity level (${vector.sensitivity}/5)`);
    if (vector.financial_impact >= 3) factors.push(`Direct financial liability impact (${vector.financial_impact}/5)`);
    if (vector.irreversibility >= 4) factors.push(`Irreversible operational action (${vector.irreversibility}/5)`);
    if (vector.tool_risk >= 4) factors.push(`High-privilege tool execution required (${vector.tool_risk}/5)`);
    if (uncertaintyScore >= 3) factors.push(`Heightened model uncertainty / low evidence (${uncertaintyScore}/5)`);
    if (factors.length === 0) factors.push('Standard read-only verified query within baseline bounds');

    return {
      vector,
      score,
      tier,
      factors,
    };
  }
}

export const riskEngine = new RiskEngine();
