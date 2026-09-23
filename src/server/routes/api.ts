import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { researchEngine } from '../evaluation/research.ts';
import { pipelineOrchestrator } from '../pipeline/orchestrator.ts';
import { toolRegistry } from '../tools/registry.ts';
import { ReviewMessage, User } from '../types.ts';

import { modelTrainingManager } from '../training/trainer.ts';
import {
  COMPANY_FINANCIAL_DATABASE,
  detectCompanyFromQuery,
  getCompanyMultiYearTable,
  calculateCompanyFinancialMetric,
  compareCompanies,
  calculateProfitFromValues,
  parseCustomProfitQuery,
  getInteractiveProfitDemo,
  AUDITED_FINANCIAL_YEARS,
  calculateFinancialMetric,
  getMultiYearTable,
} from '../training/financialData.ts';

export const apiRouter = Router();

// Store active SSE connections
const sseClients: { id: string; role: string; userId: string; res: any }[] = [];

export function broadcastEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  }
}

// Current session helper (demo support with default user Vishvavasanth)
let currentSessionUser: User = dbStore.users[0];

// ==========================================
// AUTHENTICATION
// ==========================================
apiRouter.post('/auth/login', (req, res) => {
  const { email, role } = req.body;
  let user: User | undefined;

  if (email) {
    user = dbStore.findUserByEmail(email);
  } else if (role) {
    user = dbStore.users.find((u) => u.role === role);
  }

  if (!user) {
    user = dbStore.users[0]; // fallback
  }

  currentSessionUser = user;
  res.json({ success: true, user });
});

apiRouter.get('/auth/me', (req, res) => {
  res.json({ user: currentSessionUser });
});

apiRouter.post('/auth/logout', (req, res) => {
  currentSessionUser = dbStore.users[0];
  res.json({ success: true });
});

// ==========================================
// REAL-TIME SSE STREAM
// ==========================================
apiRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = `client-${Date.now()}-${Math.random()}`;
  const clientRecord = {
    id: clientId,
    role: currentSessionUser.role,
    userId: currentSessionUser.id,
    res,
  };
  sseClients.push(clientRecord);

  // Send initial ping
  res.write(`event: connected\ndata: {"status":"connected","userId":"${currentSessionUser.id}"}\n\n`);

  req.on('close', () => {
    const index = sseClients.findIndex((c) => c.id === clientId);
    if (index !== -1) sseClients.splice(index, 1);
  });
});

// ==========================================
// USER PORTAL ENDPOINTS
// ==========================================

// Submit financial AI request
apiRouter.post('/user/agent/request', async (req, res) => {
  const { query, conversation_id } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string is required' });
  }

  try {
    const requestRecord = await pipelineOrchestrator.execute(
      query,
      currentSessionUser,
      conversation_id || 'conv-default'
    );

    // Broadcast live event to Admin Review Queue if waiting for review
    if (requestRecord.status === 'WAITING_FOR_REVIEW') {
      broadcastEvent('REVIEW_ENQUEUED', {
        request_id: requestRecord.request_id,
        user_name: requestRecord.user_name,
        request_text: requestRecord.request_text,
        tier: requestRecord.risk_assessment.tier,
      });
    }

    res.json(requestRecord);
  } catch (err: any) {
    console.error('Pipeline error:', err);
    res.status(500).json({ error: 'We could not process your request right now.' });
  }
});

// Get user requests (filtered strictly to authorized user)
apiRouter.get('/user/requests', (req, res) => {
  // User only sees their own requests
  const userRequests = dbStore.requests.filter((r) => r.user_id === currentSessionUser.id);
  res.json({ requests: userRequests });
});

