/**
 * Pipeline Steps Repository
 *
 * CRUD operations for the pipeline_steps table.
 */

import { getSupabaseClient } from "../client";
import { createLogger } from "@/lib/utils/logger";
import type {
  PipelineStep,
  PipelineStepInsert,
  PipelineStepUpdate,
  Json,
} from "@/lib/types/supabase";

const logger = createLogger("repo-pipeline-steps");

/**
 * Create a new pipeline step
 */
export async function createPipelineStep(
  data: PipelineStepInsert,
): Promise<PipelineStep> {
  const supabase = getSupabaseClient();
  const { data: step, error } = await supabase
    .from("pipeline_steps")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Failed to create pipeline step", { error: error.message });
    throw error;
  }

  logger.debug("Created pipeline step", {
    stepName: step.step_name,
    pipelineRunId: step.pipeline_run_id,
  });
  return step;
}

/**
 * Create multiple pipeline steps
 */
export async function createPipelineSteps(
  steps: PipelineStepInsert[],
): Promise<PipelineStep[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pipeline_steps")
    .insert(steps)
    .select();

  if (error) {
    logger.error("Failed to create pipeline steps", { error: error.message });
    throw error;
  }

  logger.debug("Created pipeline steps", { count: data?.length });
  return data || [];
}

/**
 * Get pipeline step by ID
 */
export async function getPipelineStepById(
  id: string,
): Promise<PipelineStep | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pipeline_steps")
    .select()
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get pipeline step", { error: error.message });
    throw error;
  }

  return data;
}

/**
 * Update a pipeline step
 */
export async function updatePipelineStep(
  id: string,
  data: PipelineStepUpdate,
): Promise<PipelineStep> {
  const supabase = getSupabaseClient();
  const { data: step, error } = await supabase
    .from("pipeline_steps")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update pipeline step", { error: error.message });
    throw error;
  }

  return step;
}

/**
 * List steps for a pipeline run
 */
export async function listStepsByPipelineRun(
  pipelineRunId: string,
): Promise<PipelineStep[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pipeline_steps")
    .select()
    .eq("pipeline_run_id", pipelineRunId)
    .order("step_order", { ascending: true });

  if (error) {
    logger.error("Failed to list pipeline steps", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Start a pipeline step
 */
export async function startPipelineStep(id: string): Promise<PipelineStep> {
  return updatePipelineStep(id, {
    status: "running",
    started_at: new Date().toISOString(),
  });
}

/**
 * Complete a pipeline step
 */
export async function completePipelineStep(
  id: string,
  metadata?: Json,
): Promise<PipelineStep> {
  const step = await getPipelineStepById(id);
  const startedAt = step?.started_at ? new Date(step.started_at) : new Date();
  const durationMs = Date.now() - startedAt.getTime();

  return updatePipelineStep(id, {
    status: "completed",
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
    ...(metadata !== undefined && { metadata }),
  });
}

/**
 * Fail a pipeline step
 */
export async function failPipelineStep(
  id: string,
  errorMessage: string,
): Promise<PipelineStep> {
  const step = await getPipelineStepById(id);
  const startedAt = step?.started_at ? new Date(step.started_at) : new Date();
  const durationMs = Date.now() - startedAt.getTime();

  return updatePipelineStep(id, {
    status: "failed",
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
    duration_ms: durationMs,
  });
}
