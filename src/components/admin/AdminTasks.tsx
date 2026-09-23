import React, { useState } from 'react';
import { FinancialTask } from '../../types.ts';
import { Search, Filter, Database, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AdminTasksProps {
  tasks: FinancialTask[];
}

export const AdminTasks: React.FC<AdminTasksProps> = ({ tasks }) => {
  const [selectedSplit, setSelectedSplit] = useState<'ALL' | 'DEVELOPMENT' | 'CALIBRATION' | 'HELD_OUT_TEST'>('ALL');
  const [selectedDataset, setSelectedDataset] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter((t) => {
    const matchesSplit = selectedSplit === 'ALL' || t.split === selectedSplit;
    const matchesDataset = selectedDataset === 'ALL' || t.dataset === selectedDataset;
    const matchesSearch =
      !searchQuery ||
      t.task_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.intent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSplit && matchesDataset && matchesSearch;
  });

  const splitCounts = {
    ALL: tasks.length,
    DEVELOPMENT: tasks.filter((t) => t.split === 'DEVELOPMENT').length,
    CALIBRATION: tasks.filter((t) => t.split === 'CALIBRATION').length,
    HELD_OUT_TEST: tasks.filter((t) => t.split === 'HELD_OUT_TEST').length,
  };

  return (
    <div id="admin-tasks-view" className="space-y-4">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#9A9CEA]" />
              Enterprise Financial Benchmark Task Suite
            </h2>
            <p className="text-xs text-slate-500">
              Curated suite of {tasks.length} benchmark financial tasks across strictly partitioned splits
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, intents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Split Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'DEVELOPMENT', 'CALIBRATION', 'HELD_OUT_TEST'] as const).map((split) => (
              <button
                key={split}
                onClick={() => setSelectedSplit(split)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedSplit === split
                    ? 'bg-white text-[#17233C] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {split.replace('_', ' ')} ({splitCounts[split]})
              </button>
            ))}
          </div>

          {/* Dataset Dropdown Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Dataset:</span>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Datasets</option>
              <option value="FinanceBench">FinanceBench</option>
              <option value="TAT-QA">TAT-QA</option>
              <option value="FinOps Suite">FinOps Suite</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3">Task ID</th>
                <th className="px-4 py-3">Dataset & Split</th>
                <th className="px-4 py-3">Task Question</th>
                <th className="px-4 py-3">Expected Action</th>
                <th className="px-4 py-3">Allowed Tools</th>
                <th className="px-4 py-3 text-center">Adversarial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No benchmark tasks match your current filter.
                  </td>
                </tr>
              ) : (
                filteredTasks.slice(0, 50).map((task) => (
                  <tr key={task.task_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{task.task_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{task.dataset}</div>
                      <span
                        className={`inline-block text-[10px] font-mono px-1.5 py-0.2 rounded mt-0.5 ${
                          task.split === 'CALIBRATION'
                            ? 'bg-indigo-50 text-indigo-700'
                            : task.split === 'HELD_OUT_TEST'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.split}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-sm">
                      <div className="line-clamp-2">{task.question}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 italic">Intent: {task.intent}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[11px] font-semibold text-[#17233C] px-2 py-0.5 rounded bg-slate-100">
                        {task.expected_action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {task.allowed_tools.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-50 border border-slate-200 text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {task.adversarial_flags ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <ShieldAlert className="w-3 h-3 text-rose-500" />
                          CANARY
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">Standard</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
