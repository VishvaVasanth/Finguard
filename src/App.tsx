import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { UserChat } from './components/user/UserChat.tsx';
import { UserRequests } from './components/user/UserRequests.tsx';
import { UserFinanceOverview } from './components/user/UserFinanceOverview.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminReviewWorkspace } from './components/admin/AdminReviewWorkspace.tsx';
import { AdminTasks } from './components/admin/AdminTasks.tsx';
import { AdminPolicyStudio } from './components/admin/AdminPolicyStudio.tsx';
import { AdminCalibration } from './components/admin/AdminCalibration.tsx';
import { AdminExperiments } from './components/admin/AdminExperiments.tsx';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.tsx';
import { AdminReproducibility } from './components/admin/AdminReproducibility.tsx';
import { AdminDatasets } from './components/admin/AdminDatasets.tsx';
import { AdminToolRegistry } from './components/admin/AdminToolRegistry.tsx';
import { AdminModelTraining } from './components/admin/AdminModelTraining.tsx';
import { NotificationsModal } from './components/NotificationsModal.tsx';
import {
  FinancialAccount,
  FinancialTask,
  FinancialTransaction,
  GovernancePolicy,
  NotificationItem,
  RequestRecord,
  User,
} from './types.ts';
import {
  MessageSquare,
  ClipboardList,
  Wallet,
  LayoutDashboard,
  Clock,
  Database,
  Sliders,
  Play,
  Layers,
  FileCode,
  Wrench,
  BookOpen,
  BrainCircuit,
} from 'lucide-react';