// Get specific request details
apiRouter.get('/user/requests/:id', (req, res) => {
  const request = dbStore.requests.find((r) => r.request_id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  // Security: prevent other users from viewing unless admin
  if (request.user_id !== currentSessionUser.id && currentSessionUser.role === 'USER') {
    return res.status(403).json({ error: 'Unauthorized access to request record.' });
  }

  // Strip private admin notes from user visibility
  const sanitized = JSON.parse(JSON.stringify(request));
  if (sanitized.review_task?.messages) {
    sanitized.review_task.messages = sanitized.review_task.messages.filter(
      (m: ReviewMessage) => m.visibility === 'USER_VISIBLE'
    );
  }

  res.json({ request: sanitized });
});

// User responds to reviewer question
apiRouter.post('/user/requests/:id/message', (req, res) => {
  const { message } = req.body;
  const request = dbStore.requests.find((r) => r.request_id === req.params.id);

  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  if (!request.review_task) {
    return res.status(400).json({ error: 'Request does not have an active review task' });
  }

  const userMsg: ReviewMessage = {
    id: `msg-${Date.now()}`,
    sender_id: currentSessionUser.id,
    sender_name: currentSessionUser.name,
    sender_role: currentSessionUser.role,
    message,
    visibility: 'USER_VISIBLE',
    created_at: new Date().toISOString(),
  };

  request.review_task.messages.push(userMsg);
  request.updated_at = new Date().toISOString();

  // Audit event
  dbStore.addAuditEvent({
    id: `aud-${Date.now()}`,
    request_id: request.request_id,
    trace_id: request.trace_id,
    timestamp: new Date().toISOString(),
    node_name: 'UserReviewMessaging',
    action: 'USER_PROVIDED_INFORMATION',
    summary: `User ${currentSessionUser.name} responded to reviewer request.`,
  });

  // Broadcast to Admin review workspace
  broadcastEvent('REVIEW_MESSAGE', {
    request_id: request.request_id,
    message: userMsg,
  });

  res.json({ success: true, message: userMsg });
});

// Notifications
apiRouter.get('/user/notifications', (req, res) => {
  const notifs = dbStore.notifications.filter((n) => n.user_id === currentSessionUser.id);
  res.json({ notifications: notifs });
});

apiRouter.patch('/user/notifications/:id/read', (req, res) => {
  const notif = dbStore.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

// User Accounts & Budgets
apiRouter.get('/user/account', (req, res) => {
  const accounts = dbStore.accounts.filter((a) => a.user_id === currentSessionUser.id);
  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalBudget = accounts.reduce((acc, a) => acc + a.monthly_budget, 0);
  const totalSpent = accounts.reduce((acc, a) => acc + a.monthly_spent, 0);

  res.json({
    user: currentSessionUser,
    accounts,
    summary: {
      total_balance: totalBalance,
      total_monthly_budget: totalBudget,
      total_monthly_spent: totalSpent,
      budget_utilization_pct: Math.round((totalSpent / (totalBudget || 1)) * 100),
      currency: 'INR (₹)',
    },
  });
});

apiRouter.get('/user/transactions', (req, res) => {
  const userAccountIds = dbStore.accounts
    .filter((a) => a.user_id === currentSessionUser.id)
    .map((a) => a.id);
  const txs = dbStore.transactions.filter((t) => userAccountIds.includes(t.account_id));
  res.json({ transactions: txs });
});

// ==========================================
// ADMIN & GOVERNANCE ENDPOINTS
// ==========================================

// Dashboard KPIs & Analytics
apiRouter.get('/admin/dashboard', (req, res) => {
  const totalRequests = dbStore.requests.length;
  const pendingReviews = dbStore.requests.filter((r) => r.status === 'WAITING_FOR_REVIEW').length;
  const completed = dbStore.requests.filter((r) => r.status === 'COMPLETED' || r.status === 'APPROVED').length;
  const blocked = dbStore.requests.filter((r) => r.status === 'BLOCKED').length;
  const escalated = dbStore.requests.filter((r) => r.status === 'ESCALATED').length;

  // Breakdown by governance mode
  const governanceDistribution = {
    AUTO: dbStore.requests.filter((r) => r.governance_mode === 'AUTO').length,
    VERIFY: dbStore.requests.filter((r) => r.governance_mode === 'VERIFY').length,
    APPROVE: dbStore.requests.filter((r) => r.governance_mode === 'APPROVE').length,
    ESCALATE: dbStore.requests.filter((r) => r.governance_mode === 'ESCALATE').length,
    BLOCK: dbStore.requests.filter((r) => r.governance_mode === 'BLOCK').length,
  };

  // Breakdown by risk tier
  const riskDistribution = {
    LOW: dbStore.requests.filter((r) => r.risk_assessment?.tier === 'LOW').length,
    MEDIUM: dbStore.requests.filter((r) => r.risk_assessment?.tier === 'MEDIUM').length,
    HIGH: dbStore.requests.filter((r) => r.risk_assessment?.tier === 'HIGH').length,
    CRITICAL: dbStore.requests.filter((r) => r.risk_assessment?.tier === 'CRITICAL').length,
  };

  // Human intervention rate = (pending + approved + rejected + escalated) / total
  const humanInterventions = dbStore.requests.filter(
    (r) => r.status === 'WAITING_FOR_REVIEW' || r.status === 'APPROVED' || r.status === 'REJECTED' || r.status === 'ESCALATED'
  ).length;

  const humanInterventionRate = totalRequests > 0 ? Number(((humanInterventions / totalRequests) * 100).toFixed(1)) : 0;

  res.json({
    kpis: {
      total_requests: totalRequests,
      pending_reviews: pendingReviews,
      completed,
      blocked,
      escalated,
      safety_incident_rate: 0.0,
      unsupported_claim_rate: 1.1,
      human_intervention_rate: humanInterventionRate,
      active_policy: dbStore.getActivePolicy().name,
      policy_version: dbStore.getActivePolicy().version,
    },
    governance_distribution: governanceDistribution,
    risk_distribution: riskDistribution,
  });
});

// Admin Requests Queue
apiRouter.get('/admin/requests', (req, res) => {
  const { status, tier, governance } = req.query;
  let list = dbStore.requests;

  if (status) list = list.filter((r) => r.status === status);
  if (tier) list = list.filter((r) => r.risk_assessment?.tier === tier);
  if (governance) list = list.filter((r) => r.governance_mode === governance);

  res.json({ requests: list });
});

// Admin Request Detail (3-Column Review Workspace)
apiRouter.get('/admin/requests/:id', (req, res) => {
  const request = dbStore.requests.find((r) => r.request_id === req.params.id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const user = dbStore.findUserById(request.user_id);
  res.json({ request, user_details: user });
});

// Admin Review Queue
apiRouter.get('/admin/reviews', (req, res) => {
  const pendingRequests = dbStore.requests.filter((r) => r.status === 'WAITING_FOR_REVIEW' && r.review_task);
  res.json({ reviews: pendingRequests });
});

// Admin Decision on Review Task (Approve / Reject / Escalate)
apiRouter.post('/admin/reviews/:id/decision', async (req, res) => {
  const { decision, notes } = req.body; // 'APPROVE' | 'REJECT' | 'ESCALATE'
  const request = dbStore.requests.find((r) => r.request_id === req.params.id);

  if (!request || !request.review_task) {
    return res.status(404).json({ error: 'Review task not found' });
  }

  const now = new Date().toISOString();
  request.review_task.decided_at = now;
  request.review_task.decided_by = currentSessionUser.name;
  request.review_task.decision_notes = notes;

  if (decision === 'APPROVE') {
    request.status = 'APPROVED';
    request.review_task.status = 'APPROVED';
    request.safe_response =
      '✓ An authorized reviewer has approved your request.\n\nYour contract action has been executed in the corporate compliance register.';

    // Execute the held tool (e.g. contract action)
    const heldTool = request.tool_calls.find((tc) => !tc.executed);
    if (heldTool) {
      const executed = await toolRegistry.executeTool(
        heldTool.tool_id,
        heldTool.arguments,
        {
          userId: request.user_id,
          userRole: request.user_role,
          riskTier: request.risk_assessment.tier,
          isApprovedByHuman: true,
        }
      );
      heldTool.executed = true;
      heldTool.result = executed.result;
      heldTool.blocked_reason = undefined;
    }

    // Add notification for user
    dbStore.addNotification({
      id: `notif-${Date.now()}`,
      user_id: request.user_id,
      request_id: request.request_id,
      type: 'APPROVED',
      title: 'Request Approved by Reviewer',
      message: `Your request "${request.request_text}" has been approved by ${currentSessionUser.name}.`,
      read: false,
      created_at: now,
    });
  } else if (decision === 'REJECT') {
    request.status = 'REJECTED';
    request.review_task.status = 'REJECTED';
    request.safe_response = `Your request was declined by the review committee.\n\nReason: ${notes || 'Did not meet compliance criteria.'}`;

    dbStore.addNotification({
      id: `notif-${Date.now()}`,
      user_id: request.user_id,
      request_id: request.request_id,
      type: 'REJECTED',
      title: 'Request Declined',
      message: notes || 'Your request was declined by the review committee.',
      read: false,
      created_at: now,
    });
  } else if (decision === 'ESCALATE') {
    request.status = 'ESCALATED';
    request.review_task.status = 'ESCALATED';
    request.safe_response =
      'This request has been escalated to General Counsel and Treasury Senior Domain Experts for further legal determination.';

    dbStore.addNotification({
      id: `notif-${Date.now()}`,
      user_id: request.user_id,
      request_id: request.request_id,
      type: 'ESCALATED',
      title: 'Request Escalated to Domain Expert',
      message: 'Your request has been forwarded to senior legal counsel for specialized review.',
      read: false,
      created_at: now,
    });
  }

  request.updated_at = now;

  // Log Audit
  dbStore.addAuditEvent({
    id: `aud-${Date.now()}`,
    request_id: request.request_id,
    trace_id: request.trace_id,
    timestamp: now,
    node_name: 'HumanReviewNode',
    action: `REVIEWER_${decision}`,
    summary: `Reviewer ${currentSessionUser.name} decided ${decision} for ${request.request_id}. Notes: ${notes || 'None'}`,
  });

  // Broadcast live SSE update
  broadcastEvent('REVIEW_DECIDED', {
    request_id: request.request_id,
    status: request.status,
    decision,
  });

  res.json({ success: true, request });
});

// Admin sends message to user or internal note
apiRouter.post('/admin/reviews/:id/message', (req, res) => {
  const { message, visibility } = req.body; // visibility: 'USER_VISIBLE' | 'PRIVATE'
  const request = dbStore.requests.find((r) => r.request_id === req.params.id);

  if (!request || !request.review_task) {
    return res.status(404).json({ error: 'Review task not found' });
  }

  const reviewMsg: ReviewMessage = {
    id: `msg-${Date.now()}`,
    sender_id: currentSessionUser.id,
    sender_name: currentSessionUser.name,
    sender_role: currentSessionUser.role,
    message,
    visibility: visibility || 'USER_VISIBLE',
    created_at: new Date().toISOString(),
  };

  request.review_task.messages.push(reviewMsg);
  request.updated_at = new Date().toISOString();

  // If user visible, notify the user
  if (visibility === 'USER_VISIBLE') {
    dbStore.addNotification({
      id: `notif-${Date.now()}`,
      user_id: request.user_id,
      request_id: request.request_id,
      type: 'MORE_INFORMATION_REQUIRED',
      title: 'Reviewer Question',
      message: `${currentSessionUser.name}: "${message}"`,
      read: false,
      created_at: new Date().toISOString(),
    });

    broadcastEvent('USER_NOTIFICATION', {
      user_id: request.user_id,
      request_id: request.request_id,
      message,
    });
  }

  res.json({ success: true, message: reviewMsg });
});

// Task Suite (100+ tasks)
apiRouter.get('/admin/tasks', (req, res) => {
  const { dataset, split } = req.query;
  let tasks = dbStore.tasks;
  if (dataset) tasks = tasks.filter((t) => t.dataset === dataset);
  if (split) tasks = tasks.filter((t) => t.split === split);

  res.json({ total: tasks.length, tasks });
});

apiRouter.post('/admin/tasks', (req, res) => {
  const task = req.body;
  task.task_id = `TASK-CUSTOM-${Date.now().toString(36).toUpperCase()}`;
  dbStore.tasks.unshift(task);
  res.json({ success: true, task });
});

// Datasets & Evidence Documents
apiRouter.get('/admin/datasets', (req, res) => {
  res.json({
    documents: dbStore.documents,
    summary: {
      total_documents: dbStore.documents.length,
      total_chunks: dbStore.documents.reduce((acc, d) => acc + d.chunks.length, 0),
      datasets: ['FinanceBench', 'TAT-QA', 'FinOps Operational Suite'],
    },
  });
});

// Policy Studio
apiRouter.get('/admin/policies', (req, res) => {
  res.json({ policies: dbStore.policies });
});

apiRouter.post('/admin/policies', (req, res) => {
  const newPolicy = req.body;
  newPolicy.id = `pol-${Date.now().toString(36)}`;
  newPolicy.created_at = new Date().toISOString();
  newPolicy.created_by = currentSessionUser.name;
  newPolicy.hash = `sha256-${Date.now().toString(16)}`;

  dbStore.policies.push(newPolicy);
  res.json({ success: true, policy: newPolicy });
});

apiRouter.patch('/admin/policies/:id', (req, res) => {
  const policy = dbStore.policies.find((p) => p.id === req.params.id);
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  const { is_active, weights, thresholds, evidence_coverage_threshold } = req.body;
  if (is_active) {
    dbStore.policies.forEach((p) => (p.is_active = false));
    policy.is_active = true;
  }
  if (weights) policy.weights = { ...policy.weights, ...weights };
  if (thresholds) policy.thresholds = { ...policy.thresholds, ...thresholds };
  if (evidence_coverage_threshold !== undefined) {
    policy.evidence_coverage_threshold = evidence_coverage_threshold;
  }

  policy.hash = `sha256-${Date.now().toString(16)}`;

  res.json({ success: true, policy });
});

// Tool Registry
apiRouter.get('/admin/tools', (req, res) => {
  res.json({ tools: dbStore.tools });
});

apiRouter.patch('/admin/tools/:id', (req, res) => {
  const tool = dbStore.tools.find((t) => t.tool_id === req.params.id);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }

  const { enabled, requires_approval, risk_level } = req.body;
  if (enabled !== undefined) tool.enabled = enabled;
  if (requires_approval !== undefined) tool.requires_approval = requires_approval;
  if (risk_level !== undefined) tool.risk_level = risk_level;

  res.json({ success: true, tool });
});

// Experiments Lab
apiRouter.get('/admin/experiments', (req, res) => {
  res.json({ experiments: dbStore.experiments });
});

apiRouter.post('/admin/experiments/run', (req, res) => {
  const { dataset = 'FinanceBench', split = 'DEVELOPMENT', policyId = 'pol-v2-prod', model = 'gemini-3.8-flash' } = req.body;
  const run = researchEngine.runExperiment({ dataset, split, policyId, model });
  res.json({ success: true, experiment: run });
});

// Calibration Lab (Sweep on Calibration Split)
apiRouter.post('/admin/calibration/run', (req, res) => {
  const calibrationResult = researchEngine.runCalibration();
  res.json({ success: true, calibration: calibrationResult });
});

// Ablations Lab
apiRouter.post('/admin/ablations/run', (req, res) => {
  const ablations = researchEngine.runAblations();
  res.json({ success: true, ablations });
});

// Audit Trace Logs
apiRouter.get('/admin/audit', (req, res) => {
  res.json({ audit_events: dbStore.auditEvents });
});

// Reproducibility Artifacts Export
apiRouter.get('/admin/reproducibility', (req, res) => {
  const activePolicy = dbStore.getActivePolicy();
  const config = {
    platform: 'FinGuard AI Governance Platform',
    version: '2.4.0',
    model: 'gemini-3.8-flash',
    rag_retriever: 'Hybrid BM25 + pgvector RRF',
    environment: 'production-isolated',
  };

  const tracesJsonl = dbStore.auditEvents.map((a) => JSON.stringify(a)).join('\n');

  res.json({
    config,
    active_policy: activePolicy,
    metrics: dbStore.experiments[0]?.metrics,
    experiment: dbStore.experiments[0],
    traces_sample: dbStore.auditEvents.slice(0, 15),
    traces_jsonl_content: tracesJsonl,
  });
});

// ==========================================
// TAT-QA & FINANCEBENCH MODEL TRAINING & BENCHMARKING
// ==========================================
apiRouter.get('/training/status', (req, res) => {
  const status = modelTrainingManager.getStatus();
  res.json({ success: true, ...status });
});

apiRouter.post('/training/train', async (req, res) => {
  const updated = await modelTrainingManager.runTrainingSimulation();
  res.json({ success: true, training: updated });
});

apiRouter.post('/training/switch-model', (req, res) => {
  const { model_id } = req.body;
  const updated = modelTrainingManager.switchModel(model_id);
  res.json({ success: true, status: updated });
});

apiRouter.get('/training/companies', (req, res) => {
  const list = Object.values(COMPANY_FINANCIAL_DATABASE).map((c) => ({
    id: c.id,
    name: c.name,
    ticker: c.ticker,
    sector: c.sector,
    currency: c.currency,
    unit: c.unit,
    description: c.description,
    years: Object.keys(c.years),
  }));
  res.json({ success: true, companies: list });
});

apiRouter.get('/training/audited-schedule', (req, res) => {
  const { type = 'ALL', company } = req.query;
  const targetComp = company ? detectCompanyFromQuery(String(company)) : COMPANY_FINANCIAL_DATABASE['AAPL'];
  const table = getCompanyMultiYearTable(targetComp.id, type as any);
  res.json({
    success: true,
    company: {
      id: targetComp.id,
      name: targetComp.name,
      ticker: targetComp.ticker,
      currency: targetComp.currency,
      unit: targetComp.unit,
      sector: targetComp.sector,
    },
    years: targetComp.years,
    table,
  });
});

apiRouter.post('/training/calculate', (req, res) => {
  const { metricType, year1, year2, companyId } = req.body;
  const compId = companyId || 'AAPL';
  const result = calculateCompanyFinancialMetric(compId, metricType, year1, year2);
  res.json({ success: true, result });
});

apiRouter.get('/training/compare', (req, res) => {
  const { comp1 = 'AAPL', comp2 = 'MSFT', year = '2024' } = req.query;
  const c1 = detectCompanyFromQuery(String(comp1));
  const c2 = detectCompanyFromQuery(String(comp2));
  const table = compareCompanies(c1.id, c2.id, String(year));
  res.json({ success: true, comp1: c1, comp2: c2, year, table });
});

apiRouter.get('/training/companies', (req, res) => {
  const list = Object.values(COMPANY_FINANCIAL_DATABASE).map((c) => ({
    id: c.id,
    name: c.name,
    ticker: c.ticker,
    currency: c.currency,
    unit: c.unit,
    sector: c.sector,
    exchange: c.exchange,
    description: c.description,
    years: Object.keys(c.years),
  }));
  res.json({ success: true, count: list.length, companies: list });
});

apiRouter.post('/financial/calculate-profit', (req, res) => {
  const {
    query,
    revenue,
    cost,
    cogs,
    operatingExpenses,
    tax,
    taxRate,
    sellingPrice,
    costPrice,
    unitsSold,
    currency,
    unitLabel,
  } = req.body;

  if (query && typeof query === 'string') {
    const parsed = parseCustomProfitQuery(query);
    if (parsed) {
      return res.json({ success: true, result: parsed });
    }
  }

  const result = calculateProfitFromValues({
    revenue: revenue !== undefined ? Number(revenue) : undefined,
    cost: cost !== undefined ? Number(cost) : undefined,
    cogs: cogs !== undefined ? Number(cogs) : undefined,
    operatingExpenses: operatingExpenses !== undefined ? Number(operatingExpenses) : undefined,
    tax: tax !== undefined ? Number(tax) : undefined,
    taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
    sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : undefined,
    costPrice: costPrice !== undefined ? Number(costPrice) : undefined,
    unitsSold: unitsSold !== undefined ? Number(unitsSold) : undefined,
    currency: currency || '$',
    unitLabel: unitLabel || '',
  });

  res.json({ success: true, result });
});

apiRouter.get('/financial/profit-demo', (req, res) => {
  const demo = getInteractiveProfitDemo();
  res.json({ success: true, demo });
});



