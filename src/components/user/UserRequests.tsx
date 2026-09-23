import React, { useState } from 'react';
import { RequestRecord, User } from '../../types.ts';
import { StatusBadge } from '../common/Badges.tsx';
import { FormattedMarkdown } from '../common/FormattedMarkdown.tsx';
import { MessageSquare, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface UserRequestsProps {
  currentUser: User;
  requests: RequestRecord[];
  onSelectRequest: (req: RequestRecord) => void;
  onSendReviewerReply: (requestId: string, message: string) => Promise<void>;
}

export const UserRequests: React.FC<UserRequestsProps> = ({
  requests,
  onSendReviewerReply,
}) => {
  const [selectedReq, setSelectedReq] = useState<RequestRecord | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleReplySubmit = () => {
    if (!selectedReq || !replyText.trim()) return;
    onSendReviewerReply(selectedReq.request_id, replyText.trim());
    setReplyText('');
  };

  return (
    <div id="user-requests-view" className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#17233C]">My Financial Requests</h2>
          <p className="text-xs text-slate-500">Track current status and reviewer communications for your submissions</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          {requests.length} Total Submissions
        </span>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Request ID</th>
              <th className="px-5 py-3.5">Request Description</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Created</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                  No requests submitted yet. Ask a question in the assistant to get started.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr
                  key={req.request_id}
                  onClick={() => setSelectedReq(req)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-800">{req.request_id}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900 max-w-xs truncate">
                    {req.request_text}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReq(req);
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal / Panel */}
      {selectedReq && (
        <div
          id="request-details-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-mono text-slate-400">{selectedReq.request_id}</span>
                <h3 className="text-base font-bold text-[#17233C] mt-0.5">Request Details</h3>
              </div>
              <StatusBadge status={selectedReq.status} />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Original Request</span>
                <p className="mt-1 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-900 font-medium">
                  {selectedReq.request_text}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-500 uppercase text-[10px]">Assistant Response</span>
                <div className="mt-1 p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 text-slate-800 text-xs">
                  <FormattedMarkdown content={selectedReq.safe_response} />
                </div>
              </div>

              {/* Reviewer Thread (User-Visible Messages Only) */}
              {selectedReq.review_task && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    Reviewer Communication Thread
                  </div>

                  <div className="space-y-2">
                    {selectedReq.review_task.messages
                      ?.filter((m) => m.visibility === 'USER_VISIBLE')
                      .map((m) => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-lg leading-relaxed ${
                            m.sender_role === 'USER'
                              ? 'bg-slate-100 border border-slate-200 text-slate-800 ml-4'
                              : 'bg-amber-50 border border-amber-200 text-amber-950 font-medium'
                          }`}
                        >
                          <div className="text-[10px] text-amber-800 font-bold mb-0.5">
                            {m.sender_name} ({m.sender_role}):
                          </div>
                          <div>{m.message}</div>
                        </div>
                      ))}
                  </div>

                  {selectedReq.status === 'WAITING_FOR_REVIEW' && (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Type response for the reviewer..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit()}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
                      />
                      <button
                        onClick={handleReplySubmit}
                        className="px-3 py-1.5 rounded-lg bg-[#17233C] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
