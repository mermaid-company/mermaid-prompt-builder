/**
 * Cost Tracker Utility
 *
 * Calculate and log API costs to Google Sheets.
 */

import type {
  CostCalculation,
  CostEntry,
  CostOperation,
  TokenUsage,
} from "@/lib/types";
import { MODEL_PRICING } from "@/lib/types";
import { createLogger } from "./logger";
import { generateId } from "./validation";

const logger = createLogger("cost-tracker");

/**
 * Calculate cost for token usage
 */
export function calculateCost(
  usage: TokenUsage,
  model: string
): CostCalculation {
  const pricing = MODEL_PRICING[model];

  if (!pricing) {
    logger.warn(`Unknown model pricing: ${model}, using opus pricing`);
    const opusPricing = MODEL_PRICING["claude-opus-4-5-20251101"];
    return calculateCostWithPricing(usage, opusPricing);
  }

  return calculateCostWithPricing(usage, pricing);
}

function calculateCostWithPricing(
  usage: TokenUsage,
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
    cacheReadPer1M?: number;
    cacheWritePer1M?: number;
  }
): CostCalculation {
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPer1M;

  let cacheCost = 0;
  if (usage.cacheReadTokens && pricing.cacheReadPer1M) {
    cacheCost += (usage.cacheReadTokens / 1_000_000) * pricing.cacheReadPer1M;
  }
  if (usage.cacheWriteTokens && pricing.cacheWritePer1M) {
    cacheCost += (usage.cacheWriteTokens / 1_000_000) * pricing.cacheWritePer1M;
  }

  const totalCostUsd = inputCost + outputCost + cacheCost;

  return {
    inputCost,
    outputCost,
    cacheCost: cacheCost > 0 ? cacheCost : undefined,
    totalCostUsd,
  };
}

/**
 * Create a cost entry for logging
 */
export function createCostEntry(params: {
  accountId: string;
  assistantId: string;
  operation: CostOperation;
  model: string;
  usage: TokenUsage;
  version?: string;
  metadata?: Record<string, unknown>;
}): CostEntry {
  const cost = calculateCost(params.usage, params.model);

  const entry: CostEntry = {
    id: generateId("cost"),
    timestamp: new Date().toISOString(),
    accountId: params.accountId,
    assistantId: params.assistantId,
    operation: params.operation,
    model: params.model,
    inputTokens: params.usage.inputTokens,
    outputTokens: params.usage.outputTokens,
    costUsd: cost.totalCostUsd,
    version: params.version,
    metadata: params.metadata,
  };

  logger.info(`Cost tracked: $${cost.totalCostUsd.toFixed(4)}`, {
    operation: params.operation,
    inputTokens: params.usage.inputTokens,
    outputTokens: params.usage.outputTokens,
  });

  return entry;
}

/**
 * Format cost entry as Google Sheets row
 */
export function formatCostSheetRow(entry: CostEntry): string[] {
  return [
    entry.timestamp,
    entry.accountId,
    entry.assistantId,
    entry.operation,
    entry.model,
    entry.inputTokens.toString(),
    entry.outputTokens.toString(),
    entry.costUsd.toFixed(6),
    entry.version || "",
  ];
}

/**
 * Estimate cost before execution
 */
export function estimateCost(
  estimatedInputTokens: number,
  estimatedOutputTokens: number,
  model: string
): CostCalculation {
  return calculateCost(
    {
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
    },
    model
  );
}
