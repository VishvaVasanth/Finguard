import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calculator,
  Building2,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { FinancialRequest, User } from '../../types.ts';
import { BrandSignature } from '../BrandSignature.tsx';
import { FormattedMarkdown } from '../common/FormattedMarkdown.tsx';

interface UserChatProps {
  currentUser: User;
  requests: FinancialRequest[];
  onSubmitQuery: (query: string) => void;
  onSendReviewerReply: (requestId: string, message: string) => void;
  isProcessing: boolean;
  processingStep?: string;
}

export const UserChat: React.FC<UserChatProps> = ({
  currentUser,
  requests,
  onSubmitQuery,
  onSendReviewerReply,
  isProcessing,
  processingStep,
}) => {
  const [inputText, setInputText] = useState('');
  const [pendingUserPrompt, setPendingUserPrompt] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [expandedCalcs, setExpandedCalcs] = useState<Record<string, boolean>>({});
  const [showProfitCalc, setShowProfitCalc] = useState(false);
  const [calcRevenue, setCalcRevenue] = useState('500');
  const [calcCost, setCalcCost] = useState('320');
  const [calcOpex, setCalcOpex] = useState('60');
  const [calcTax, setCalcTax] = useState('25');
  const [calcCurrency, setCalcCurrency] = useState('$');
  const [calcUnit, setCalcUnit] = useState('Million');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isProcessing) {
      setPendingUserPrompt(null);
    }
  }, [isProcessing]);

  const supportedCompanies = [
    { name: 'Apple', ticker: 'AAPL', query: "What was Apple's revenue and gross profit in 2023 and 2024?" },
    { name: 'Microsoft', ticker: 'MSFT', query: "Show Microsoft's revenue, net income, and margins from 2020 to 2025." },
    { name: 'Walmart', ticker: 'WMT', query: "What was Walmart's revenue, gross profit, and operating margin in 2024?" },
    { name: 'JPMorgan', ticker: 'JPM', query: "Show JPMorgan Chase's revenue, net income, and profit margins for 2024." },
    { name: 'NVIDIA', ticker: 'NVDA', query: "Calculate NVIDIA's revenue growth in FY2024 with step-by-step formula execution." },
    { name: 'Netflix', ticker: 'NFLX', query: "What was Netflix's revenue, operating income, and net margin in 2024?" },
    { name: 'Tesla', ticker: 'TSLA', query: "What was Tesla's revenue, CapEx, and free cash flow in 2024?" },
    { name: 'Amazon', ticker: 'AMZN', query: "Show Amazon's multi-year revenue progression and operating income." },
    { name: 'Google', ticker: 'GOOGL', query: "What was Alphabet/Google's revenue and net profit in FY2024?" },
    { name: 'Meta', ticker: 'META', query: "What was Meta's operating margin and diluted EPS in 2024?" },
    { name: 'Reliance', ticker: 'RELIANCE', query: "What was Reliance Industries' revenue and EBITDA in FY2024?" },
    { name: 'Compare AAPL vs MSFT', ticker: 'Comparison', query: "Compare Apple and Microsoft in 2024 (Revenue, Margins, Net Income, EPS)." },
  ];

  const suggestedPrompts = [
    {
      title: "Calculate Profit from Values",
      prompt: "Given Revenue = $500M, Cost = $320M, OPEX = $60M, and Taxes = $25M, calculate Gross Profit, Operating Profit, Net Profit, and Margins.",
      tag: "Profit Math",
    },
    {
      title: "Apple (AAPL) 10-K Operations",
      prompt: "What was Apple's revenue and gross profit in 2023 and 2024 with SEC 10-K citations?",
      tag: "Apple Grounded",
    },
    {
      title: "Walmart (WMT) FY24 Operations",
      prompt: "What was Walmart's revenue, gross profit, and operating margin in 2024 with SEC Form 10-K citations?",
      tag: "Retail Blue-Chip",
    },
    {
      title: "JPMorgan Chase (JPM) Banking",
      prompt: "Show JPMorgan Chase's revenue, net income, and profit margins from 2020 to 2025.",
      tag: "Banking 10-K",
    },
    {
      title: "NVIDIA (NVDA) FY24 Growth",
      prompt: "Calculate NVIDIA's revenue growth in FY2024 with step-by-step formula execution.",
      tag: "Deterministic Math",
    },
    {
      title: "Apple vs Microsoft Comparison",
      prompt: "Compare Apple and Microsoft in 2024 across revenue, net income, operating margin, and diluted EPS.",
      tag: "Multi-Company",
    },
    {
      title: "Multi-Company Reliability & Governance",
      prompt: "make it reliable for many companies...and also u can make some calculations on finding the profit when some values are given.....",
      tag: "Comprehensive Audit",
    },
  ];

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputText;
    if (!q.trim() || isProcessing) return;
    setPendingUserPrompt(q.trim());
    onSubmitQuery(q.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReplySubmit = (reqId: string) => {
    const msg = replyTexts[reqId];
    if (!msg || !msg.trim()) return;
    onSendReviewerReply(reqId, msg.trim());
    setReplyTexts((prev) => ({ ...prev, [reqId]: '' }));
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests, isProcessing]);

  // Filter requests to display for current conversation
  const displayRequests = [...requests].reverse();

  return (
    <div id="user-chat-viewport" className="relative flex flex-col h-[calc(100vh-5rem)] max-w-4xl mx-auto w-full px-4 sm:px-6">
      <BrandSignature size="bg" />

      {/* Main Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1">
        {displayRequests.length === 0 ? (
          /* Empty state */
          <div id="chat-empty-state" className="flex flex-col items-center justify-center min-h-[55vh] text-center space-y-5 px-4">
            <BrandSignature size="hero" />
            <div className="space-y-2 max-w-lg">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17233C]">
                Good morning, {currentUser.name.split(' ')[0]}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Query verified financial data and calculations across audited SEC 10-K filings for major corporations with zero hallucinations.
              </p>
            </div>

            {/* Supported Company Selector Pills */}
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick-Select Audited Company Data</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {supportedCompanies.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(c.query)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({c.ticker})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Demo Action Prompts */}
            <div className="w-full max-w-2xl mt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Suggested Financial Inquiries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {suggestedPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    id={`btn-prompt-${idx}`}
                    onClick={() => handleSend(item.prompt)}
                    className="p-3 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/80 hover:border-[#9A9CEA]/60 shadow-2xs hover:shadow-xs transition-all group text-left"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#17233C] group-hover:text-[#9A9CEA] transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[#9A9CEA]/10 group-hover:text-[#17233C] transition-colors">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Stream */
          displayRequests.map((req) => {
            const isBlocked = req.governance_mode === 'BLOCK';
            const isApproved = req.governance_mode === 'APPROVE';
            const isAuto = req.governance_mode === 'AUTO';
            const hasCalculation = Boolean(req.calculation_details);
            const reviewerMessages = req.review_task?.messages || [];

            return (
              <div key={req.request_id} id={`msg-wrapper-${req.request_id}`} className="space-y-4 animate-in fade-in duration-200">
                {/* User Query Bubble */}
                <div className="flex justify-end">
                  <div
                    id={`user-bubble-${req.request_id}`}
                    className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-[#17233C] text-white px-4 py-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] font-medium text-slate-300 pb-1.5 border-b border-white/10">
                      <span className="flex items-center gap-1.5 font-semibold text-indigo-200">
                        <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
                        Your Prompt
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {req.created_at ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-white">
                      {req.request_text || req.user_query || 'Financial Inquiry'}
                    </p>
                  </div>
                </div>

                {/* Assistant Grounded Response Card */}
                <div className="flex justify-start">
                  <div
                    id={`assistant-card-${req.request_id}`}
                    className="max-w-[95%] sm:max-w-[88%] rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5"
                  >
                    {/* Header: Governance Policy Badge */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        {isAuto && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Grounded • Zero-Hallucination
                          </span>
                        )}
                        {isApproved && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Requires Authorization
                          </span>
                        )}
                        {isBlocked && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <Lock className="w-3.5 h-3.5 text-rose-600" />
                            Action Blocked by Policy
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {req.governance_result?.risk_score !== undefined && (
                          <span>Risk: {(req.governance_result.risk_score * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>

                    {/* Safe Response Content */}
                    <div className="text-sm text-slate-800 leading-relaxed">
                      <FormattedMarkdown content={req.safe_response} />
                    </div>

                    {/* Grounded Multi-Year Table (if returned) */}
                    {req.yearly_data_table && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-2xs my-2">
                        <div className="p-3 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Audited Financial Schedule (TAT-QA & FinanceBench Grounded)</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            100% SEC 10-K Verified
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-900 font-semibold">
                              <tr>
                                {req.yearly_data_table.headers.map((h, i) => (
                                  <th key={i} className="px-3.5 py-2.5 whitespace-nowrap">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              {req.yearly_data_table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap font-medium text-slate-800">
                                      {String(cell).startsWith('+') ? (
                                        <span className="text-emerald-700 font-bold">{cell}</span>
                                      ) : (
                                        cell
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Calculation Expandable Panel (if applicable) */}
                    {hasCalculation && (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-xs space-y-1.5">
                        <button
                          onClick={() =>
                            setExpandedCalcs((prev) => ({
                              ...prev,
                              [req.request_id]: !prev[req.request_id],
                            }))
                          }
                          className="flex items-center justify-between w-full font-semibold text-slate-700 hover:text-slate-900"
                        >
                          <span className="flex items-center gap-1.5">
                            <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                            Deterministic Calculation Details & Proof
                          </span>
                          {expandedCalcs[req.request_id] ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {expandedCalcs[req.request_id] && (
                          <div className="pt-2 border-t border-slate-200 font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
                            {req.calculation_details}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Citations & Verified Sources (if available) */}
                    {req.evidence_items && req.evidence_items.length > 0 && req.governance_mode === 'AUTO' && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                          Sources
                        </div>
                        <div className="space-y-1.5">
                          {req.evidence_items.slice(0, 2).map((ev, i) => (
                            <div key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                              <span className="text-indigo-600 font-bold">•</span>
                              <span>
                                <strong className="text-slate-700">{ev.document_title}</strong>
                                {ev.page && <span className="text-slate-400"> (Page {ev.page})</span>}
                                {ev.section && <span className="text-slate-400"> — {ev.section}</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviewer Thread & Interactive Reply */}
                    {req.review_task && (
                      <div className="mt-4 pt-3 border-t border-amber-100 bg-amber-50/50 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                          <MessageSquare className="w-4 h-4 text-amber-700" />
                          Authorized Reviewer Communication
                        </div>

                        {reviewerMessages.length > 0 ? (
                          <div className="space-y-2">
                            {reviewerMessages.map((m) => (
                              <div
                                key={m.id}
                                className={`p-2.5 rounded-lg text-xs ${
                                  m.sender_role === 'REVIEWER' || m.sender_role === 'ADMIN'
                                    ? 'bg-amber-100/70 text-amber-950 border border-amber-200'
                                    : 'bg-white text-slate-800 border border-slate-200 ml-4'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                  <span className="font-semibold">{m.sender_name} ({m.sender_role})</span>
                                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="whitespace-pre-wrap">{m.message}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-amber-800">
                            A reviewer has been assigned. You may provide additional context below:
                          </div>
                        )}

                        {/* User reply input box */}
                        {req.review_task.status === 'PENDING' && (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Type your response to the authorized reviewer..."
                              value={replyTexts[req.request_id] || ''}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({ ...prev, [req.request_id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleReplySubmit(req.request_id);
                                }
                              }}
                              className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                            />
                            <button
                              onClick={() => handleReplySubmit(req.request_id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
                            >
                              Send Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Calm Live Process State Indicator with Visible Pending Prompt */}
        {isProcessing && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {pendingUserPrompt && (
              <div className="flex justify-end">
                <div
                  id="user-bubble-pending"
                  className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-[#17233C] text-white px-4 py-3 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] font-medium text-slate-300 pb-1.5 border-b border-white/10">
                    <span className="flex items-center gap-1.5 font-semibold text-indigo-200">
                      <UserIcon className="w-3.5 h-3.5 text-indigo-300" />
                      Your Prompt
                    </span>
                    <span className="text-[10px] text-indigo-300 font-medium animate-pulse">Processing...</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-white">
                    {pendingUserPrompt}
                  </p>
                </div>
              </div>
            )}

            <div id="chat-live-process-indicator" className="flex justify-start">
              <div className="rounded-2xl rounded-tl-xs bg-white/95 border border-slate-200/90 px-4 py-3 shadow-xs flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-indigo-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {processingStep || 'Processing query with multi-company audited 10-K ground truth...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Bottom Chat Input */}
      <div className="py-4 bg-transparent space-y-2.5">
        {/* Quick company & profit calculator action pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setShowProfitCalc((prev) => !prev)}
            className={`text-[11px] px-3 py-1 rounded-full border shrink-0 font-semibold transition-all shadow-2xs flex items-center gap-1.5 ${
              showProfitCalc
                ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-500/20'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 hover:border-indigo-300'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Profit Calculator (Given Values)</span>
            {showProfitCalc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 pl-1">Companies:</span>
          {supportedCompanies.slice(0, 8).map((c, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(c.query)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shrink-0 font-medium transition-all shadow-2xs hover:border-indigo-400"
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Interactive Custom Profit Calculator Panel */}
        {showProfitCalc && (
          <div className="p-3.5 bg-white rounded-2xl border border-indigo-200 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-indigo-100 text-indigo-700">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Custom Value Profit Calculation Engine</h4>
                  <p className="text-[11px] text-slate-500">Discrete step-by-step arithmetic verification with zero hallucination</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setCalcRevenue('500');
                    setCalcCost('320');
                    setCalcOpex('60');
                    setCalcTax('25');
                    setCalcUnit('Million');
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  Preset 1 ($500M)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalcRevenue('1200000');
                    setCalcCost('700000');
                    setCalcOpex('250000');
                    setCalcTax('65000');
                    setCalcUnit('');
                  }}
                  className="px-2 py-0.5 text-[10px] font-medium text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 rounded-md transition-colors"
                >
                  Preset 2 ($1.2M)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Revenue / Sales <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-xs font-medium text-slate-400">{calcCurrency}</span>
                  <input
                    type="number"
                    value={calcRevenue}
                    onChange={(e) => setCalcRevenue(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Cost / COGS <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-xs font-medium text-slate-400">{calcCurrency}</span>
                  <input
                    type="number"
                    value={calcCost}
                    onChange={(e) => setCalcCost(e.target.value)}
                    placeholder="e.g. 320"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Operating Expenses (OPEX)
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-xs font-medium text-slate-400">{calcCurrency}</span>
                  <input
                    type="number"
                    value={calcOpex}
                    onChange={(e) => setCalcOpex(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Tax Provision
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-xs font-medium text-slate-400">{calcCurrency}</span>
                  <input
                    type="number"
                    value={calcTax}
                    onChange={(e) => setCalcTax(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full pl-6 pr-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-500">Unit:</span>
                  <select
                    value={calcUnit}
                    onChange={(e) => setCalcUnit(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs"
                  >
                    <option value="Million">Million</option>
                    <option value="Billion">Billion</option>
                    <option value="Crore">Crore</option>
                    <option value="Thousand">Thousand</option>
                    <option value="">Standard (1x)</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-slate-500">Currency:</span>
                  <select
                    value={calcCurrency}
                    onChange={(e) => setCalcCurrency(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-xs"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="₹">₹ (INR)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfitCalc(false)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const unitPart = calcUnit ? ` ${calcUnit}` : '';
                    let queryStr = `Given Revenue = ${calcCurrency}${calcRevenue}${unitPart} and Cost = ${calcCurrency}${calcCost}${unitPart}`;
                    if (calcOpex && Number(calcOpex) > 0) {
                      queryStr += `, Operating Expenses = ${calcCurrency}${calcOpex}${unitPart}`;
                    }
                    if (calcTax && Number(calcTax) > 0) {
                      queryStr += `, Tax = ${calcCurrency}${calcTax}${unitPart}`;
                    }
                    queryStr += `, calculate Gross Profit, Operating Profit, Net Profit, and Profit Margins with step-by-step arithmetic.`;
                    setShowProfitCalc(false);
                    handleSend(queryStr);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Execute Profit Calculation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          <input
            id="chat-input-field"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Apple, Walmart, JPMorgan, NVIDIA, Netflix, or calculate profit from given numbers..."
            disabled={isProcessing}
            className="w-full pl-5 pr-14 py-4 text-sm bg-transparent text-slate-800 placeholder-slate-400 focus:outline-hidden"
          />
          <button
            id="chat-send-button"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isProcessing}
            className="absolute right-2.5 p-2.5 rounded-xl bg-[#17233C] hover:bg-[#233458] disabled:opacity-30 disabled:hover:bg-[#17233C] text-white transition-all shadow-xs"
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-end text-[11px] text-slate-400 px-3 pt-1">
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};

