/**
 * Pipeline Orchestration Service
 *
 * Coordinate the full prompt generation pipeline.
 * Uses single global ANTHROPIC_API_KEY for all accounts.
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

const logger = createLogger("pipeline");

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  maxIterations: number;
  enableCostTracking: boolean;
  googleSpreadsheetName: string;
  googleFolderName: string;
}

const DEFAULT_CONFIG: PipelineConfig = {
  maxIterations: 1,
  enableCostTracking: true,
  googleSpreadsheetName: "Mermaid Prompt Builder - Costs",
  googleFolderName: "Mermaid Prompt Builder",
};

/**
 * Run the full pipeline for a briefing
 */
export async function runPipeline(
  payload: PipelineBriefingInput,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const pipelineConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();
  const steps: PipelineStep[] = [];

  // Reset session tracking
  resetSession();

  const logStep = (
    name: string,
    status: PipelineStep["status"],
    error?: string
  ) => {
    steps.push({
      name,
      status,
      timestamp: new Date().toISOString(),
      error,
    });
    logger.info(`Pipeline step: ${name}`, { status, error });
  };

  try {
    // Step 1: Load account configuration
    logStep("Load Account Config", "running");

    const accountConfig = await loadAccountConfig(payload.accountId);
    if (!accountConfig) {
      logStep("Load Account Config", "failed", "Account not found");
      return createFailedResult(payload, steps, "Account not found");
    }

    // Validate global API key is configured
    const keyValidation = validateApiKeyConfigured();
    if (!keyValidation.valid) {
      logStep("Load Account Config", "failed", keyValidation.error);
      return createFailedResult(payload, steps, keyValidation.error!);
    }

    logStep("Load Account Config", "completed");

    // Step 2: Generate prompt with iterations
    logStep("Generate Prompt", "running");

    const generatedPrompt = await generatePromptWithIteration({
      briefing: payload.briefing,
      accountId: payload.accountId,
      maxIterations: pipelineConfig.maxIterations,
    });

    logStep("Generate Prompt", "completed");

    // Step 3: Determine version
    logStep("Determine Version", "running");

    // For now, use v1 - in production, would check existing versions
    const version = "v1";
    logStep("Determine Version", "completed");

    // Step 4: Create injection file
    logStep("Create Injection File", "running");

    const injectionFile = createInjectionFromPrompt(generatedPrompt, version);
    logStep("Create Injection File", "completed");

    // Step 5: Log costs to Google Sheets (if enabled)
    if (pipelineConfig.enableCostTracking) {
      logStep("Log Costs", "running");

      try {
        await logCostsToSheets(
          payload.accountId,
          payload.briefing.assistantId,
          pipelineConfig,
          version,
          payload.briefing,
          generatedPrompt.content
        );
        logStep("Log Costs", "completed");
      } catch (error) {
        // Non-fatal - log warning but continue
        logger.warn("Failed to log costs to Google Sheets", {
          error: error instanceof Error ? error.message : String(error),
        });
        logStep(
          "Log Costs",
          "failed",
          "Failed to log to Google Sheets (non-fatal)"
        );
      }
    }

    // Calculate total duration
    const totalDuration = Date.now() - startTime;

    const result: PipelineResult = {
      id: generateId("pipeline"),
      status: "completed",
      briefingId: payload.briefing.id,
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
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Pipeline failed", { error: errorMessage });

    return createFailedResult(payload, steps, errorMessage);
  }
}

/**
 * Create a failed pipeline result
 */
function createFailedResult(
  payload: PipelineBriefingInput,
  steps: PipelineStep[],
  error: string
): PipelineResult {
  return {
    id: generateId("pipeline"),
    status: "failed",
    briefingId: payload.briefing.id,
    accountId: payload.accountId,
    assistantId: payload.briefing.assistantId,
    costEntries: getSessionCosts(),
    totalDuration: 0,
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
  promptContent: string
): Promise<void> {
  // Find or create folder
  const folderId = await findOrCreateFolder(config.googleFolderName);

  // Find or create spreadsheet
  let spreadsheetId = await findCostSpreadsheet(
    config.googleSpreadsheetName,
    folderId
  );
  if (!spreadsheetId) {
    spreadsheetId = await createCostSpreadsheet(
      config.googleSpreadsheetName,
      folderId
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
