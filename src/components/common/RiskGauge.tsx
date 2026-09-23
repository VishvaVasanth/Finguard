import React from 'react';
import { RiskAssessment, RiskVector } from '../../types.ts';
import { RiskTierBadge } from './Badges.tsx';

interface RiskGaugeProps {
  assessment: RiskAssessment;
  showBreakdown?: boolean;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ assessment, showBreakdown = true }) => {
  const { score, tier, vector } = assessment;

  // Arc calculation for SVG gauge
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getTierColor = () => {
    switch (tier) {
      case 'LOW':
        return '#10B981'; // emerald
      case 'MEDIUM':
        return '#F59E0B'; // amber
      case 'HIGH':
        return '#F97316'; // orange
      case 'CRITICAL':
        return '#EF4444'; // rose
    }
  };

  const vectorLabels: { key: keyof RiskVector; label: string }[] = [
    { key: 'sensitivity', label: 'Sensitivity' },
    { key: 'financial_impact', label: 'Financial Impact' },
    { key: 'irreversibility', label: 'Irreversibility' },
    { key: 'evidence_requirement', label: 'Evidence Req.' },
    { key: 'tool_risk', label: 'Tool Execution Risk' },
    { key: 'model_uncertainty', label: 'Model Uncertainty' },
  ];

  return (
    <div id="risk-gauge-container" className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Risk Tier & Governance</span>
          <div className="mt-1">
            <RiskTierBadge tier={tier} size="md" />
          </div>
        </div>

        {/* Circular Gauge */}
        <div className="relative flex items-center justify-center w-24 h-24">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#E2E8F0"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={getTierColor()}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-[#17233C]">{Math.round(score)}</span>
            <span className="text-[10px] uppercase font-semibold text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-600 mb-2">6-Factor Risk Vector Analysis (0-5)</div>
          {vectorLabels.map(({ key, label }) => {
            const val = vector[key];
            const pct = (val / 5) * 100;
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{label}</span>
                  <span className="font-mono font-medium text-slate-800">{val} / 5</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      val >= 4 ? 'bg-rose-500' : val >= 3 ? 'bg-orange-400' : val >= 2 ? 'bg-amber-400' : 'bg-[#9A9CEA]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
