import { dbStore } from '../db/store.ts';
import { evidenceManager } from '../evidence/manager.ts';
import { governanceEngine } from '../governance/engine.ts';
import { llmProvider } from '../llm/provider.ts';
import { hybridRAG } from '../rag/hybrid.ts';
import { riskEngine } from '../risk/engine.ts';
import { toolRegistry } from '../tools/registry.ts';
import {
  AuditEvent,
  GovernanceMode,
  NotificationItem,
  RequestRecord,
  RequestStatus,
  ReviewTask,
  User,
} from '../types.ts';

export interface PipelineProgressCallback {
  (step: { node: string; status: string; description: string }): void;
}

export class PipelineOrchestrator {
  public async execute(
    query: string,
    user: User,
    conversationId: string = 'conv-default',
    onProgress?: PipelineProgressCallback
  ): Promise<RequestRecord> {
    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const traceId = `trc-${Date.now().toString(36)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    // 1. Intake Node
    onProgress?.({
      node: 'IntakeNode',
      status: 'PROCESSING',
      description: 'Understanding your request...',
    });

    const activePolicy = dbStore.getActivePolicy();
    const queryLower = query.toLowerCase();

    // 2. Hybrid RAG Retrieval
    onProgress?.({
      node: 'HybridRAGNode',
      status: 'PROCESSING',
      description: 'Checking relevant information...',
    });

    const ragResult = hybridRAG.search(query, user.role);

    // 3. Evidence Manager Evaluation
    onProgress?.({
      node: 'EvidenceManagerNode',
      status: 'PROCESSING',
      description: 'Verifying the available records...',
    });

    const evidenceEval = evidenceManager.evaluate(query, ragResult.items, ragResult.has_conflicts);

    // 4. Intent & Tool Requirement Analysis
    let targetToolId: string | undefined;
    let isIrreversible = false;
    let toolRisk = 0;
    let financialAmount: number | undefined;

    if (queryLower.includes('transfer') || queryLower.includes('wire')) {
      targetToolId = 'tool-wire-transfer';
      isIrreversible = true;
      toolRisk = 5;
      financialAmount = 50000;
    } else if (queryLower.includes('approve') && (queryLower.includes('contract') || queryLower.includes('coffee house'))) {
      targetToolId = 'tool-contract-action';
      isIrreversible = true;
      toolRisk = 4;
      financialAmount = 185000;
    } else if (queryLower.includes('growth') || queryLower.includes('calculate')) {
      targetToolId = 'tool-calc';
      toolRisk = 0;
    } else if (queryLower.includes('transaction') || queryLower.includes('spending')) {
      targetToolId = 'tool-tx-lookup';
      toolRisk = 2;
    } else if (queryLower.includes('balance') || queryLower.includes('account')) {
      targetToolId = 'tool-account-lookup';
      toolRisk = 2;
    } else {
      targetToolId = 'tool-doc-search';
      toolRisk = 1;
    }

    const toolDef = targetToolId ? toolRegistry.getTool(targetToolId) : undefined;

    // 5. Authorization Check (Server-Side)
    const isUnauthorizedAction = Boolean(
      toolDef && !toolDef.allowed_roles.includes(user.role) && (!toolDef.requires_approval || targetToolId === 'tool-wire-transfer')
    );

    // 6. Uncertainty Assessment
    let uncertainty: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (evidenceEval.has_conflicts || evidenceEval.is_missing_evidence) {
      uncertainty = 'HIGH';
    } else if (evidenceEval.coverage < activePolicy.evidence_coverage_threshold) {
      uncertainty = 'MEDIUM';
    }

    // 7. Risk Engine Assessment
    const riskAssessment = riskEngine.assess({
      intent: targetToolId || 'FINANCIAL_QA',
      requestText: query,
      hasFinancialAction: Boolean(financialAmount),
      financialAmount,
      irreversible: isIrreversible,
      requiredToolRisk: toolRisk,
      uncertainty,
      evidenceCoverage: evidenceEval.coverage,
      policy: activePolicy,
      isAdversarial: evidenceEval.contains_adversarial_injection,
      isUnauthorizedAction,
    });

    // 8. Governance Engine Decision
    const governanceDecision = governanceEngine.decide({
      riskAssessment,
      policy: activePolicy,
      evidenceCoverage: evidenceEval.coverage,
      hasConflicts: evidenceEval.has_conflicts,
      isMissingEvidence: evidenceEval.is_missing_evidence,
      containsPromptInjection: evidenceEval.contains_adversarial_injection,
      userRole: user.role,
      toolRequired: toolDef
        ? {
            tool_id: toolDef.tool_id,
            risk_level: toolDef.risk_level,
            allowed_roles: toolDef.allowed_roles,
            requires_approval: toolDef.requires_approval,
          }
        : undefined,
    });

    onProgress?.({
      node: 'GovernanceNode',
      status: 'PROCESSING',
      description: 'Preparing your response...',
    });

    // 9. LLM Reasoning & Safe Response Generation
    const llmResult = await llmProvider.analyzeAndRespond(
      query,
      ragResult.items,
      governanceDecision.mode,
      governanceDecision.reason
    );

    // 10. Tool Execution / Review Queue Routing
    const toolCalls = [];
    let status: RequestStatus = 'COMPLETED';
    let reviewTask: ReviewTask | undefined;

    if (governanceDecision.mode === 'BLOCK') {
      status = 'BLOCKED';
      if (targetToolId) {
        toolCalls.push({
          tool_id: targetToolId,
          tool_name: toolDef?.name || targetToolId,
          arguments: { query, amount: financialAmount },
          executed: false,
          blocked_reason: governanceDecision.reason,
          timestamp: new Date().toISOString(),
        });
      }

      // Add user notification for blocked action
      dbStore.addNotification({
        id: `notif-${Date.now()}`,
        user_id: user.id,
        request_id: requestId,
        type: 'BLOCKED',
        title: 'Action Blocked by Governance',
        message: 'A requested operation was safely halted due to authorization or policy constraints.',
        read: false,
        created_at: new Date().toISOString(),
      });
    } else if (governanceDecision.mode === 'APPROVE') {
      status = 'WAITING_FOR_REVIEW';
      // Create Review Task for Admin Review Queue
      const reviewTaskId = `REV-${requestId.replace('REQ-', '')}`;
      reviewTask = {
        id: reviewTaskId,
        request_id: requestId,
        assigned_role: governanceDecision.assigned_role || 'REVIEWER',
        status: 'PENDING',
        messages: [],
        created_at: new Date().toISOString(),
      };

      if (targetToolId) {
        toolCalls.push({
          tool_id: targetToolId,
          tool_name: toolDef?.name || targetToolId,
          arguments: { query, action: 'APPROVE', amount: financialAmount },
          executed: false,
          blocked_reason: 'PENDING_HUMAN_APPROVAL: Awaiting review signoff',
          timestamp: new Date().toISOString(),
        });
      }

      // Notify User
      dbStore.addNotification({
        id: `notif-${Date.now()}`,
        user_id: user.id,
        request_id: requestId,
        type: 'WAITING_FOR_REVIEW',
        title: 'Request Enqueued for Review',
        message: 'Your high-impact request has been routed to an authorized reviewer for signoff.',
        read: false,
        created_at: new Date().toISOString(),
      });
    } else if (governanceDecision.mode === 'AUTO') {
      status = 'COMPLETED';
      // Execute safe tool (e.g. calculator or lookup)
      if (targetToolId && (targetToolId === 'tool-calc' || targetToolId === 'tool-doc-search' || targetToolId === 'tool-tx-lookup' || targetToolId === 'tool-account-lookup')) {
        const executed = await toolRegistry.executeTool(
          targetToolId,
          {
            formula: llmResult.calculation_details || '((84.2 - 74.8) / 74.8) * 100',
            query,
          },
          {
            userId: user.id,
            userRole: user.role,
            riskTier: riskAssessment.tier,
          }
        );
        toolCalls.push(executed);
      }
    } else if (governanceDecision.mode === 'VERIFY') {
      status = 'COMPLETED';
    }

    // Assemble Canonical Request Record
    const record: RequestRecord = {
      request_id: requestId,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      conversation_id: conversationId,
      request_text: query,
      status,
      created_at: now,
      updated_at: new Date().toISOString(),
      intent: llmResult.intent,
      task_type: llmResult.task_type,
      governance_mode: governanceDecision.mode,
      risk_assessment: riskAssessment,
      evidence_items: ragResult.items,
      evidence_coverage: evidenceEval.coverage,
      uncertainty_level: uncertainty,
      safe_response: llmResult.safe_response,
      calculation_details: llmResult.calculation_details,
      yearly_data_table: llmResult.yearly_data_table,
      model_used: llmResult.model_used,
      tool_calls: toolCalls,
      review_task: reviewTask,
      trace_id: traceId,
      prompt_injection_detected: evidenceEval.contains_adversarial_injection,
    };

    // Store in database
    dbStore.addRequest(record);

    // Record Audit Event
    const auditEvent: AuditEvent = {
      id: `aud-${Date.now()}`,
      request_id: requestId,
      trace_id: traceId,
      timestamp: new Date().toISOString(),
      node_name: 'PipelineOrchestrator',
      action: `ROUTED_${governanceDecision.mode}`,
      summary: `Request from ${user.name} routed to ${governanceDecision.mode} (Score: ${riskAssessment.score}, Tier: ${riskAssessment.tier}). Reason: ${governanceDecision.reason}`,
      details: {
        intent: llmResult.intent,
        risk_score: riskAssessment.score,
        tier: riskAssessment.tier,
        vector: riskAssessment.vector,
        coverage: evidenceEval.coverage,
      },
    };
    dbStore.addAuditEvent(auditEvent);

    return record;
  }
}

export const pipelineOrchestrator = new PipelineOrchestrator();
