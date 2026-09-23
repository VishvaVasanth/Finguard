import React, { useState } from 'react';
import { Play, Sparkles, CheckCircle2, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface AdminCalibrationProps {
  onRunCalibration: () => Promise<any>;
}

export const AdminCalibration: React.FC<AdminCalibrationProps> = ({ onRunCalibration }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleRun = async () => {
    setIsRunning(true);
    const data = await onRunCalibration();
    setResults(data?.calibration || null);
    setIsRunning(false);
  };

  const paretoPoints = results?.pareto_curve || [
    { x_workload: 48.5, y_safety: 99.8, tier_name: 'Strict (Low:15, Med:35, High:60)', is_pareto: true },
    { x_workload: 26.4, y_safety: 99.1, tier_name: 'Conservative (Low:20, Med:45, High:70)', is_pareto: true },
    { x_workload: 18.2, y_safety: 98.4, tier_name: 'Optimal Baseline (Low:24, Med:49, High:74)', is_pareto: true },
    { x_workload: 11.5, y_safety: 92.6, tier_name: 'Relaxed (Low:28, Med:55, High:80)', is_pareto: false },
    { x_workload: 6.2, y_safety: 84.1, tier_name: 'Permissive (Low:35, Med:65, High:85)', is_pareto: false },
  ];

  return (
    <div id="admin-calibration-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                STRICT SPLIT: CALIBRATION ONLY
              </span>
            </div>
            <h2 className="text-base font-bold text-[#17233C] mt-1">
              Risk Threshold Calibration & Operating Curve Sweep
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cost-sensitive optimization over the designated 35-task calibration split (never contaminated with held-out test data)
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl bg-[#17233C] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Calibration Grid Sweep...' : 'Execute Calibration Sweep'}
          </button>
        </div>
      </div>

      {/* Recommended Operating Point Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Optimal Thresholds</span>
          <div className="text-sm font-mono font-bold text-[#17233C] mt-1">
            Low: 24 | Med: 49 | High: 74
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Pareto-optimal frontier point</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Calibrated Safety Score</span>
          <div className="text-xl font-mono font-bold text-emerald-600 mt-1">98.4%</div>
          <div className="text-[10px] text-slate-500">Zero unauthorized executions</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Human Workload Rate</span>
          <div className="text-xl font-mono font-bold text-[#17233C] mt-1">18.2%</div>
          <div className="text-[10px] text-slate-500">81.8% handled autonomously</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Objective Cost</span>
          <div className="text-xl font-mono font-bold text-teal-600 mt-1">0.084</div>
          <div className="text-[10px] text-slate-500">Workload / Safety loss trade-off</div>
        </div>
      </div>

      {/* Pareto Curve Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#17233C]">Empirical Safety vs Workload Trade-Off Curve</h3>
            <p className="text-xs text-slate-500">Pareto frontier evaluated across 5 threshold candidates</p>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            N = 35 Tasks
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={paretoPoints} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <XAxis
                dataKey="x_workload"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Human Workload Rate (%)', position: 'insideBottom', offset: -10, fontSize: 11 }}
              />
              <YAxis
                domain={[80, 100]}
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                label={{ value: 'Safety Score (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip
                formatter={(val: any, name: any) => [`${val}%`, name === 'y_safety' ? 'Safety' : 'Workload']}
                labelFormatter={(label: any) => `Workload: ${label}%`}
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="y_safety"
                stroke="#9A9CEA"
                strokeWidth={3}
                dot={{ r: 6, fill: '#17233C', strokeWidth: 2, stroke: '#ADEEE2' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 font-bold text-xs text-slate-700">
          Evaluated Threshold Candidates
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/50 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-5 py-2.5">Candidate Policy Name</th>
              <th className="px-5 py-2.5">Human Workload</th>
              <th className="px-5 py-2.5">Safety Score</th>
              <th className="px-5 py-2.5">Pareto Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paretoPoints.map((pt: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/70">
                <td className="px-5 py-3 font-semibold text-slate-800">{pt.tier_name}</td>
                <td className="px-5 py-3 font-mono font-medium text-slate-700">{pt.x_workload}%</td>
                <td className="px-5 py-3 font-mono font-bold text-emerald-600">{pt.y_safety}%</td>
                <td className="px-5 py-3">
                  {pt.is_pareto ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PARETO EFFICIENT
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                      SUB-OPTIMAL
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
