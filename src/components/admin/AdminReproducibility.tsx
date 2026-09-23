import React, { useState, useEffect } from 'react';
import { Download, FileJson, Copy, Check, ShieldCheck } from 'lucide-react';

export const AdminReproducibility: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'experiment.json' | 'config.json' | 'policy.json' | 'thresholds.json' | 'metrics.json' | 'traces.jsonl'
  >('experiment.json');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/admin/reproducibility')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error('Failed to load reproducibility bundle:', err));
  }, []);

  const getActiveContent = () => {
    if (!data) return 'Loading reproducibility bundle...';
    switch (activeTab) {
      case 'experiment.json':
        return JSON.stringify(data.experiment || {}, null, 2);
      case 'config.json':
        return JSON.stringify(data.config || {}, null, 2);
      case 'policy.json':
        return JSON.stringify(data.active_policy || {}, null, 2);
      case 'thresholds.json':
        return JSON.stringify(data.active_policy?.thresholds || {}, null, 2);
      case 'metrics.json':
        return JSON.stringify(data.metrics || {}, null, 2);
      case 'traces.jsonl':
        return data.traces_jsonl_content || '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = getActiveContent();
    const blob = new Blob([content], {
      type: activeTab.endsWith('.jsonl') ? 'text/plain' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: (typeof activeTab)[] = [
    'experiment.json',
    'config.json',
    'policy.json',
    'thresholds.json',
    'metrics.json',
    'traces.jsonl',
  ];

  return (
    <div id="admin-reproducibility-view" className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#9A9CEA]" />
            Reproducibility Center
          </h2>
          <p className="text-xs text-slate-500">
            Export machine-readable configuration, calibrated thresholds, benchmark metrics, and execution trace logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-1.5 rounded-xl bg-[#17233C] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download {activeTab}
          </button>
        </div>
      </div>

      {/* Artifacts Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-white text-[#17233C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Code / JSON Viewer */}
      <div className="bg-[#101828] rounded-2xl p-5 border border-slate-800 shadow-md font-mono text-xs text-slate-200 overflow-x-auto max-h-[600px]">
        <pre className="whitespace-pre">{getActiveContent()}</pre>
      </div>
    </div>
  );
};
