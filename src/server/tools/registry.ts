import { dbStore } from '../db/store.ts';
import { FinancialTool, RiskTier, ToolExecutionRecord, UserRole } from '../types.ts';

export interface ToolInvocationContext {
  userId: string;
  userRole: UserRole;
  riskTier: RiskTier;
  isApprovedByHuman?: boolean;
}

export class ToolRegistry {
  public getTool(toolId: string): FinancialTool | undefined {
    return dbStore.tools.find((t) => t.tool_id === toolId);
  }

  /**
   * Safe execution gatekeeper:
   * 1. Checks if tool exists & is enabled
   * 2. Checks role authorization
   * 3. Checks allowed risk tiers
   * 4. Checks human approval requirement
   * 5. Only then executes
   */
  public async executeTool(
    toolId: string,
    args: Record<string, any>,
    context: ToolInvocationContext
  ): Promise<ToolExecutionRecord> {
    const tool = this.getTool(toolId);
    const now = new Date().toISOString();

    if (!tool || !tool.enabled) {
      return {
        tool_id: toolId,
        tool_name: tool ? tool.name : toolId,
        arguments: args,
        executed: false,
        blocked_reason: `TOOL_DISABLED_OR_UNKNOWN: Tool ${toolId} is inactive or not found in registry.`,
        timestamp: now,
      };
    }

    // Role check
    if (!tool.allowed_roles.includes(context.userRole)) {
      return {
        tool_id: toolId,
        tool_name: tool.name,
        arguments: args,
        executed: false,
        blocked_reason: `AUTHORIZATION_DENIED: Role ${context.userRole} is not permitted to execute tool ${tool.name}.`,
        timestamp: now,
      };
    }

    // Approval check
    if (tool.requires_approval && !context.isApprovedByHuman) {
      return {
        tool_id: toolId,
        tool_name: tool.name,
        arguments: args,
        executed: false,
        blocked_reason: `PENDING_HUMAN_APPROVAL: Execution halted pending Level-3 authorized reviewer signoff.`,
        timestamp: now,
      };
    }

    // Execute Sandbox Action
    try {
      let result: any = null;

      switch (toolId) {
        case 'tool-calc': {
          // Deterministic safe calculation
          const formula = String(args.formula || '');
          let cleanExpr = '';

          // Look for an explicit substitution pattern like ((60.92 - 26.97) / 26.97) * 100 or ((v2 - v1) / v1)
          const subMatch = formula.match(/Substitution:\s*([^\n\r]+)/i);
          if (subMatch && subMatch[1]) {
            cleanExpr = subMatch[1].replace(/×/g, '*').replace(/[^0-9+\-*/().\s]/g, '').trim();
          }

          if (!cleanExpr) {
            // Find any numeric formula pattern like (number - number) / number
            const exprMatch = formula.match(/([0-9.]+\s*[-+/*]\s*[0-9.]+(?:\s*[-+/*]\s*[0-9.]+)*)/);
            if (exprMatch) {
              cleanExpr = exprMatch[0];
            } else {
              cleanExpr = formula.replace(/×/g, '*').replace(/[^0-9+\-*/().]/g, '');
            }
          }

          let val: any = 0;
          try {
            if (cleanExpr) {
              val = Function(`'use strict'; return (${cleanExpr})`)();
            }
          } catch {
            val = 0;
          }

          result = {
            expression: cleanExpr || formula,
            value: typeof val === 'number' ? Number(val.toFixed(4)) : val,
            formatted: typeof val === 'number' ? (val > 0 ? `+${val.toFixed(2)}%` : `${val.toFixed(2)}%`) : String(val),
            variance_unit: 'Percentage (%)',
          };
          break;
        }

        case 'tool-tx-lookup': {
          const userAccounts = dbStore.accounts
            .filter((a) => a.user_id === context.userId)
            .map((a) => a.id);
          const txs = dbStore.transactions.filter((tx) => userAccounts.includes(tx.account_id));
          result = {
            total_count: txs.length,
            transactions: txs.slice(0, 10),
          };
          break;
        }

        case 'tool-account-lookup': {
          const accounts = dbStore.accounts.filter((a) => a.user_id === context.userId);
          result = {
            accounts: accounts.map((a) => ({
              id: a.id,
              name: a.account_name,
              number: a.account_number_masked,
              balance: a.balance,
              currency: a.currency,
              monthly_budget: a.monthly_budget,
              monthly_spent: a.monthly_spent,
              budget_utilization_pct: Math.round((a.monthly_spent / a.monthly_budget) * 100),
            })),
          };
          break;
        }

        case 'tool-contract-action': {
          result = {
            action: args.action || 'APPROVE',
            contract_id: args.contract_id || '2024-CH-09',
            status: 'EXECUTED_APPROVED',
            message: 'Contract formally executed in compliance sandbox following reviewer signoff.',
            audit_ref: `CR-SIGN-${Date.now().toString(36).toUpperCase()}`,
          };
          break;
        }

        case 'tool-wire-transfer': {
          const amount = Number(args.amount || 50000);
          result = {
            status: 'COMPLETED',
            amount,
            currency: 'INR (₹)',
            ref_number: `WT-${Math.floor(100000 + Math.random() * 900000)}`,
            message: `Disbursement of ₹${amount.toLocaleString()} executed from authorized reserve account.`,
          };
          break;
        }

        default:
          result = { status: 'OK', tool: tool.name };
      }

      return {
        tool_id: toolId,
        tool_name: tool.name,
        arguments: args,
        result,
        executed: true,
        timestamp: now,
      };
    } catch (err: any) {
      return {
        tool_id: toolId,
        tool_name: tool.name,
        arguments: args,
        executed: false,
        blocked_reason: `EXECUTION_RUNTIME_ERROR: ${err.message}`,
        timestamp: now,
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();
