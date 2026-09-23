import React, { useState } from 'react';
import { RequestRecord, User } from '../../types.ts';
import { RiskGauge } from '../common/RiskGauge.tsx';
import { GovernanceBadge, RiskTierBadge, StatusBadge } from '../common/Badges.tsx';
import { GovernanceDecisionMap } from '../common/GovernanceDecisionMap.tsx';
import { FormattedMarkdown } from '../common/FormattedMarkdown.tsx';
import {
  ShieldCheck,
  CheckCircle2,
  Ban,
  Clock,
  ArrowUpRight,
  MessageSquare,
  FileText,
  AlertTriangle,
  Send,
  Eye,
  Lock,
} from 'lucide-react';

interface AdminReviewWorkspaceProps {
  currentUser: User;
  pendingReviews: RequestRecord[];
  allRequests: RequestRecord[];
  onDecision: (requestId: string, decision: 'APPROVE' | 'REJECT' | 'ESCALATE', notes?: string) => Promise<void>;
  onSendMessage: (requestId: string, message: string, visibility: 'USER_VISIBLE' | 'PRIVATE') => Promise<void>;
}

export const AdminReviewWorkspace: React.FC<AdminReviewWorkspaceProps> = ({
  currentUser,
  pendingReviews,
  allRequests,
  onDecision,
  onSendMessage,
}) => {
  const [selectedReqId, setSelectedReqId] = useState<string>(
    pendingReviews[0]?.request_id || allRequests[0]?.request_id || ''
  );
  const [messageInput, setMessageInput] = useState('');
  const [messageVisibility, setMessageVisibility] = useState<'USER_VISIBLE' | 'PRIVATE'>('USER_VISIBLE');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [showDecisionMap, setShowDecisionMap] = useState(false);

  const selectedRequest =
    allRequests.find((r) => r.request_id === selectedReqId) || pendingReviews[0] || allRequests[0];

  const handleDecisionClick = async (decision: 'APPROVE' | 'REJECT' | 'ESCALATE') => {
    if (!selectedRequest) return;
    await onDecision(selectedRequest.request_id, decision, decisionNotes);
    setDecisionNotes('');
  };

  const handleSendMessageSubmit = async () => {
    if (!selectedRequest || !messageInput.trim()) return;
    await onSendMessage(selectedRequest.request_id, messageInput.trim(), messageVisibility);
    setMessageInput('');
  };

  return (
    <div id="admin-review-workspace" className="space-y-4">
      {/* Top Header & Queue Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Human-in-the-Loop Governance Review Workspace
          </h2>
          <p className="text-xs text-slate-500">
            Authorized signoff & evidence verification for high-impact transactions
          </p>
        </div>

        {/* Request selector dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Task:</label>
          <select
            id="review-task-selector"
            value={selectedRequest?.request_id || ''}
            onChange={(e) => setSelectedReqId(e.target.value)}
            className="text-xs font-mono font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden"
          >
            {pendingReviews.length > 0 && (
              <optgroup label="⚠️ Pending Human Review Queue">
                {pendingReviews.map((r) => (
                  <option key={r.request_id} value={r.request_id}>
                    [PENDING] {r.request_id} — {r.user_name} ({r.request_text.substring(0, 30)}...)
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="All Historical Records">
              {allRequests.map((r) => (
                <option key={r.request_id} value={r.request_id}>
                  [{r.status}] {r.request_id} — {r.request_text.substring(0, 35)}...
                </option>
              ))}
            </optgroup>
          </select>

          <button
            onClick={() => setShowDecisionMap(!showDecisionMap)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            {showDecisionMap ? 'Hide Decision Map' : 'View Decision Map'}
          </button>
        </div>
      </div>

      {/* Optional Decision Map Drawer */}
      {showDecisionMap && selectedRequest && (
        <div className="animate-in fade-in duration-200">
          <GovernanceDecisionMap
            requestText={selectedRequest.request_text}
            evidenceCoverage={selectedRequest.evidence_coverage}
            evidenceCount={selectedRequest.evidence_items.length}
            riskScore={selectedRequest.risk_assessment.score}
            riskTier={selectedRequest.risk_assessment.tier}
            uncertaintyLevel={selectedRequest.uncertainty_level}
            policyName="FinGuard Multi-Tier Conservative Policy v2.4"
            governanceMode={selectedRequest.governance_mode}
            decisionReason={selectedRequest.safe_response.substring(0, 100)}
          />
        </div>
      )}

      {selectedRequest ? (
        /* 3-Column Review Workspace Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ============================================================ */}
          {/* COLUMN 1: USER REQUEST & CONVERSATION HISTORY (4 cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col h-[740px]">
            <div className="border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Column 1: Intake & Thread
                </span>
                <StatusBadge status={selectedRequest.status} />
              </div>
              <h3 className="text-sm font-bold text-[#17233C] mt-1">{selectedRequest.request_id}</h3>
              <div className="text-xs text-slate-500 mt-0.5">
                Submitted by: <strong className="text-slate-800">{selectedRequest.user_name}</strong> ({selectedRequest.user_role})
              </div>
            </div>

            {/* Original Request Box */}
            <div className="mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Request</span>
              <div className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900">
                "{selectedRequest.request_text}"
              </div>
            </div>

            {/* Assistant Safe Response Preview */}
            <div className="mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current User-Facing Output</span>
              <div className="mt-1 p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-700 max-h-36 overflow-y-auto">
                <FormattedMarkdown content={selectedRequest.safe_response} />
              </div>
            </div>

            {/* Reviewer / User Live Messaging Thread */}
            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#17233C] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  Review Communication Thread
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedRequest.review_task?.messages?.length || 0} messages
                </span>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
                {selectedRequest.review_task?.messages?.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic">
                    No communication messages exchanged yet. Use the prompt below to ask the user for clarification.
                  </div>
                ) : (
                  selectedRequest.review_task?.messages?.map((msg) => {
                    const isUser = msg.sender_role === 'USER';
                    const isPrivate = msg.visibility === 'PRIVATE';

                    return (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl border ${
                          isUser
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                            : isPrivate
                            ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold mb-1 opacity-80">
                          <span>
                            {msg.sender_name} ({msg.sender_role})
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            {isPrivate ? (
                              <>
                                <Lock className="w-2.5 h-2.5" /> PRIVATE NOTE
                              </>
                            ) : (
                              <>
                                <Eye className="w-2.5 h-2.5" /> USER VISIBLE
                              </>
                            )}
                          </span>
                        </div>
                        <div className="font-medium leading-relaxed">{msg.message}</div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Question or Internal Note */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-3 text-[11px]">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="msg_visibility"
                      checked={messageVisibility === 'USER_VISIBLE'}
                      onChange={() => setMessageVisibility('USER_VISIBLE')}
                    />
                    <span className="text-amber-800 font-semibold">User Visible (Request Info)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="msg_visibility"
                      checked={messageVisibility === 'PRIVATE'}
                      onChange={() => setMessageVisibility('PRIVATE')}
                    />
                    <span className="text-purple-800 font-semibold">Private Admin Note</span>
                  </label>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={
                      messageVisibility === 'USER_VISIBLE'
                        ? 'e.g. "Please confirm the contract start date"'
                        : 'e.g. "Verified banking routing numbers in treasury ERP"'
                    }
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessageSubmit()}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-400"
                  />
                  <button
                    onClick={handleSendMessageSubmit}
                    disabled={!messageInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#17233C] disabled:opacity-40 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUMN 2: EVIDENCE DOCUMENTS & CHUNK VERIFICATION (4 cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col h-[740px]">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Column 2: Evidence Grounding
                </span>
                <h3 className="text-sm font-bold text-[#17233C] mt-0.5">Retrieved Evidence Documents</h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                {Math.round(selectedRequest.evidence_coverage * 100)}% Coverage
              </span>
            </div>

            {/* Evidence List Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedRequest.evidence_items.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No verified evidence documents retrieved for this query.</p>
                  <p className="text-[11px] text-amber-600 font-medium">
                    Triggered high uncertainty and verification requirement.
                  </p>
                </div>
              ) : (
                selectedRequest.evidence_items.map((ev, idx) => (
                  <div
                    key={ev.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{ev.document_title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Chunk: {ev.chunk_id} {ev.page && `• Page ${ev.page}`} {ev.section && `• ${ev.section}`}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        Score: {ev.relevance_score.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-2.5 rounded-lg border border-slate-100">
                      "{ev.text}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Retrieved via: {ev.retrieval_method || 'hybrid'}</span>
                      <span className="text-teal-600 font-semibold">✓ Grounded</span>
                    </div>
                  </div>
                ))
              )}

              {/* Adversarial Canary / Prompt Injection Check */}
              <div
                className={`p-3 rounded-xl border text-xs ${
                  selectedRequest.prompt_injection_detected
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Adversarial Prompt Injection Scanner
                </div>
                <div>
                  {selectedRequest.prompt_injection_detected
                    ? '⚠️ Malicious canary injection pattern detected in input text.'
                    : '✓ Passed heuristic & regex canary pattern scans without security flags.'}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUMN 3: RISK GAUGE, POLICY RULES & ACTIONS (4 cols) */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex flex-col h-[740px]">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                  Column 3: Risk & Signoff
                </span>
                <h3 className="text-sm font-bold text-[#17233C] mt-0.5">Risk Gauge & Authority</h3>
              </div>
              <GovernanceBadge mode={selectedRequest.governance_mode} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Risk Gauge Visual Component */}
              <RiskGauge assessment={selectedRequest.risk_assessment} showBreakdown={true} />

              {/* Tool Execution Safety Sandbox */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Required Financial Tool:</span>
                {selectedRequest.tool_calls.length === 0 ? (
                  <div className="text-slate-500 italic">No tool execution needed for this query.</div>
                ) : (
                  selectedRequest.tool_calls.map((tc, idx) => (
                    <div key={idx} className="p-2 rounded bg-white border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-slate-800">{tc.tool_name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            tc.executed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tc.executed ? 'EXECUTED' : 'HELD IN SANDBOX'}
                        </span>
                      </div>
                      {tc.blocked_reason && (
                        <div className="text-[11px] text-amber-800">
                          <strong>Held:</strong> {tc.blocked_reason}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Decision Action Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Reviewer Decision Rationale / Notes:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Verified with Vendor Management terms; approved for Q4 operations."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-400 resize-none"
                />
              </div>
            </div>

            {/* Action Buttons: APPROVE, REQUEST MORE INFO, REJECT, ESCALATE */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {/* Approve Button */}
                <button
                  id="btn-reviewer-approve"
                  onClick={() => handleDecisionClick('APPROVE')}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Signoff
                </button>

                {/* Reject Button */}
                <button
                  id="btn-reviewer-reject"
                  onClick={() => handleDecisionClick('REJECT')}
                  className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Reject Request
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Request More Information */}
                <button
                  id="btn-reviewer-request-info"
                  onClick={() => {
                    setMessageInput('Please confirm the contract start date.');
                    setMessageVisibility('USER_VISIBLE');
                  }}
                  className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Request Info
                </button>

                {/* Escalate to Domain Expert */}
                <button
                  id="btn-reviewer-escalate"
                  onClick={() => handleDecisionClick('ESCALATE')}
                  className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Escalate Expert
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
          No active request selected.
        </div>
      )}
    </div>
  );
};
