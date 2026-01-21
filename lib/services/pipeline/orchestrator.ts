/**
 * Pipeline Orchestration Service
 *
 * Coordinate the full prompt generation pipeline.
 * Uses single global ANTHROPIC_API_KEY for all accounts.
 * Persists data to Supabase and Google Sheets.
 */

import type {
  Briefing,
  PipelineBriefingInput,
  GeneratedPrompt,
  InjectionFile,
  CostEntry,
  VersionSheetRow,
  PipelineResult,
  PipelineStep,
} from "@/lib/types";
import {
  loadAccountConfig,
  validateApiKeyConfigured,
} from "@/lib/services/accounts";
import {
  generatePromptWithIteration,
  createInjectionFromPrompt,
} from "@/lib/services/prompt-builder";
import { getSessionCosts, resetSession } from "@/lib/services/anthropic";
import {
  findOrCreateFolder,
  findCostSpreadsheet,
  createCostSpreadsheet,
  appendCostEntries,
  appendVersionEntries,
  updateSummary,
} from "@/lib/services/google";
import {
  createVersionEntry,
  getNextVersion,
} from "@/lib/utils/version-tracker";
import { createLogger } from "@/lib/utils/logger";
import { generateId, hashContent } from "@/lib/utils/validation";

// Supabase repositories
import {
  getOrCreateAccount,
  getOrCreateAssistant,
  createPipelineRun,
  updatePipelineRun,
  completePipelineRun,
  failPipelineRun,
  createPipelineSteps,
  startPipelineStep,
  completePipelineStep,
  failPipelineStep,
  createCostEntry as createSupabaseCostEntry,
  createPromptVersion,
  getNextVersionNumber,
} from "@/lib/services/supabase/repositories";
import type {
  PipelineRun,
  PipelineStep as SupabasePipelineStep,
  Account as SupabaseAccount,
  Assistant as SupabaseAssistant,
} from "@/lib/types/supabase";

const logger = createLogger("pipeline");

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  maxIterations: number;
  enableCostTracking: boolean;
  enableSupabase: boolean;
  googleSpreadsheetName: string;
  googleFolderName: string;
}

const DEFAULT_CONFIG: PipelineConfig = {
  maxIterations: 1,
  enableCostTracking: true,
  enableSupabase: true,
  googleSpreadsheetName: "Mermaid Prompt Builder - Costs",
  googleFolderName: "Mermaid Prompt Builder",
};

/**
 * Supabase context for pipeline run
 */
interface SupabaseContext {
  account: SupabaseAccount;
  assistant: SupabaseAssistant;
  pipelineRun: PipelineRun;
  stepRecords: Map<string, SupabasePipelineStep>;
}

/**
 * Run the full pipeline for a briefing
 */
