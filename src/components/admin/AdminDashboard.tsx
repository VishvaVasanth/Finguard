import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, Ban, CheckCircle2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';

interface AdminDashboardProps {
  stats: any;
  onNavigateToReviews: () => void;
  onNavigateToCalibration: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  onNavigateToReviews,
  onNavigateToCalibration,
}) => {
  const kpis = stats?.kpis || {
    total_requests: 124,
    pending_reviews: 4,
    completed: 96,
    blocked: 18,
    escalated: 6,
    safety_incident_rate: 0.0,
    unsupported_claim_rate: 1.1,
    human_intervention_rate: 18.2,
    active_policy: 'FinGuard Multi-Tier Conservative',
    policy_version: 'v2.4',
  };

  const govDist = stats?.governance_distribution || {
    AUTO: 72,
    VERIFY: 18,
    APPROVE: 24,
    ESCALATE: 6,
    BLOCK: 4,
  };

  const govChartData = [
    { name: 'AUTO', count: govDist.AUTO, fill: '#ADEEE2' },
    { name: 'VERIFY', count: govDist.VERIFY, fill: '#A2DCEE' },
    { name: 'APPROVE', count: govDist.APPROVE, fill: '#A2B9EE' },
    { name: 'ESCALATE', count: govDist.ESCALATE, fill: '#9A9CEA' },
    { name: 'BLOCK', count: govDist.BLOCK, fill: '#F43F5E' },
  ];

  const paretoData = [
    { workload: 48.5, safety: 99.8, label: 'Strict' },
    { workload: 26.4, safety: 99.1, label: 'Conservative' },
    { workload: 18.2, safety: 98.4, label: 'Baseline (v2.4)' },
    { workload: 11.5, safety: 92.6, label: 'Relaxed' },
    { workload: 6.2, safety: 84.1, label: 'Permissive' },
  ];

  return (
    <div id="admin-dashboard-view" className="space-y-6">
      {/* Top Welcome & Policy Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Governance Command & Research Center
          </span>
          <h2 className="text-xl font-bold tracking-tight text-[#17233C] mt-0.5">
            Real-Time AI Safety & Risk Telemetry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Active Governance Policy: <strong className="text-slate-800">{kpis.active_policy}</strong> ({kpis.policy_version})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {kpis.pending_reviews > 0 && (
            <button
              onClick={onNavigateToReviews}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 animate-pulse"
            >
              <Clock className="w-4 h-4" />
              {kpis.pending_reviews} Pending In Review Queue
            </button>
          )}
          <button
            onClick={onNavigateToCalibration}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Calibration Lab
          </button>
        </div>
      </div>

      {/* 6 Primary Governance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Safety Incident Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Incident Rate</span>
          <div className="text-xl font-bold text-emerald-600 font-mono">{kpis.safety_incident_rate}%</div>
          <div className="text-[10px] text-slate-500">Target: 0.0%</div>
        </div>

        {/* Human Workload */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Intervention Rate</span>
          <div className="text-xl font-bold text-[#17233C] font-mono">{kpis.human_intervention_rate}%</div>
          <div className="text-[10px] text-slate-500">Target: &lt; 20%</div>
        </div>

        {/* Total Requests */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Requests</span>
          <div className="text-xl font-bold text-[#17233C] font-mono">{kpis.total_requests}</div>
          <div className="text-[10px] text-slate-500">Autonomous: {kpis.completed}</div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Review Queue</span>
          <div className="text-xl font-bold text-amber-600 font-mono">{kpis.pending_reviews}</div>
          <div className="text-[10px] text-slate-500">Awaiting signoff</div>
        </div>

        {/* Blocked Actions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Safe Blocks</span>
          <div className="text-xl font-bold text-rose-600 font-mono">{kpis.blocked}</div>
          <div className="text-[10px] text-slate-500">Unauthorized/Adversarial</div>
        </div>

        {/* Unsupported Claim Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hallucination Rate</span>
          <div className="text-xl font-bold text-teal-600 font-mono">{kpis.unsupported_claim_rate}%</div>
          <div className="text-[10px] text-slate-500">RAG Grounding</div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Governance Mode Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17233C]">Governance Mode Routing</h3>
              <p className="text-xs text-slate-500">Distribution across 5 canonical routing regimes</p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Live Pipeline
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={govChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [val, 'Requests']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#9A9CEA" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pareto Safety vs Human Workload Curve */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17233C]">Safety vs Human Workload Pareto Frontier</h3>
              <p className="text-xs text-slate-500">Calibrated risk threshold operating curve</p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Optimal Operating Point
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paretoData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="workload"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: 'Human Workload Rate (%)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
                />
                <YAxis
                  domain={[80, 100]}
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: 'Safety Score (%)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="safety"
                  stroke="#9A9CEA"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#17233C', strokeWidth: 2, stroke: '#ADEEE2' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
