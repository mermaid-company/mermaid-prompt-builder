/**
 * Cost Entries Repository
 *
 * CRUD operations for the cost_entries table.
 */

import { getSupabaseClient } from "../client";
import { createLogger } from "@/lib/utils/logger";
import type {
  CostEntryRow,
  CostEntryInsert,
  DailyCostByAccount,
  CostByAssistant,
} from "@/lib/types/supabase";

const logger = createLogger("repo-cost-entries");

/**
 * Create a new cost entry
 */
export async function createCostEntry(
  data: CostEntryInsert,
): Promise<CostEntryRow> {
  const supabase = getSupabaseClient();
  const { data: entry, error } = await supabase
    .from("cost_entries")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Failed to create cost entry", { error: error.message });
    throw error;
  }

  logger.debug("Created cost entry", {
    operation: entry.operation,
    costUsd: entry.cost_usd,
  });
  return entry;
}

/**
 * Create multiple cost entries
 */
export async function createCostEntries(
  entries: CostEntryInsert[],
): Promise<CostEntryRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cost_entries")
    .insert(entries)
    .select();

  if (error) {
    logger.error("Failed to create cost entries", { error: error.message });
    throw error;
  }

  logger.debug("Created cost entries", { count: data?.length });
  return data || [];
}

/**
 * Get cost entries for a pipeline run
 */
export async function getCostEntriesByPipelineRun(
  pipelineRunId: string,
): Promise<CostEntryRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cost_entries")
    .select()
    .eq("pipeline_run_id", pipelineRunId)
    .order("timestamp", { ascending: true });

  if (error) {
    logger.error("Failed to get cost entries", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Get cost entries for an account
 */
export async function getCostEntriesByAccount(
  accountId: string,
  limit?: number,
): Promise<CostEntryRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("cost_entries")
    .select()
    .eq("account_id", accountId)
    .order("timestamp", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to get cost entries by account", {
      error: error.message,
    });
    throw error;
  }

  return data || [];
}

/**
 * Get daily costs by account
 */
export async function getDailyCostsByAccount(
  accountId: string,
  days: number = 30,
): Promise<DailyCostByAccount[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_daily_costs_by_account")
    .select()
    .eq("account_id", accountId)
    .order("date", { ascending: false })
    .limit(days);

  if (error) {
    logger.error("Failed to get daily costs", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Get all daily costs (global view)
 */
export async function getAllDailyCosts(
  days: number = 30,
): Promise<DailyCostByAccount[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_daily_costs_by_account")
    .select()
    .order("date", { ascending: false })
    .limit(days);

  if (error) {
    logger.error("Failed to get all daily costs", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Get cost summary by assistant
 */
export async function getCostsByAssistant(
  accountId?: string,
): Promise<CostByAssistant[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from("v_costs_by_assistant").select();

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to get costs by assistant", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Get total cost for an account
 */
export async function getTotalCostByAccount(
  accountId: string,
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cost_entries")
    .select("cost_usd")
    .eq("account_id", accountId);

  if (error) {
    logger.error("Failed to get total cost", { error: error.message });
    throw error;
  }

  return (data || []).reduce((sum, entry) => sum + Number(entry.cost_usd), 0);
}

/**
 * Get cost summary for a specific operation type
 */
export async function getCostsByOperation(params: {
  accountId?: string;
  operation: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ totalCost: number; totalTokens: number; count: number }> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("cost_entries")
    .select("cost_usd, input_tokens, output_tokens")
    .eq("operation", params.operation);

  if (params.accountId) {
    query = query.eq("account_id", params.accountId);
  }
  if (params.startDate) {
    query = query.gte("timestamp", params.startDate);
  }
  if (params.endDate) {
    query = query.lte("timestamp", params.endDate);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to get costs by operation", { error: error.message });
    throw error;
  }

  const entries = data || [];
  return {
    totalCost: entries.reduce((sum, e) => sum + Number(e.cost_usd), 0),
    totalTokens: entries.reduce(
      (sum, e) => sum + e.input_tokens + e.output_tokens,
      0,
    ),
    count: entries.length,
  };
}

/**
 * Get cost summary by account (for global dashboard)
 */
export async function getCostSummaryByAccount(
  days: number = 30,
): Promise<DailyCostByAccount[]> {
  return getAllDailyCosts(days);
}

/**
 * Get cost summary by assistant
 */
export async function getCostSummaryByAssistant(
  accountId?: string,
): Promise<CostByAssistant[]> {
  return getCostsByAssistant(accountId);
}
