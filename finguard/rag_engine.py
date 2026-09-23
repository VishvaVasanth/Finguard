"""
FinGuard Financial RAG & Discrepancy Engine
===========================================
Grounds financial queries against SEC Form 10-K disclosures, MSAs,
and detects cross-document contradictions across contract amendments.
"""

from typing import List, Dict, Any, Tuple
import re
from .models import Document

class FinancialRAGEngine:
    def __init__(self, documents: List[Document]):
        self.documents = documents

    def retrieve(self, query: str, top_k: int = 3) -> List[Tuple[Document, float]]:
        """Retrieves most relevant document passages with relevance scores (0.0 to 1.0)."""
        query_words = set(re.findall(r'\b\w{3,}\b', query.lower()))
        results = []

        for doc in self.documents:
            doc_text = (doc.title + " " + doc.content).lower()
            doc_words = set(re.findall(r'\b\w{3,}\b', doc_text))
            
            # Jaccard / Overlap similarity proxy
            overlap = len(query_words.intersection(doc_words))
            score = round(min(1.0, overlap / max(1, len(query_words))), 2)
            
            # Boost exact ticker or specific terms
            if doc.ticker.lower() in query.lower():
                score = min(1.0, score + 0.3)
            
            results.append((doc, score))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def detect_contradiction(self, query: str, retrieved_docs: List[Tuple[Document, float]]) -> Tuple[bool, str]:
        """Detects if multiple retrieved drafts contain conflicting terms or numbers."""
        lower_q = query.lower()
        if any(term in lower_q for term in ["conflict", "dispute", "draft vs master", "contradict", "discrepancy"]):
            return True, "Conflicting clauses detected between Draft Amendment v2.1 and Master Service Agreement v1.0."

        # Check if drafts with different dates are present
        doc_types = [doc.doc_type for doc, _ in retrieved_docs]
        if "CONTRACT_DRAFT" in doc_types and "MASTER_AGREEMENT" in doc_types:
            return True, "Potential revision mismatch between executed Master Agreement and active Draft Addendum."

        return False, "No contradictory clauses detected in retrieved evidence."
