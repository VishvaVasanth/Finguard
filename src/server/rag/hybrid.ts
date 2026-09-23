import { dbStore } from '../db/store.ts';
import { EvidenceItem } from '../types.ts';

export interface RetrievalResult {
  items: EvidenceItem[];
  has_conflicts: boolean;
  contains_adversarial_payload: boolean;
}

export class HybridRAG {
  /**
   * Tokenizes string into lowercased terms removing punctuation
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  /**
   * Lexical search (BM25 approximation)
   */
  private lexicalSearch(query: string, userRole: string): { chunkId: string; docId: string; score: number }[] {
    const queryTokens = this.tokenize(query);
    const results: { chunkId: string; docId: string; score: number }[] = [];

    for (const doc of dbStore.documents) {
      if (!doc.authorized_roles.includes(userRole as any) && userRole !== 'ADMIN') {
        continue;
      }

      for (const chunk of doc.chunks) {
        const chunkTokens = this.tokenize(chunk.text + ' ' + chunk.section);
        let score = 0;

        for (const qToken of queryTokens) {
          const matchCount = chunkTokens.filter((ct) => ct.includes(qToken) || qToken.includes(ct)).length;
          if (matchCount > 0) {
            score += matchCount * 1.5;
          }
        }

        if (score > 0) {
          results.push({ chunkId: chunk.id, docId: doc.id, score });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Vector search simulation (Dense semantic matching)
   */
  private vectorSearch(query: string, userRole: string): { chunkId: string; docId: string; score: number }[] {
    const queryLower = query.toLowerCase();
    const results: { chunkId: string; docId: string; score: number }[] = [];

    const semanticConcepts: Record<string, string[]> = {
      revenue: ['revenue', 'sales', 'crore', 'fy2024', 'fy2023', 'turnover', 'topline'],
      growth: ['percentage', 'increase', 'growth', 'year-over-year', 'yoy', 'variance'],
      contract: ['coffee house', 'agreement', 'master services', 'terms', 'retainer', 'retainer'],
      penalty: ['penalty', 'late payment', 'interest', 'fee', 'default', 'accrue'],
      wire: ['wire', 'transfer', 'disbursement', 'sop-fin-401', 'banking', 'ach'],
      margin: ['margin', 'operating expenses', 'operating income', 'profit'],
    };

    for (const doc of dbStore.documents) {
      if (!doc.authorized_roles.includes(userRole as any) && userRole !== 'ADMIN') {
        continue;
      }

      for (const chunk of doc.chunks) {
        const textLower = chunk.text.toLowerCase();
        let semanticScore = 0;

        for (const [concept, keywords] of Object.entries(semanticConcepts)) {
          if (queryLower.includes(concept)) {
            for (const kw of keywords) {
              if (textLower.includes(kw)) {
                semanticScore += 2.0;
              }
            }
          }
        }

        // Base matching
        const words = queryLower.split(' ');
        for (const w of words) {
          if (w.length > 3 && textLower.includes(w)) {
            semanticScore += 1.0;
          }
        }

        if (semanticScore > 0) {
          results.push({ chunkId: chunk.id, docId: doc.id, score: semanticScore });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Reciprocal Rank Fusion (RRF) combining Lexical + Vector
   */
  public search(query: string, userRole: string = 'USER'): RetrievalResult {
    const lexical = this.lexicalSearch(query, userRole);
    const vector = this.vectorSearch(query, userRole);

    const k = 60; // Standard RRF smoothing constant
    const rrfScores: Record<string, { docId: string; rrfScore: number }> = {};

    lexical.forEach((item, index) => {
      const rank = index + 1;
      rrfScores[item.chunkId] = {
        docId: item.docId,
        rrfScore: (rrfScores[item.chunkId]?.rrfScore || 0) + 1 / (k + rank),
      };
    });

    vector.forEach((item, index) => {
      const rank = index + 1;
      rrfScores[item.chunkId] = {
        docId: item.docId,
        rrfScore: (rrfScores[item.chunkId]?.rrfScore || 0) + 1 / (k + rank),
      };
    });

    const sortedChunkIds = Object.keys(rrfScores).sort(
      (a, b) => rrfScores[b].rrfScore - rrfScores[a].rrfScore
    );

    const items: EvidenceItem[] = [];
    let hasConflicts = false;
    let containsAdversarialPayload = false;

    // Normalize max RRF score to 0..1 range
    const maxRRF = sortedChunkIds.length > 0 ? rrfScores[sortedChunkIds[0]].rrfScore : 1;

    for (const chunkId of sortedChunkIds.slice(0, 5)) {
      const meta = rrfScores[chunkId];
      const doc = dbStore.documents.find((d) => d.id === meta.docId);
      if (!doc) continue;

      const chunk = doc.chunks.find((c) => c.id === chunkId);
      if (!chunk) continue;

      const normalizedScore = Math.min(0.99, Number(((meta.rrfScore / maxRRF) * 0.95).toFixed(2)));

      // Only flag conflicts or adversarial payloads if the retrieved chunk has meaningful relevance
      const queryLower = query.toLowerCase();
      const isConflictRelevant =
        normalizedScore >= 0.70 ||
        queryLower.includes('conflict') ||
        queryLower.includes('dispute') ||
        queryLower.includes('penalty') ||
        queryLower.includes('coffee') ||
        queryLower.includes('amendment');

      const isAdversarialRelevant =
        normalizedScore >= 0.75 ||
        queryLower.includes('override') ||
        queryLower.includes('ignore') ||
        queryLower.includes('canary') ||
        queryLower.includes('superadmin');

      if (doc.has_conflicts && isConflictRelevant) hasConflicts = true;
      if (doc.contains_adversarial_payload && isAdversarialRelevant) containsAdversarialPayload = true;

      items.push({
        id: `ev-${chunk.id}`,
        document_id: doc.id,
        document_title: doc.title,
        chunk_id: chunk.id,
        text: chunk.text,
        page: chunk.page,
        section: chunk.section,
        relevance_score: normalizedScore,
        retrieval_method: 'hybrid',
      });
    }

    return {
      items,
      has_conflicts: hasConflicts,
      contains_adversarial_payload: containsAdversarialPayload,
    };
  }
}

export const hybridRAG = new HybridRAG();
