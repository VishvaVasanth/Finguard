import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Clock, Ban, ArrowUpRight, Search } from 'lucide-react';
import { GovernanceMode, RiskTier, RequestStatus } from '../../types.ts';

export const RiskTierBadge: React.FC<{ tier: RiskTier; size?: 'sm' | 'md' }> = ({
  tier,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (tier) {
    case 'LOW':
      return (
        <span
          id={`badge-risk-${tier.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          LOW RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          id={`badge-risk-${tier.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          MEDIUM RISK
        </span>
      );
    case 'HIGH':
      return (
        <span
          id={`badge-risk-${tier.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 ${sizeClasses}`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
          HIGH RISK
        </span>
      );
    case 'CRITICAL':
      return (
        <span
          id={`badge-risk-${tier.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 ${sizeClasses}`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-500" />
          CRITICAL RISK
        </span>
      );
  }
};

export const GovernanceBadge: React.FC<{ mode: GovernanceMode; size?: 'sm' | 'md' }> = ({
  mode,
  size = 'md',
}) => {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (mode) {
    case 'AUTO':
      return (
        <span
          id={`badge-gov-${mode.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-[#ADEEE2]/30 text-teal-800 border border-[#ADEEE2] ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          AUTO CLEAR
        </span>
      );
    case 'VERIFY':
      return (
        <span
          id={`badge-gov-${mode.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-[#A2DCEE]/30 text-sky-800 border border-[#A2DCEE] ${sizeClasses}`}
        >
          <Search className="w-3.5 h-3.5 text-sky-600" />
          VERIFY NEEDED
        </span>
      );
    case 'APPROVE':
      return (
        <span
          id={`badge-gov-${mode.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-[#A2B9EE]/35 text-[#17233C] border border-[#A2B9EE] ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          APPROVE (L3)
        </span>
      );
    case 'ESCALATE':
      return (
        <span
          id={`badge-gov-${mode.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-[#9A9CEA]/30 text-indigo-900 border border-[#9A9CEA] ${sizeClasses}`}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-indigo-700" />
          ESCALATE
        </span>
      );
    case 'BLOCK':
      return (
        <span
          id={`badge-gov-${mode.toLowerCase()}`}
          className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-600" />
          GOV BLOCK
        </span>
      );
  }
};

export const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Completed
        </span>
      );
    case 'WAITING_FOR_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
          Waiting for Review
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
          <ShieldCheck className="w-3 h-3 text-teal-600" />
          Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <Ban className="w-3 h-3 text-rose-500" />
          Rejected
        </span>
      );
    case 'BLOCKED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
          <Ban className="w-3 h-3 text-slate-500" />
          Blocked
        </span>
      );
    case 'ESCALATED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
          <ArrowUpRight className="w-3 h-3 text-indigo-500" />
          Escalated
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          {status}
        </span>
      );
  }
};
