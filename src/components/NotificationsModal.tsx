import React from 'react';
import { NotificationItem } from '../types.ts';
import { Bell, Check, X, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="notifications-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#9A9CEA]" />
            <h3 className="text-sm font-bold text-[#17233C]">Notifications & Alerts</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">No new notifications.</div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkAsRead(n.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? 'bg-slate-50/70 border-slate-200/70 text-slate-600'
                    : 'bg-[#9A9CEA]/10 border-[#9A9CEA]/40 text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    {n.type === 'BLOCKED' ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    ) : n.type === 'APPROVED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    {n.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate-700">{n.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