export async function runPipeline(
  payload: PipelineBriefingInput,
  config: Partial<PipelineConfig> = {},
): Promise<PipelineResult> {
  const pipelineConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  const steps: PipelineStep[] = [];
  let supabaseContext: SupabaseContext | null = null;

  // Reset session tracking
  resetSession();

  const pipelineId = generateId("pipeline");
  const briefingId = payload.briefing.id || generateId("briefing");

  const logStep = async (
    name: string,
    status: PipelineStep["status"],
    error?: string,
  ) => {
    steps.push({
      name,
      status,
      timestamp: new Date().toISOString(),
      error,
    });
    logger.info(`Pipeline step: ${name}`, { status, error });

    // Update Supabase step if context exists
    if (supabaseContext && pipelineConfig.enableSupabase) {
      const stepRecord = supabaseContext.stepRecords.get(name);
      if (stepRecord) {
        try {
          if (status === "running") {
            await startPipelineStep(stepRecord.id);
          } else if (status === "completed") {
            await completePipelineStep(stepRecord.id);
          } else if (status === "failed" && error) {
            await failPipelineStep(stepRecord.id, error);
          }
        } catch (err) {
          logger.warn("Failed to update Supabase step", {
            step: name,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  };

  try {
    // Step 0: Initialize Supabase context (if enabled)
    if (pipelineConfig.enableSupabase) {
      try {
        supabaseContext = await initializeSupabaseContext(
          payload,
          pipelineId,
          briefingId,
        );
        logger.info("Supabase context initialized", {
          accountId: supabaseContext.account.id,
          assistantId: supabaseContext.assistant.id,
          pipelineRunId: supabaseContext.pipelineRun.id,
        });
      } catch (err) {
        logger.warn(
          "Failed to initialize Supabase context, continuing without persistence",
          {
            error: err instanceof Error ? err.message : String(err),
          },
        );
        // Continue without Supabase - non-fatal
      }
    }

    // Step 1: Load account configuration
    await logStep("Load Account Config", "running");

    const accountConfig = await loadAccountConfig(payload.accountId);
    if (!accountConfig) {
      await logStep("Load Account Config", "failed", "Account not found");
      return createFailedResult(
        payload,
        pipelineId,
        steps,
        "Account not found",
        supabaseContext,
        startTime,
      );
    }

    // Validate global API key is configured
    const keyValidation = validateApiKeyConfigured();
    if (!keyValidation.valid) {
      await logStep("Load Account Config", "failed", keyValidation.error);
      return createFailedResult(
        payload,
        pipelineId,
        steps,
        keyValidation.error!,
        supabaseContext,
        startTime,
      );
    }

    await logStep("Load Account Config", "completed");

    // Step 2: Generate prompt with iterations
    await logStep("Generate Prompt", "running");

    const generatedPrompt = await generatePromptWithIteration({
      briefing: payload.briefing,
      accountId: payload.accountId,
      maxIterations: pipelineConfig.maxIterations,
    });

    await logStep("Generate Prompt", "completed");

    // Log costs to Supabase for this step
    if (supabaseContext && pipelineConfig.enableSupabase) {
      await saveCostsToSupabase(supabaseContext, "prompt_generation");
    }

    // Step 3: Determine version
    await logStep("Determine Version", "running");

    let version = "v1";
    let versionNumber = 1;

    if (supabaseContext && pipelineConfig.enableSupabase) {
      try {
        versionNumber = await getNextVersionNumber(
          supabaseContext.assistant.id,
        );
        version = `v${versionNumber}`;
      } catch (err) {
        logger.warn("Failed to get next version from Supabase, using v1", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    await logStep("Determine Version", "completed");

    // Step 4: Create injection file
    await logStep("Create Injection File", "running");

    const injectionFile = createInjectionFromPrompt(generatedPrompt, version);
    await logStep("Create Injection File", "completed");

    // Step 5: Save prompt version to Supabase
    if (supabaseContext && pipelineConfig.enableSupabase) {
      await logStep("Save Prompt Version", "running");
      try {
        await createPromptVersion({
          pipeline_run_id: supabaseContext.pipelineRun.id,
          account_id: supabaseContext.account.id,
          assistant_id: supabaseContext.assistant.id,
          version,
          version_number: versionNumber,
          prompt_content: generatedPrompt.content,
          prompt_hash: hashContent(generatedPrompt.content),
          injection_content:
            injectionFile.promptContent || generatedPrompt.content,
          injection_file_path: injectionFile.filePath || null,
          briefing_hash: hashContent(JSON.stringify(payload.briefing)),
          total_iterations: generatedPrompt.iterations?.length || 1,
          final_score: generatedPrompt.finalAnalysis?.qualityScore || null,
          status: "final",
        });
        await logStep("Save Prompt Version", "completed");
      } catch (err) {
        logger.warn("Failed to save prompt version to Supabase", {
          error: err instanceof Error ? err.message : String(err),
        });
        await logStep(
          "Save Prompt Version",
          "failed",
          "Failed to save to Supabase (non-fatal)",
        );
      }
    }

    // Step 6: Log costs to Google Sheets (if enabled)
    if (pipelineConfig.enableCostTracking) {
      await logStep("Log Costs", "running");

      try {
        await logCostsToSheets(
          payload.accountId,
          payload.briefing.assistantId,
          pipelineConfig,
          version,
          payload.briefing,
          generatedPrompt.content,
        );
        await logStep("Log Costs", "completed");
      } catch (error) {
        // Non-fatal - log warning but continue
        logger.warn("Failed to log costs to Google Sheets", {
          error: error instanceof Error ? error.message : String(error),
        });
        await logStep(
          "Log Costs",
          "failed",
          "Failed to log to Google Sheets (non-fatal)",
        );
      }
    }

    // Calculate total duration
    const totalDuration = Date.now() - startTime;

    // Complete pipeline run in Supabase
    if (supabaseContext && pipelineConfig.enableSupabase) {
      try {
        await completePipelineRun(
          supabaseContext.pipelineRun.id,
          totalDuration,
        );
      } catch (err) {
        logger.warn("Failed to complete pipeline run in Supabase", {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const result: PipelineResult = {
      id: pipelineId,
      status: "completed",
      briefingId,
      accountId: payload.accountId,
      assistantId: payload.briefing.assistantId,
      generatedPrompt,
      injectionFile,
      costEntries: getSessionCosts(),
      totalDuration,
      steps,
      completedAt: new Date().toISOString(),
    };

    logger.info("Pipeline completed successfully", {
      id: result.id,
      duration: totalDuration,
      iterations: pipelineConfig.maxIterations,
      supabaseRunId: supabaseContext?.pipelineRun.id,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Pipeline failed", { error: errorMessage });

    return createFailedResult(
      payload,
      pipelineId,
      steps,
      errorMessage,
      supabaseContext,
      startTime,
    );
  }
}

/**
 * Initialize Supabase context for pipeline run
 */
async function initializeSupabaseContext(
  payload: PipelineBriefingInput,
  pipelineId: string,
  briefingId: string,
): Promise<SupabaseContext> {
  // Get or create account
  const account = await getOrCreateAccount(
    payload.accountId,
    payload.accountId, // Use slug as name for now
  );

  // Get or create assistant
  const assistant = await getOrCreateAssistant(
    account.id,
    payload.briefing.assistantId,
    payload.briefing.assistantId, // Use external ID as name for now
  );

  // Create pipeline run
  const pipelineRun = await createPipelineRun({
    account_id: account.id,
    assistant_id: assistant.id,
    pipeline_id: pipelineId,
    briefing_id: briefingId,
    status: "running",
    briefing_data: JSON.parse(JSON.stringify(payload.briefing)),
  });

  // Create pipeline steps
  const stepDefinitions = [
    { step_name: "Load Account Config", step_order: 1 },
    { step_name: "Generate Prompt", step_order: 2 },
    { step_name: "Determine Version", step_order: 3 },
    { step_name: "Create Injection File", step_order: 4 },
    { step_name: "Save Prompt Version", step_order: 5 },
    { step_name: "Log Costs", step_order: 6 },
  ];

  const createdSteps = await createPipelineSteps(
    stepDefinitions.map((s) => ({
      pipeline_run_id: pipelineRun.id,
      step_name: s.step_name,
      step_order: s.step_order,
      status: "pending" as const,
    })),
  );

  // Create map of step name to record
  const stepRecords = new Map<string, SupabasePipelineStep>();
  for (const step of createdSteps) {
    stepRecords.set(step.step_name, step);
  }

  return {
    account,
    assistant,
    pipelineRun,
    stepRecords,
  };
}

/**
 * Save costs to Supabase for a specific operation
 */
async function saveCostsToSupabase(
  context: SupabaseContext,
  operation: string,
): Promise<void> {
  const costs = getSessionCosts();

  // Find the step record for this operation
  const stepRecord = context.stepRecords.get("Generate Prompt");

  for (const cost of costs) {
    try {
      await createSupabaseCostEntry({
        pipeline_run_id: context.pipelineRun.id,
        pipeline_step_id: stepRecord?.id || null,
        account_id: context.account.id,
        assistant_id: context.assistant.id,
        operation,
        model: cost.model,
        input_tokens: cost.inputTokens,
        output_tokens: cost.outputTokens,
        cache_read_tokens: 0, // TODO: Get from cost entry if available
        cache_write_tokens: 0,
        cost_usd: cost.costUsd,
      });
    } catch (err) {
      logger.warn("Failed to save cost entry to Supabase", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

/**
 * Create a failed pipeline result
 */
async function createFailedResult(
  payload: PipelineBriefingInput,
  pipelineId: string,
  steps: PipelineStep[],
  error: string,
  supabaseContext: SupabaseContext | null,
  startTime?: number,
): Promise<PipelineResult> {
  const durationMs = startTime ? Date.now() - startTime : 0;

  // Mark pipeline as failed in Supabase
  if (supabaseContext) {
    try {
      await failPipelineRun(supabaseContext.pipelineRun.id, error, durationMs);
    } catch (err) {
      logger.warn("Failed to mark pipeline run as failed in Supabase", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    id: pipelineId,
    status: "failed",
    briefingId: payload.briefing.id || generateId("briefing"),
    accountId: payload.accountId,
    assistantId: payload.briefing.assistantId,
    costEntries: getSessionCosts(),
    totalDuration: durationMs,
    steps,
    error,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Log costs to Google Sheets
 */
async function logCostsToSheets(
  accountId: string,
  assistantId: string,
  config: PipelineConfig,
  version: string,
  briefing: Briefing,
  promptContent: string,
): Promise<void> {
  // Find or create folder
  const folderId = await findOrCreateFolder(config.googleFolderName);

  // Find or create spreadsheet
  let spreadsheetId = await findCostSpreadsheet(
    config.googleSpreadsheetName,
    folderId,
  );
  if (!spreadsheetId) {
    spreadsheetId = await createCostSpreadsheet(
      config.googleSpreadsheetName,
      folderId,
    );
  }

  // Get session costs
  const costs = getSessionCosts();
  if (costs.length > 0) {
    await appendCostEntries(spreadsheetId, costs);
  }

  // Log version entry
  const versionEntry = createVersionEntry({
    accountId,
    assistantId,
    version,
    briefingContent: JSON.stringify(briefing),
    promptContent,
    filePath: `lib/accounts/${accountId}/assistants/${assistantId}/${version}/injection.ts`,
    status: "final",
  });

  await appendVersionEntries(spreadsheetId, [versionEntry]);

  // Update summary
  const totalCost = costs.reduce((sum, c) => sum + c.costUsd, 0);
  const totalInput = costs.reduce((sum, c) => sum + c.inputTokens, 0);
  const totalOutput = costs.reduce((sum, c) => sum + c.outputTokens, 0);

  await updateSummary(spreadsheetId, {
    totalCost,
    totalInputTokens: totalInput,
    totalOutputTokens: totalOutput,
    totalOperations: costs.length,
    lastUpdated: new Date().toISOString(),
  });

  logger.info("Logged costs to Google Sheets", {
    spreadsheetId,
    entries: costs.length,
    totalCost,
  });
}
