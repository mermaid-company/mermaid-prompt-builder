/**
 * Anthropic Usage Service
 *
 * Track and aggregate API usage.
 */

import type { TokenUsage, CostEntry } from "@/lib/types";
import { createCostEntry } from "@/lib/utils/cost-tracker";
import { createLogger } from "@/lib/utils/logger";
import { DEFAULT_MODEL } from "./client";

const logger = createLogger("anthropic-usage");

// In-memory usage tracker for current session
const sessionUsage: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

// Cost entries for current session
const sessionCosts: CostEntry[] = [];

/**
 * Add usage to session tracker
 */
export function trackUsage(usage: TokenUsage): void {
  sessionUsage.inputTokens += usage.inputTokens;
  sessionUsage.outputTokens += usage.outputTokens;
  sessionUsage.cacheReadTokens =
    (sessionUsage.cacheReadTokens || 0) + (usage.cacheReadTokens || 0);
  sessionUsage.cacheWriteTokens =
    (sessionUsage.cacheWriteTokens || 0) + (usage.cacheWriteTokens || 0);

  logger.debug("Usage tracked", {
    session: sessionUsage,
  });
}

/**
 * Log cost entry for an operation
 */
export function logCost(params: {
  accountId: string;
  assistantId: string;
  operation: CostEntry["operation"];
  usage: TokenUsage;
  model?: string;
  version?: string;
  metadata?: Record<string, unknown>;
}): CostEntry {
  const entry = createCostEntry({
    accountId: params.accountId,
    assistantId: params.assistantId,
    operation: params.operation,
    model: params.model || DEFAULT_MODEL,
    usage: params.usage,
    version: params.version,
    metadata: params.metadata,
  });

  sessionCosts.push(entry);
  trackUsage(params.usage);

  return entry;
}

/**
 * Get current session usage
 */
export function getSessionUsage(): TokenUsage {
  return { ...sessionUsage };
}

/**
 * Get session cost entries
 */
export function getSessionCosts(): CostEntry[] {
  return [...sessionCosts];
}

/**
 * Reset session tracking
 */
export function resetSession(): void {
  sessionUsage.inputTokens = 0;
  sessionUsage.outputTokens = 0;
  sessionUsage.cacheReadTokens = 0;
  sessionUsage.cacheWriteTokens = 0;
  sessionCosts.length = 0;

  logger.info("Session usage reset");
}

/**
 * Calculate total session cost
 */
export function getSessionTotalCost(): number {
  return sessionCosts.reduce((total, entry) => total + entry.costUsd, 0);
}

/**
 * Format usage summary
 */
export function formatUsageSummary(): string {
  const totalCost = getSessionTotalCost();
  return `
Session Usage Summary:
- Input Tokens: ${sessionUsage.inputTokens.toLocaleString()}
- Output Tokens: ${sessionUsage.outputTokens.toLocaleString()}
- Cache Read: ${(sessionUsage.cacheReadTokens || 0).toLocaleString()}
- Cache Write: ${(sessionUsage.cacheWriteTokens || 0).toLocaleString()}
- Total Cost: $${totalCost.toFixed(4)}
- Operations: ${sessionCosts.length}
  `.trim();
}