export default function App() {
  // Navigation & User State
  const [currentPortal, setCurrentPortal] = useState<'USER' | 'ADMIN'>('USER');
  const [userSubTab, setUserSubTab] = useState<'chat' | 'requests' | 'finance'>('chat');
  const [adminSubTab, setAdminSubTab] = useState<
    | 'dashboard'
    | 'reviews'
    | 'tasks'
    | 'policies'
    | 'training'
    | 'calibration'
    | 'experiments'
    | 'audit'
    | 'tools'
    | 'datasets'
    | 'reproducibility'
  >('dashboard');

  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-101',
    name: 'Vishvavasanth',
    email: 'demo.user@example.com',
    role: 'USER',
    department: 'Corporate Financial Analyst',
  });

  // Data Collections
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [pendingReviews, setPendingReviews] = useState<RequestRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [tasks, setTasks] = useState<FinancialTask[]>([]);
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Interaction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [
        meRes,
        userReqsRes,
        notifsRes,
        accRes,
        txRes,
        dashRes,
        reviewsRes,
        tasksRes,
        polRes,
      ] = await Promise.all([
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/user/requests').then((r) => r.json()),
        fetch('/api/user/notifications').then((r) => r.json()),
        fetch('/api/user/account').then((r) => r.json()),
        fetch('/api/user/transactions').then((r) => r.json()),
        fetch('/api/admin/dashboard').then((r) => r.json()),
        fetch('/api/admin/reviews').then((r) => r.json()),
        fetch('/api/admin/tasks').then((r) => r.json()),
        fetch('/api/admin/policies').then((r) => r.json()),
      ]);

      if (meRes.user) setCurrentUser(meRes.user);
      if (userReqsRes.requests) setRequests(userReqsRes.requests);
      if (notifsRes.notifications) setNotifications(notifsRes.notifications);
      if (accRes.accounts) setAccounts(accRes.accounts);
      if (txRes.transactions) setTransactions(txRes.transactions);
      if (dashRes) setStats(dashRes);
      if (reviewsRes.reviews) setPendingReviews(reviewsRes.reviews);
      if (tasksRes.tasks) setTasks(tasksRes.tasks);
      if (polRes.policies) setPolicies(polRes.policies);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time SSE Events listener
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.addEventListener('REVIEW_ENQUEUED', (e: any) => {
      try {
        const data = JSON.parse(e.data);
        fetchData();
      } catch (err) {
        console.error('SSE Error:', err);
      }
    });

    eventSource.addEventListener('REVIEW_DECIDED', () => {
      fetchData();
    });

    eventSource.addEventListener('REVIEW_MESSAGE', () => {
      fetchData();
    });

    eventSource.addEventListener('USER_NOTIFICATION', () => {
      fetchData();
    });

    return () => {
      eventSource.close();
    };
  }, [fetchData]);

  // Handle User Query Submission
  const handleSubmitQuery = async (query: string) => {
    setIsProcessing(true);
    setProcessingStep('Understanding your request...');

    const stepTimer1 = setTimeout(() => {
      setProcessingStep('Checking relevant information...');
    }, 450);

    const stepTimer2 = setTimeout(() => {
      setProcessingStep('Verifying the available records...');
    }, 950);

    const stepTimer3 = setTimeout(() => {
      setProcessingStep('Preparing your response...');
    }, 1450);

    try {
      const res = await fetch('/api/user/agent/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const newRecord = await res.json();
      if (newRecord && !newRecord.user_query) {
        newRecord.user_query = newRecord.request_text || query;
      }

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setRequests((prev) => [newRecord, ...prev]);
      await fetchData();
    } catch (err) {
      console.error('Failed to submit request:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // Handle Reviewer Decision (Approve / Reject / Escalate)
  const handleReviewDecision = async (
    requestId: string,
    decision: 'APPROVE' | 'REJECT' | 'ESCALATE',
    notes?: string
  ) => {
    try {
      await fetch(`/api/admin/reviews/${requestId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to register decision:', err);
    }
  };

  // Handle Reviewer Message (User-Visible or Private Admin Note)
  const handleSendReviewerMessage = async (
    requestId: string,
    message: string,
    visibility: 'USER_VISIBLE' | 'PRIVATE'
  ) => {
    try {
      await fetch(`/api/admin/reviews/${requestId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, visibility }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to post review message:', err);
    }
  };

  // Handle User Response to Reviewer Question
  const handleUserReply = async (requestId: string, message: string) => {
    try {
      await fetch(`/api/user/requests/${requestId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to post user reply:', err);
    }
  };

  // Handle Switching User / Role
  const handleUserChange = async (newUser: User) => {
    setCurrentUser(newUser);
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUser.email, role: newUser.role }),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to switch user:', err);
    }
  };

  // Update Policy
  const handleUpdatePolicy = async (policyId: string, updates: Partial<GovernancePolicy>) => {
    try {
      await fetch(`/api/admin/policies/${policyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to update policy:', err);
    }
  };

  // Run Calibration Sweep
  const handleRunCalibration = async () => {
    const res = await fetch('/api/admin/calibration/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  };

  // Run Experiment
  const handleRunExperiment = async (params: any) => {
    const res = await fetch('/api/admin/experiments/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    await fetchData();
    return res.json();
  };

  // Run Ablations
  const handleRunAblations = async () => {
    const res = await fetch('/api/admin/ablations/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  };

  // Mark notification read
  const handleMarkNotificationRead = async (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
    await fetch(`/api/user/notifications/${notifId}/read`, { method: 'PATCH' });
  };

  return (
    <div id="finguard-app-root" className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#9A9CEA]/30">
      {/* Top Navbar */}
      <Navbar
        currentPortal={currentPortal}
        onPortalChange={setCurrentPortal}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        notifications={notifications}
        onNotificationClick={(notif) => {
          setIsNotificationsOpen(true);
        }}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Portal Content Area */}
      {currentPortal === 'USER' ? (
        /* ============================================================ */
        /* USER PORTAL */
        /* ============================================================ */
        <div className="flex-1 flex flex-col">
          {/* Sub Navigation Tabs for User */}
          <div className="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-2">
            <div className="max-w-5xl mx-auto flex items-center gap-1 sm:gap-2">
              <button
                id="user-tab-chat"
                onClick={() => setUserSubTab('chat')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  userSubTab === 'chat'
                    ? 'bg-[#9A9CEA]/15 text-[#17233C]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#9A9CEA]" />
                Financial Assistant
              </button>

              <button
                id="user-tab-finance"
                onClick={() => setUserSubTab('finance')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  userSubTab === 'finance'
                    ? 'bg-[#9A9CEA]/15 text-[#17233C]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-teal-600" />
                Budget & Spending Analytics
              </button>

              <button
                id="user-tab-requests"
                onClick={() => setUserSubTab('requests')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  userSubTab === 'requests'
                    ? 'bg-[#9A9CEA]/15 text-[#17233C]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5 text-sky-600" />
                My Requests ({requests.length})
              </button>
            </div>
          </div>

          {/* Sub View Rendering */}
          <main className="flex-1">
            {userSubTab === 'chat' && (
              <UserChat
                currentUser={currentUser}
                requests={requests}
                onSubmitQuery={handleSubmitQuery}
                onSendReviewerReply={handleUserReply}
                isProcessing={isProcessing}
                processingStep={processingStep}
              />
            )}

            {userSubTab === 'finance' && (
              <UserFinanceOverview accounts={accounts} transactions={transactions} />
            )}

            {userSubTab === 'requests' && (
              <UserRequests
                currentUser={currentUser}
                requests={requests}
                onSelectRequest={() => {}}
                onSendReviewerReply={handleUserReply}
              />
            )}
          </main>
        </div>
      ) : (
        /* ============================================================ */
        /* ADMIN / GOVERNANCE CONSOLE */
        /* ============================================================ */
        <div className="flex-1 flex flex-col">
          {/* Admin Navigation Sub-Tabs */}
          <div className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-2 overflow-x-auto">
            <div className="max-w-7xl mx-auto flex items-center gap-1.5">
              <button
                id="admin-tab-dashboard"
                onClick={() => setAdminSubTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'dashboard'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Telemetry Dashboard
              </button>

              <button
                id="admin-tab-reviews"
                onClick={() => setAdminSubTab('reviews')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'reviews'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Review Queue ({pendingReviews.length})
              </button>

              <button
                id="admin-tab-tasks"
                onClick={() => setAdminSubTab('tasks')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'tasks'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Task Suite ({tasks.length})
              </button>

              <button
                id="admin-tab-policies"
                onClick={() => setAdminSubTab('policies')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'policies'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Policy Studio
              </button>

              <button
                id="admin-tab-training"
                onClick={() => setAdminSubTab('training')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'training'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BrainCircuit className="w-3.5 h-3.5 text-rose-400" />
                Model Training (TAT-QA & FinanceBench)
              </button>

              <button
                id="admin-tab-calibration"
                onClick={() => setAdminSubTab('calibration')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'calibration'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Play className="w-3.5 h-3.5 text-indigo-400" />
                Calibration Lab
              </button>

              <button
                id="admin-tab-experiments"
                onClick={() => setAdminSubTab('experiments')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'experiments'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                Experiments & Ablations
              </button>

              <button
                id="admin-tab-datasets"
                onClick={() => setAdminSubTab('datasets')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'datasets'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Evidence Corpus
              </button>

              <button
                id="admin-tab-tools"
                onClick={() => setAdminSubTab('tools')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'tools'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Tool Registry
              </button>

              <button
                id="admin-tab-audit"
                onClick={() => setAdminSubTab('audit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'audit'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Audit Logs
              </button>

              <button
                id="admin-tab-reproducibility"
                onClick={() => setAdminSubTab('reproducibility')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  adminSubTab === 'reproducibility'
                    ? 'bg-[#17233C] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Reproducibility Center
              </button>
            </div>
          </div>

          {/* Admin Main Content View */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
            {adminSubTab === 'dashboard' && (
              <AdminDashboard
                stats={stats}
                onNavigateToReviews={() => setAdminSubTab('reviews')}
                onNavigateToCalibration={() => setAdminSubTab('calibration')}
              />
            )}

            {adminSubTab === 'reviews' && (
              <AdminReviewWorkspace
                currentUser={currentUser}
                pendingReviews={pendingReviews}
                allRequests={requests}
                onDecision={handleReviewDecision}
                onSendMessage={handleSendReviewerMessage}
              />
            )}

            {adminSubTab === 'tasks' && <AdminTasks tasks={tasks} />}

            {adminSubTab === 'policies' && (
              <AdminPolicyStudio policies={policies} onUpdatePolicy={handleUpdatePolicy} />
            )}

            {adminSubTab === 'training' && <AdminModelTraining />}

            {adminSubTab === 'calibration' && (
              <AdminCalibration onRunCalibration={handleRunCalibration} />
            )}

            {adminSubTab === 'experiments' && (
              <AdminExperiments
                experiments={stats ? [stats.experiments || []].flat() : []}
                onRunExperiment={handleRunExperiment}
                onRunAblations={handleRunAblations}
              />
            )}

            {adminSubTab === 'datasets' && <AdminDatasets />}

            {adminSubTab === 'tools' && <AdminToolRegistry />}

            {adminSubTab === 'audit' && (
              <AdminAuditLogs auditEvents={stats?.audit_events || []} />
            )}

            {adminSubTab === 'reproducibility' && <AdminReproducibility />}
          </main>
        </div>
      )}

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotificationRead}
      />
    </div>
  );
}
