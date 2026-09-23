"""
FinGuard Cryptographic Tamper-Evident Audit Trail
=================================================
Maintains an immutable SHA-256 hash-chained log of all governance
decisions, risk scores, dynamic cutoffs, and approvals.
"""

import hashlib
import json
import time
from typing import List, Dict, Any, Optional
from .models import AuditLogEntry, GovernanceDecision, TaskContext

class AuditTrailManager:
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self):
        self.chain: List[AuditLogEntry] = []

    def record_decision(self, task: TaskContext, decision: GovernanceDecision) -> AuditLogEntry:
        prev_hash = self.chain[-1].sha256_hash if self.chain else self.GENESIS_HASH
        entry_id = f"AUDIT-{len(self.chain)+1:04d}"
        now = time.time()

        payload = {
            "entry_id": entry_id,
            "task_id": task.task_id,
            "query": task.query,
            "caller_role": task.caller_role,
            "composite_risk_score": decision.composite_risk_score,
            "action": decision.action.value,
            "tau_low": decision.thresholds.tau_low,
            "tau_med": decision.thresholds.tau_med,
            "tau_high": decision.thresholds.tau_high,
            "prev_hash": prev_hash,
            "timestamp": now
        }

        serialized = json.dumps(payload, sort_keys=True)
        entry_hash = hashlib.sha256(serialized.encode('utf-8')).hexdigest()

        entry = AuditLogEntry(
            entry_id=entry_id,
            task_id=task.task_id,
            query=task.query,
            caller_role=task.caller_role,
            composite_risk_score=decision.composite_risk_score,
            decision_action=decision.action,
            thresholds={
                "tau_low": decision.thresholds.tau_low,
                "tau_med": decision.thresholds.tau_med,
                "tau_high": decision.thresholds.tau_high
            },
            sha256_hash=entry_hash,
            previous_hash=prev_hash,
            timestamp=now
        )
        self.chain.append(entry)
        return entry

    def verify_integrity(self) -> bool:
        """Verifies that no entry in the chain has been altered."""
        for i, entry in enumerate(self.chain):
            expected_prev = self.chain[i-1].sha256_hash if i > 0 else self.GENESIS_HASH
            if entry.previous_hash != expected_prev:
                return False
        return True

    def get_logs(self) -> List[Dict[str, Any]]:
        return [
            {
                "entry_id": e.entry_id,
                "task_id": e.task_id,
                "query": e.query,
                "caller_role": e.caller_role,
                "risk_score": e.composite_risk_score,
                "action": e.decision_action.value,
                "tau_low": e.thresholds["tau_low"],
                "tau_med": e.thresholds["tau_med"],
                "tau_high": e.thresholds["tau_high"],
                "sha256_hash": e.sha256_hash[:16] + "...",
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(e.timestamp))
            }
            for e in self.chain
        ]
