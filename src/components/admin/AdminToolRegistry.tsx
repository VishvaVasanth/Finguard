import React, { useState, useEffect } from 'react';
import { FinancialTool } from '../../types.ts';
import { Wrench, Shield, Check, Lock, AlertTriangle } from 'lucide-react';

export const AdminToolRegistry: React.FC = () => {
  const [tools, setTools] = useState<FinancialTool[]>([]);

  useEffect(() => {
    fetch('/api/admin/tools')
      .then((res) => res.json())
      .then((d) => setTools(d.tools || []))
      .catch((err) => console.error('Failed to load tools:', err));
  }, []);

  const handleToggle = async (toolId: string, field: 'enabled' | 'requires_approval') => {
    const target = tools.find((t) => t.tool_id === toolId);
    if (!target) return;

    const updatedVal = !target[field];
    setTools((prev) =>
      prev.map((t) => (t.tool_id === toolId ? { ...t, [field]: updatedVal } : t))
    );

    await fetch(`/api/admin/tools/${toolId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: updatedVal }),
    });
  };

  return (
    <div id="admin-tool-registry-view" className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-600" />
          Financial Tool Registry & Sandbox Controls
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Define tool authorization gates, risk constraints, human-signoff requirements, and RBAC policies
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-semibold">
            <tr>
              <th className="px-5 py-3.5">Tool ID & Name</th>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5 text-center">Risk Level</th>
              <th className="px-5 py-3.5">Allowed Roles</th>
              <th className="px-5 py-3.5 text-center">Human Signoff</th>
              <th className="px-5 py-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tools.map((tool) => (
              <tr key={tool.tool_id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-bold text-slate-900">{tool.name}</div>
                  <div className="font-mono text-[10px] text-slate-400">{tool.tool_id} (v{tool.version})</div>
                </td>
                <td className="px-5 py-4 text-slate-600 max-w-xs">{tool.description}</td>
                <td className="px-5 py-4 text-center">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                      tool.risk_level >= 4
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : tool.risk_level >= 2
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    Level {tool.risk_level} / 5
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-[11px] text-slate-700">
                  {(tool.allowed_roles || []).join(', ')}
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => handleToggle(tool.tool_id, 'requires_approval')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      tool.requires_approval
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {tool.requires_approval ? 'Required' : 'Optional'}
                  </button>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => handleToggle(tool.tool_id, 'enabled')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      tool.enabled
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                  >
                    {tool.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
