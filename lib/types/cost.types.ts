/**
 * Cost Types
 *
 * Types for cost tracking and Google Sheets integration.
 */

/**
 * Token usage from an API call
 */
export interface TokenUsage {
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Cache read tokens (if applicable) */
  cacheReadTokens?: number;
  /** Cache write tokens (if applicable) */
  cacheWriteTokens?: number;
}

/**
 * Cost calculation result
 */
export interface CostCalculation {
  /** Input token cost */
  inputCost: number;
  /** Output token cost */
  outputCost: number;
  /** Cache cost (if applicable) */
  cacheCost?: number;
  /** Total cost in USD */
  totalCostUsd: number;
}

/**
 * Operation types for cost tracking
 */
export type CostOperation =
  | "generate_initial"
  | "analyze_prompt"
  | "improve_prompt"
  | "finalize_prompt"
  | "injection_execute"
  | "assistant_get"
  | "assistant_create"
  | "assistant_update"
  | "prompt_generation"
  | "prompt_analysis"
  | "prompt_improvement";

/**
 * Single cost log entry
 */
export interface CostEntry {
  /** Unique entry identifier */
  id: string;
  /** ISO timestamp */
  timestamp: string;
  /** Account identifier */
  accountId: string;
  /** Assistant identifier */
  assistantId: string;
  /** Operation performed */
  operation: CostOperation;
  /** Claude model used */
  model: string;
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Total cost in USD */
  costUsd: number;
  /** Version (if applicable) */
  version?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cost summary for a time period
 */
export interface CostSummary {
  /** Start of period */
  periodStart: string;
  /** End of period */
  periodEnd: string;
  /** Total cost in USD */
  totalCostUsd: number;
  /** Total input tokens */
  totalInputTokens: number;
  /** Total output tokens */
  totalOutputTokens: number;
  /** Cost by operation */
  byOperation: Record<CostOperation, number>;
  /** Cost by account */
  byAccount: Record<string, number>;
  /** Cost by model */
  byModel: Record<string, number>;
  /** Number of operations */
  operationCount: number;
}

/**
 * Google Sheets row for API Costs sheet
 */
export interface CostSheetRow {
  /** ISO timestamp */
  timestamp: string;
  /** Account ID */
  account_id: string;
  /** Assistant ID */
  assistant_id: string;
  /** Operation type */
  operation: CostOperation;
  /** Model name */
  model: string;
  /** Input tokens */
  input_tokens: number;
  /** Output tokens */
  output_tokens: number;
  /** Cost in USD */
  cost_usd: number;
  /** Version */
  version: string;
}

/**
 * Google Sheets row for Version History sheet
 */
export interface VersionSheetRow {
  /** ISO timestamp */
  timestamp: string;
  /** Account ID */
  account_id: string;
  /** Assistant ID */
  assistant_id: string;
  /** Version string */
  version: string;
  /** Briefing content hash */
  briefing_hash: string;
  /** Prompt content hash */
  prompt_hash: string;
  /** File path */
  file_path: string;
  /** Status */
  status: "draft" | "final";
}

/**
 * Claude model pricing (per 1M tokens)
 */
export interface ModelPricing {
  /** Model identifier */
  model: string;
  /** Input token price per 1M */
  inputPer1M: number;
  /** Output token price per 1M */
  outputPer1M: number;
  /** Cache read price per 1M (if supported) */
  cacheReadPer1M?: number;
  /** Cache write price per 1M (if supported) */
  cacheWritePer1M?: number;
}

/**
 * Pricing table for all supported models
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-5-20251101": {
    model: "claude-opus-4-5-20251101",
    inputPer1M: 15.0,
    outputPer1M: 75.0,
    cacheReadPer1M: 1.5,
    cacheWritePer1M: 18.75,
  },
  "claude-sonnet-4-20250514": {
    model: "claude-sonnet-4-20250514",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },
  "claude-3-5-sonnet-20241022": {
    model: "claude-3-5-sonnet-20241022",
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    cacheReadPer1M: 0.3,
    cacheWritePer1M: 3.75,
  },
  "claude-3-5-haiku-20241022": {
    model: "claude-3-5-haiku-20241022",
    inputPer1M: 0.8,
    outputPer1M: 4.0,
    cacheReadPer1M: 0.08,
    cacheWritePer1M: 1.0,
  },
};
