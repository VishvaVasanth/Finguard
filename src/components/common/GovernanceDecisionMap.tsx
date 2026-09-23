import React from 'react';
import { ArrowDown, CheckCircle2, ShieldCheck, AlertTriangle, FileText, Scale, Cpu, Ban } from 'lucide-react';
import { GovernanceMode, RiskTier } from '../../types.ts';

interface DecisionMapProps {
  requestText: string;
  evidenceCoverage: number;
  evidenceCount: number;
  riskScore: number;
  riskTier: RiskTier;
  uncertaintyLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  policyName: string;
  governanceMode: GovernanceMode;
  decisionReason: string;
}

export const GovernanceDecisionMap: React.FC<DecisionMapProps> = ({
  requestText,
  evidenceCoverage,
  evidenceCount,
  riskScore,
  riskTier,
  uncertaintyLevel,
  policyName,
  governanceMode,
  decisionReason,
}) => {
  return (
    <div
      id="governance-decision-map"
      className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#17233C] tracking-tight">GOVERNANCE DECISION MAP</h3>
          <p className="text-xs text-slate-500">Trace of automated risk verification and policy routing pipeline</p>
        </div>
        <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-[#9A9CEA]/15 text-[#17233C]">
          Deterministic Trace
        </span>
      </div>

      <div className="flex flex-col items-center space-y-2 py-2">
        {/* Step 1: REQUEST */}
        <div className="w-full max-w-md bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              1. INTAKE & REQUEST
            </span>
          </div>
          <p className="text-xs font-medium text-slate-800 line-clamp-2 italic">"{requestText}"</p>
        </div>

        <ArrowDown className="w-4 h-4 text-slate-400 animate-bounce" />

        {/* Step 2: EVIDENCE */}
        <div className="w-full max-w-md bg-[#ADEEE2]/25 border border-[#ADEEE2] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              2. HYBRID RAG EVIDENCE
            </span>
            <span className="text-xs font-mono font-semibold text-teal-900">{Math.round(evidenceCoverage * 100)}% Coverage</span>
          </div>
          <p className="text-xs text-teal-950">
            {evidenceCount} verified documents retrieved via BM25 + Vector semantic search.
          </p>
        </div>

        <ArrowDown className="w-4 h-4 text-slate-400" />

        {/* Step 3: RISK */}
        <div className="w-full max-w-md bg-[#A2DCEE]/25 border border-[#A2DCEE] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-800 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-sky-700" />
              3. 6-FACTOR RISK ENGINE
            </span>
            <span className="text-xs font-mono font-semibold text-sky-950">
              Score: {riskScore} ({riskTier})
            </span>
          </div>
          <p className="text-xs text-sky-950">
            Weighted assessment of sensitivity, impact, irreversibility, and tool risk.
          </p>
        </div>

        <ArrowDown className="w-4 h-4 text-slate-400" />

        {/* Step 4: UNCERTAINTY */}
        <div className="w-full max-w-md bg-[#A2B9EE]/25 border border-[#A2B9EE] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-indigo-700" />
              4. UNCERTAINTY & CONFLICTS
            </span>
            <span className="text-xs font-mono font-semibold text-indigo-950">Level: {uncertaintyLevel}</span>
          </div>
          <p className="text-xs text-indigo-950">
            Assessed contradiction detection, source agreement, and claim confidence.
          </p>
        </div>

        <ArrowDown className="w-4 h-4 text-slate-400" />

        {/* Step 5: POLICY */}
        <div className="w-full max-w-md bg-[#9A9CEA]/25 border border-[#9A9CEA] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#17233C] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-800" />
              5. ACTIVE GOVERNANCE POLICY
            </span>
          </div>
          <p className="text-xs text-slate-800 font-medium">{policyName}</p>
        </div>

        <ArrowDown className="w-4 h-4 text-slate-400" />

        {/* Step 6: DECISION */}
        <div
          className={`w-full max-w-md rounded-xl p-3.5 border shadow-xs ${
            governanceMode === 'AUTO'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : governanceMode === 'APPROVE'
              ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
              : governanceMode === 'VERIFY'
              ? 'bg-sky-50 border-sky-300 text-sky-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase font-bold tracking-wider flex items-center gap-1.5">
              {governanceMode === 'BLOCK' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              6. GOVERNANCE DECISION: {governanceMode}
            </span>
          </div>
          <p className="text-xs font-medium">{decisionReason}</p>
        </div>
      </div>
    </div>
  );
};
