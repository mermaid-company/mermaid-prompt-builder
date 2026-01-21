/**
 * Pipeline Runs Repository
 *
 * CRUD operations for the pipeline_runs table.
 */

import { getSupabaseClient } from "../client";
import { createLogger } from "@/lib/utils/logger";
import type {
  PipelineRun,
  PipelineRunInsert,
  PipelineRunUpdate,
  PipelineCostBreakdown,
} from "@/lib/types/supabase";

const logger = createLogger("repo-pipeline-runs");

/**
 * Create a new pipeline run
 */
export async function createPipelineRun(
  data: PipelineRunInsert
): Promise<PipelineRun> {
  const supabase = getSupabaseClient();
  const { data: run, error } = await supabase
    .from("pipeline_runs")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Failed to create pipeline run", { error: error.message });
    throw error;
  }

  logger.info("Created pipeline run", { pipelineId: run.pipeline_id });
  return run;
}

/**
 * Get pipeline run by ID
 */
export async function getPipelineRunById(
  id: string
): Promise<PipelineRun | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select()
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get pipeline run", { error: error.message });
    throw error;
  }

  return data;
}

/**
 * Get pipeline run by pipeline_id
 */
export async function getPipelineRunByPipelineId(
  pipelineId: string
): Promise<PipelineRun | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pipeline_runs")
    .select()
    .eq("pipeline_id", pipelineId)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get pipeline run by pipeline_id", {
      error: error.message,
    });
    throw error;
  }

  return data;
}

/**
 * Update a pipeline run
 */
export async function updatePipelineRun(
  id: string,
  data: PipelineRunUpdate
): Promise<PipelineRun> {
  const supabase = getSupabaseClient();
  const { data: run, error } = await supabase
    .from("pipeline_runs")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update pipeline run", { error: error.message });
    throw error;
  }

  logger.info("Updated pipeline run", { id, status: data.status });
  return run;
}

/**
 * Get pipeline run with cost breakdown
 */
export async function getPipelineRunWithCosts(
  id: string
): Promise<PipelineCostBreakdown | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_pipeline_cost_breakdown")
    .select()
    .eq("pipeline_run_id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get pipeline cost breakdown", {
      error: error.message,
    });
    throw error;
  }

  return data;
}

/**
 * List pipeline runs with optional filters
 */
export async function listPipelineRuns(params: {
  accountId?: string;
  assistantId?: string;
  status?: "running" | "completed" | "failed";
  limit?: number;
  offset?: number;
}): Promise<PipelineRun[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("pipeline_runs")
    .select()
    .order("created_at", { ascending: false });

  if (params.accountId) {
    query = query.eq("account_id", params.accountId);
  }
  if (params.assistantId) {
    query = query.eq("assistant_id", params.assistantId);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.limit) {
    query = query.limit(params.limit);
  }
  if (params.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to list pipeline runs", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * List pipeline runs with cost breakdowns
 */
export async function listPipelineRunsWithCosts(params: {
  accountId?: string;
  assistantId?: string;
  limit?: number;
}): Promise<PipelineCostBreakdown[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("v_pipeline_cost_breakdown")
    .select()
    .order("started_at", { ascending: false });

  if (params.accountId) {
    query = query.eq("account_id", params.accountId);
  }
  if (params.assistantId) {
    query = query.eq("assistant_id", params.assistantId);
  }
  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to list pipeline runs with costs", {
      error: error.message,
    });
    throw error;
  }

  return data || [];
}

/**
 * Mark pipeline run as completed
 */
export async function completePipelineRun(
  id: string,
  durationMs: number
): Promise<PipelineRun> {
  return updatePipelineRun(id, {
    status: "completed",
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
  });
}

/**
 * Mark pipeline run as failed
 */
export async function failPipelineRun(
  id: string,
  errorMessage: string,
  durationMs: number
): Promise<PipelineRun> {
  return updatePipelineRun(id, {
    status: "failed",
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
  });
}
