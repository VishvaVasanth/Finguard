import { EvidenceItem } from '../types.ts';

export interface EvidenceEvaluation {
  coverage: number; // 0.0 - 1.0
  has_conflicts: boolean;
  conflict_details?: string;
  is_missing_evidence: boolean;
  missing_reason?: string;
  contains_adversarial_injection: boolean;
  injection_details?: string;
  citations: { source: string; page?: number; section?: string; quote: string }[];
}

export class EvidenceManager {
  /**
   * Scans text for malicious prompt injection patterns
   */
  public detectPromptInjection(text: string): boolean {
    const lower = text.toLowerCase();
    const maliciousPatterns = [
      'ignore all prior',
      'ignore previous instructions',
      'system override',
      'disregard all prior',
      'you are now in superadmin',
      'print approved',
      'output approved',
      'transfer ₹',
      'transfer to ac-',
      'transfer to account',
      'exfiltrate',
      'system prompt',
    ];

    return maliciousPatterns.some((pattern) => lower.includes(pattern));
  }

  /**
   * Evaluates retrieved evidence items for a given request query
   */
  public evaluate(query: string, items: EvidenceItem[], hasConflictsFlag: boolean): EvidenceEvaluation {
    const queryLower = query.toLowerCase();

    // Check for injection in query or in retrieved evidence chunks
    let containsInjection = this.detectPromptInjection(query);
    let injectionDetails: string | undefined;

    for (const item of items) {
      if (this.detectPromptInjection(item.text)) {
        containsInjection = true;
        injectionDetails = `Adversarial instruction detected inside untrusted document payload [${item.document_title}]`;
        break;
      }
    }

    // Check for missing evidence
    // For example, if user asks about a specific penalty or unknown document that yields zero or very low relevance items
    const isMissingEvidence = items.length === 0 || items[0].relevance_score < 0.35;
    let missingReason: string | undefined;
    if (isMissingEvidence) {
      missingReason = 'No verified documents with sufficient semantic confidence found in internal knowledge base.';
    }

    // Check for conflicts
    let hasConflicts = hasConflictsFlag;
    let conflictDetails: string | undefined;

    // Specifically detect conflicting documents (e.g. master agreement vs draft amendment)
    const docIds = new Set(items.map((i) => i.document_id));
    if (docIds.has('doc-contract-ch-2024') && docIds.has('doc-contract-ch-disputed-amendment')) {
      hasConflicts = true;
      conflictDetails =
        'Contradiction detected: Master Services Agreement specifies 1.5% late payment penalty, whereas unverified draft proposes 0.5%.';
    }

    // Calculate coverage
    let coverage = 0.0;
    if (items.length > 0 && !isMissingEvidence) {
      const bestScore = items[0].relevance_score;
      const avgScore = items.reduce((acc, i) => acc + i.relevance_score, 0) / items.length;
      coverage = Number(((bestScore * 0.7 + avgScore * 0.3)).toFixed(2));
      if (hasConflicts) {
        coverage = Math.min(coverage, 0.45); // Penalize coverage when sources conflict
      }
    }

    // Generate clean user citations
    const citations = items.map((item) => ({
      source: item.document_title,
      page: item.page,
      section: item.section,
      quote: item.text.length > 160 ? item.text.substring(0, 157) + '...' : item.text,
    }));

    return {
      coverage,
      has_conflicts: hasConflicts,
      conflict_details: conflictDetails,
      is_missing_evidence: isMissingEvidence,
      missing_reason: missingReason,
      contains_adversarial_injection: containsInjection,
      injection_details: injectionDetails,
      citations,
    };
  }
}

export const evidenceManager = new EvidenceManager();
