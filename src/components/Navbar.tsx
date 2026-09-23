import React, { useState } from 'react';
import { Shield, Bell, User as UserIcon, Check, ChevronDown, Sparkles, FileDown } from 'lucide-react';
import { BrandSignature } from './BrandSignature.tsx';
import { NotificationItem, User, UserRole } from '../types.ts';
import { generateFinGuardWorkflowPDF } from '../utils/pdfGenerator.ts';

interface NavbarProps {
  currentPortal: 'USER' | 'ADMIN';
  onPortalChange: (portal: 'USER' | 'ADMIN') => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  notifications: NotificationItem[];
  onNotificationClick: (notif: NotificationItem) => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPortal,
  onPortalChange,
  currentUser,
  onUserChange,
  notifications,
  onOpenNotifications,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const demoUsers: { role: UserRole; name: string; email: string; title: string }[] = [
    {
      role: 'USER',
      name: 'Vishvavasanth',
      email: 'demo.user@example.com',
      title: 'Corporate Financial Analyst',
    },
    {
      role: 'ADMIN',
      name: 'Thaheera',
      email: 'demo.admin@example.com',
      title: 'Chief Governance Officer',
    },
    {
      role: 'REVIEWER',
      name: 'Kumar',
      email: 'demo.reviewer@example.com',
      title: 'Senior Risk Reviewer',
    },
    {
      role: 'DOMAIN_EXPERT',
      name: 'Ramesh',
      email: 'demo.expert@example.com',
      title: 'Treasury & Legal Counsel',
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSelectRole = (u: (typeof demoUsers)[0]) => {
    onUserChange({
      id: u.role === 'USER' ? 'usr-101' : u.role === 'ADMIN' ? 'usr-201' : u.role === 'REVIEWER' ? 'usr-301' : 'usr-401',
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.title,
    });
    setRoleDropdownOpen(false);

    // Auto switch to appropriate portal
    if (u.role === 'USER') {
      onPortalChange('USER');
    } else {
      onPortalChange('ADMIN');
    }
  };

  return (
    <header
      id="finguard-navbar"
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <BrandSignature size="sm" />
            <span className="text-xl font-extrabold tracking-tight text-[#17233C]">
              FIN<span className="text-[#9A9CEA]">GUARD</span>
            </span>
          </div>
        </div>

        {/* Portal Switcher Navigation */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-2xs">
          <button
            id="portal-switch-user"
            onClick={() => onPortalChange('USER')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentPortal === 'USER'
                ? 'bg-white text-[#17233C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            User Assistant
          </button>
          <button
            id="portal-switch-admin"
            onClick={() => onPortalChange('ADMIN')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentPortal === 'ADMIN'
                ? 'bg-white text-[#17233C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#9A9CEA]" />
            Governance Console
          </button>
        </div>

        {/* Right Actions: PDF Export, Notifications & Role Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Download Workflow PDF Button */}
          <button
            id="btn-download-workflow-pdf"
            onClick={() => generateFinGuardWorkflowPDF()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#9A9CEA]/30 bg-[#9A9CEA]/10 hover:bg-[#9A9CEA]/20 text-[#17233C] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Download Complete Architecture & Workflow Whitepaper (PDF)"
          >
            <FileDown className="w-4 h-4 text-[#9A9CEA]" />
            <span className="hidden md:inline">Workflow PDF</span>
          </button>

          {/* Notifications Bell */}
          <button
            id="btn-notifications"
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              id="btn-role-switcher"
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#9A9CEA] to-[#A2DCEE] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-[#17233C] leading-none flex items-center gap-1">
                  {currentUser.name}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono text-slate-600">
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                  {currentUser.department || currentUser.email}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div
                id="role-dropdown-menu"
                className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="space-y-1">
                  {demoUsers.map((u) => {
                    const isCurrent = currentUser.role === u.role;
                    return (
                      <button
                        key={u.role}
                        onClick={() => handleSelectRole(u)}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-all ${
                          isCurrent ? 'bg-[#9A9CEA]/10 border border-[#9A9CEA]/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="w-7 h-7 mt-0.5 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-[#17233C]">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{u.name}</span>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {u.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{u.title}</div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-[#9A9CEA] shrink-0 mt-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
