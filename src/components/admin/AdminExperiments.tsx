import React, { useState } from 'react';
import { Play, Sparkles, AlertTriangle, CheckCircle2, TrendingDown, Layers } from 'lucide-react';
import { ExperimentRun } from '../../types.ts';

interface AdminExperimentsProps {
  experiments: ExperimentRun[];
  onRunExperiment: (params: any) => Promise<any>;
  onRunAblations: () => Promise<any>;
}

export const AdminExperiments: React.FC<AdminExperimentsProps> = ({
  experiments,
  onRunExperiment,
  onRunAblations,
}) => {
  const [selectedDataset, setSelectedDataset] = useState('FinanceBench');
  const [selectedSplit, setSelectedSplit] = useState<'DEVELOPMENT' | 'CALIBRATION' | 'HELD_OUT_TEST'>('DEVELOPMENT');
  const [selectedPolicy, setSelectedPolicy] = useState('pol-v2-prod');
  const [isRunningExp, setIsRunningExp] = useState(false);

  const [isRunningAblations, setIsRunningAblations] = useState(false);
  const [ablationResults, setAblationResults] = useState<any[] | null>(null);

  const handleExecuteExp = async () => {
    setIsRunningExp(true);
    await onRunExperiment({
      dataset: selectedDataset,
      split: selectedSplit,
      policyId: selectedPolicy,
      model: 'gemini-3.8-flash',
    });
    setIsRunningExp(false);
  };

  const handleExecuteAblations = async () => {
    setIsRunningAblations(true);
    const res = await onRunAblations();
    setAblationResults(res?.ablations || []);
    setIsRunningAblations(false);
  };

  return (
    <div id="admin-experiments-view" className="space-y-6">
      {/* Experiment Trigger & Config Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#9A9CEA]" />
              Controlled Experiment Evaluation Runner
            </h2>
            <p className="text-xs text-slate-500">
              Execute reproducible benchmarks with server-side LLM reasoning under defined governance policies
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExecuteAblations}
              disabled={isRunningAblations}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {isRunningAblations ? 'Running Ablations...' : 'Run Ablation Suite'}
            </button>

            <button
              onClick={handleExecuteExp}
              disabled={isRunningExp}
              className="px-4 py-2 rounded-xl bg-[#17233C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              {isRunningExp ? 'Running...' : 'Run Experiment'}
            </button>
          </div>
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Benchmark Dataset:</label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="FinanceBench">FinanceBench (Corporate QA)</option>
              <option value="TAT-QA">TAT-QA (Financial Tables)</option>
              <option value="FinOps Suite">FinOps Suite (Operations & Wires)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Partition Split:</label>
            <select
              value={selectedSplit}
              onChange={(e: any) => setSelectedSplit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="DEVELOPMENT">DEVELOPMENT Split (35 tasks)</option>
              <option value="CALIBRATION">CALIBRATION Split (35 tasks)</option>
              <option value="HELD_OUT_TEST">HELD_OUT_TEST Split (32 tasks)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Governance Policy:</label>
            <select
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-hidden"
            >
              <option value="pol-v2-prod">FinGuard Multi-Tier v2.4 (Baseline)</option>
              <option value="pol-v1-strict">FinGuard Ultra-Strict L4 (v1.0)</option>
              <option value="pol-v3-relaxed">FinGuard Autonomous Permissive</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">LLM Reasoning Engine:</label>
            <input
              type="text"
              readOnly
              value="gemini-3.8-flash"
              className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2 font-mono font-bold text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* Ablation Studies Results (if triggered or available) */}
      {ablationResults && ablationResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs space-y-3 p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Ablation Suite
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#17233C] mt-1">
              Factor Contribution & Safety Significance Table
            </h3>
            <p className="text-xs text-slate-500">
              Measuring degradation in safety score and incident spikes when removing each individual risk dimension
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-3.5 py-2.5">Ablation Variant</th>
                  <th className="px-3.5 py-2.5">Factor Removed</th>
                  <th className="px-3.5 py-2.5 text-right">Safety Score</th>
                  <th className="px-3.5 py-2.5 text-right">Incident Rate</th>
                  <th className="px-3.5 py-2.5 text-right">Human Workload</th>
                  <th className="px-3.5 py-2.5 text-right">Safety Variance (Δ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ablationResults.map((abl) => {
                  const isBaseline = abl.ablation_id === 'abl-00';
                  return (
                    <tr key={abl.ablation_id} className={isBaseline ? 'bg-slate-50/90 font-bold' : 'hover:bg-slate-50/50'}>
                      <td className="px-3.5 py-2.5 font-sans font-medium text-slate-900">{abl.name}</td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-sans">{abl.factor_removed}</td>
                      <td className="px-3.5 py-2.5 text-right text-emerald-700 font-bold">{abl.safety_score}%</td>
                      <td className="px-3.5 py-2.5 text-right text-rose-600">{abl.incident_rate}%</td>
                      <td className="px-3.5 py-2.5 text-right text-slate-700">{abl.human_workload}%</td>
                      <td
                        className={`px-3.5 py-2.5 text-right font-bold ${
                          abl.variance_from_baseline_safety < 0 ? 'text-rose-600' : 'text-slate-600'
                        }`}
                      >
                        {abl.variance_from_baseline_safety > 0 ? '+' : ''}
                        {abl.variance_from_baseline_safety}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Experiment Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 font-bold text-xs text-slate-700">
          Recorded Experiment History
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5">Run ID</th>
                <th className="px-4 py-2.5">Dataset & Split</th>
                <th className="px-4 py-2.5">Policy Used</th>
                <th className="px-4 py-2.5 text-right">Safety Score</th>
                <th className="px-4 py-2.5 text-right">Incident Rate</th>
                <th className="px-4 py-2.5 text-right">Human Workload</th>
                <th className="px-4 py-2.5 text-center">Pareto Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {experiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{exp.name}</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{exp.dataset}</div>
                    <span className="text-[10px] font-mono text-slate-500">{exp.split}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{exp.policy_id}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                    {exp.metrics.safety_score}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {exp.metrics.incident_rate}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-700">
                    {exp.metrics.human_intervention_rate}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    {exp.metrics.pareto_optimal ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PARETO OPTIMAL
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sub-optimal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
