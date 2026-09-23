import React, { useState } from 'react';
import { GovernancePolicy } from '../../types.ts';
import { Sliders, ShieldCheck, Check, RotateCcw, Save } from 'lucide-react';

interface PolicyStudioProps {
  policies: GovernancePolicy[];
  onUpdatePolicy: (policyId: string, updates: Partial<GovernancePolicy>) => Promise<void>;
}

export const AdminPolicyStudio: React.FC<PolicyStudioProps> = ({ policies, onUpdatePolicy }) => {
  const activePolicy = policies.find((p) => p.is_active) || policies[0];
  const [selectedPolicyId, setSelectedPolicyId] = useState(activePolicy?.id || '');

  const currentPolicy = policies.find((p) => p.id === selectedPolicyId) || activePolicy;

  const [weights, setWeights] = useState({ ...currentPolicy.weights });
  const [thresholds, setThresholds] = useState({ ...currentPolicy.thresholds });
  const [coverageThreshold, setCoverageThreshold] = useState(currentPolicy.evidence_coverage_threshold);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if selected policy changes
  React.useEffect(() => {
    if (currentPolicy) {
      setWeights({ ...currentPolicy.weights });
      setThresholds({ ...currentPolicy.thresholds });
      setCoverageThreshold(currentPolicy.evidence_coverage_threshold);
    }
  }, [selectedPolicyId]);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdatePolicy(currentPolicy.id, {
      weights,
      thresholds,
      evidence_coverage_threshold: coverageThreshold,
    });
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleActivate = async () => {
    setIsSaving(true);
    await onUpdatePolicy(currentPolicy.id, { is_active: true });
    setIsSaving(false);
  };

  const factorConfig = [
    { key: 'sensitivity', label: 'w1: Data Sensitivity Weight', desc: 'Confidential corporate and personal financial disclosures' },
    { key: 'financial_impact', label: 'w2: Financial Impact Weight', desc: 'Monetary exposure, disbursements, and transaction volume' },
    { key: 'irreversibility', label: 'w3: Irreversibility Weight', desc: 'Non-reversibility of wire execution or executed legal amendments' },
    { key: 'evidence_requirement', label: 'w4: Evidence Requirement Weight', desc: 'Strictness of document citation completeness and source grounding' },
    { key: 'tool_risk', label: 'w5: Tool Execution Risk Weight', desc: 'Privilege and authorization level of invoked external tool' },
    { key: 'model_uncertainty', label: 'w6: Model Uncertainty Weight', desc: 'Confidence, document conflicts, and ambiguity detection' },
  ];

  return (
    <div id="admin-policy-studio-view" className="space-y-6">
      {/* Header & Policy Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#9A9CEA]" />
              Multi-Tier Governance Policy Studio
            </h2>
            <p className="text-xs text-slate-500">
              Configure deterministic 6-factor weights, risk tier thresholds, and safety calibration parameters
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPolicyId}
              onChange={(e) => setSelectedPolicyId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-hidden"
            >
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.version}) {p.is_active ? '★ ACTIVE' : ''}
                </option>
              ))}
            </select>

            {!currentPolicy.is_active && (
              <button
                onClick={handleActivate}
                className="px-3.5 py-1.5 rounded-xl bg-[#17233C] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Set as Active
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          <div>
            Description: <strong className="text-slate-800">{currentPolicy.description}</strong>
          </div>
          <div className="font-mono text-[11px]">
            Policy Hash: <span className="text-slate-700">{currentPolicy.hash}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Factor Weights Sliders (8 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#17233C]">6-Factor Risk Weights (w1 – w6)</h3>
            <p className="text-xs text-slate-500">Relative contribution of each dimension to normalized risk score (0-100)</p>
          </div>

          <div className="space-y-4">
            {factorConfig.map(({ key, label, desc }) => {
              const currentVal = (weights as any)[key] || 0;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{label}</span>
                      <p className="text-[11px] text-slate-400">{desc}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-md">
                      {currentVal.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.5"
                    step="0.01"
                    value={currentVal}
                    onChange={(e) =>
                      setWeights((prev) => ({
                        ...prev,
                        [key]: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[#9A9CEA] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Tier Thresholds & Evidence Coverage (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tier Thresholds */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#17233C]">Risk Tier Cutoff Boundaries</h3>
              <p className="text-xs text-slate-500">Maximum score for each tier level</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="font-bold text-emerald-900">LOW Risk Max Cutoff:</span>
                <input
                  type="number"
                  value={thresholds.low_max}
                  onChange={(e) =>
                    setThresholds((prev) => ({ ...prev, low_max: parseInt(e.target.value) || 0 }))
                  }
                  className="w-16 text-center font-mono font-bold bg-white border border-emerald-300 rounded-lg py-1"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="font-bold text-amber-900">MEDIUM Risk Max Cutoff:</span>
                <input
                  type="number"
                  value={thresholds.medium_max}
                  onChange={(e) =>
                    setThresholds((prev) => ({ ...prev, medium_max: parseInt(e.target.value) || 0 }))
                  }
                  className="w-16 text-center font-mono font-bold bg-white border border-amber-300 rounded-lg py-1"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/70 border border-orange-200">
                <span className="font-bold text-orange-900">HIGH Risk Max Cutoff:</span>
                <input
                  type="number"
                  value={thresholds.high_max}
                  onChange={(e) =>
                    setThresholds((prev) => ({ ...prev, high_max: parseInt(e.target.value) || 0 }))
                  }
                  className="w-16 text-center font-mono font-bold bg-white border border-orange-300 rounded-lg py-1"
                />
              </div>

              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between text-rose-900">
                <span className="font-bold">CRITICAL Risk Threshold:</span>
                <span className="font-mono font-bold">&gt; {thresholds.high_max} (Always BLOCKED)</span>
              </div>
            </div>
          </div>

          {/* Evidence Coverage Threshold */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#17233C]">Evidence Grounding Threshold</h3>
              <span className="font-mono font-bold text-sm text-[#17233C]">
                {Math.round(coverageThreshold * 100)}%
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Retrieval coverage required before triggering automated verification flow
            </p>
            <input
              type="range"
              min="0.4"
              max="0.95"
              step="0.05"
              value={coverageThreshold}
              onChange={(e) => setCoverageThreshold(parseFloat(e.target.value))}
              className="w-full accent-[#9A9CEA] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
