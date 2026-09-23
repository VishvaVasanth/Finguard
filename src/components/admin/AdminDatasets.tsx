import React, { useState, useEffect } from 'react';
import { Database, FileText, Search, Tag } from 'lucide-react';

export const AdminDatasets: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  useEffect(() => {
    fetch('/api/admin/datasets')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        if (d.documents?.[0]) setSelectedDocId(d.documents[0].id);
      })
      .catch((err) => console.error('Failed to load datasets:', err));
  }, []);

  const documents = data?.documents || [];
  const selectedDoc = documents.find((d: any) => d.id === selectedDocId) || documents[0];

  return (
    <div id="admin-datasets-view" className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-[#17233C] flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-600" />
          RAG Document Knowledge Store & Evidence Corpus
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise filings, corporate vendor agreements, and financial tables indexed for BM25 + Vector semantic retrieval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Document List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Indexed Documents ({documents.length})
          </div>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
            {documents.map((doc: any) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedDoc?.id === doc.id
                    ? 'bg-[#9A9CEA]/10 border-[#9A9CEA]/40 text-[#17233C]'
                    : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold truncate">{doc.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>{doc.dataset || doc.category || 'Financial 10-K'}</span>
                  <span>{doc.chunks?.length || 0} chunks</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chunks Preview (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
          {selectedDoc ? (
            <>
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#17233C]">{selectedDoc.title}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Dataset: <span className="font-semibold text-slate-700">{selectedDoc.dataset || selectedDoc.category || 'SEC 10-K Master'}</span> • Role Access:{' '}
                    <span className="font-mono text-slate-700">
                      {(selectedDoc.authorized_roles || selectedDoc.role_access || ['USER', 'ADMIN', 'REVIEWER']).join(', ')}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  ID: {selectedDoc.id}
                </span>
              </div>

              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Verified Chunks ({selectedDoc.chunks?.length || 0})
                </div>
                {(selectedDoc.chunks || []).map((chunk: any) => (
                  <div
                    key={chunk.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 text-[10px] font-mono">
                      <span>Chunk ID: {chunk.id}</span>
                      <span>Page: {chunk.page || 'N/A'} • Section: {chunk.section || 'General'}</span>
                    </div>
                    <p className="text-slate-800 font-sans leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                      "{chunk.text}"
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a document to inspect its chunks.</div>
          )}
        </div>
      </div>
    </div>
  );
};
