import React, { useState } from 'react';
import { AuditEvent } from '../../types.ts';
import { ShieldCheck, Search, FileCode, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';

interface AdminAuditLogsProps {
  auditEvents: AuditEvent[];
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ auditEvents }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = auditEvents.filter(
    (ev) =>
      !search ||
      ev.action.toLowerCase().includes(search.toLowerCase()) ||
      ev.summary.toLowerCase().includes(search.toLowerCase()) ||
      ev.request_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="admin-audit-logs-view" className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Immutable Governance Audit & Trace Log
          </h2>
          <p className="text-xs text-slate-500">
            Chronological audit events recorded across all lifecycle nodes with structured trace IDs
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit actions, IDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Request & Trace</th>
                <th className="px-4 py-3">Node</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  return (
                    <React.Fragment key={ev.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(ev.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-slate-800">{ev.request_id}</div>
                          <div className="font-mono text-[10px] text-slate-400">{ev.trace_id}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{ev.node_name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              ev.action.includes('BLOCK')
                                ? 'bg-rose-50 text-rose-700'
                                : ev.action.includes('APPROVE')
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {ev.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium max-w-sm truncate">
                          {ev.summary}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button className="text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && ev.details && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={6} className="px-6 py-3">
                            <div className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-xl border border-slate-200 overflow-x-auto">
                              <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
