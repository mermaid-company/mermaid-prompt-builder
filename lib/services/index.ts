/**
 * Services Barrel Export
 */

// Webhook
export {
  validateWebhookSignature,
  getWebhookSecret,
  createWebhookSignature,
  parseWebhookPayload,
  extractBriefing,
} from "./webhook";

// Anthropic
export {
  getAnthropicClient,
  getAnthropicAdminClient,
  clearClientCache,
  DEFAULT_MODEL,
  sendMessage,
  generatePromptFromBriefing,
  analyzePrompt,
  improvePrompt,
  type MessageResponse,
  trackUsage,
  logCost,
  getSessionUsage,
  getSessionCosts,
  resetSession,
  getSessionTotalCost,
  formatUsageSummary,
} from "./anthropic";

// Google
export {
  getGoogleAuth,
  getDriveClient,
  getSheetsClient,
  clearAuthCache,
  findOrCreateFolder,
  listFilesInFolder,
  getSharedDriveId,
  SHEETS,
  createCostSpreadsheet,
  appendCostEntries,
  appendVersionEntries,
  updateSummary,
  getCostEntries,
  findCostSpreadsheet,
} from "./google";

// Prompt Builder
export {
  loadPRISMASystem,
  getPRISMASystemPrompt,
  formatBriefingAsMarkdown,
  generateInitialPrompt,
  analyzeGeneratedPrompt,
  improveGeneratedPrompt,
  generatePromptWithIteration,
  generateInjectionContent,
  saveInjectionFile,
  createInjectionFromPrompt,
} from "./prompt-builder";

// Accounts
export {
  listAccounts,
  loadAccountConfig,
  getAnthropicApiKey,
  validateApiKeyConfigured,
  clearAccountCache,
  accountExists,
  getAccountAssistantsPath,
} from "./accounts";

// Pipeline
export { runPipeline, type PipelineConfig } from "./pipeline";

// MermAId
export {
  updateAssistant,
  getAssistant,
  parsePromptToMermaidOptions,
  type MermaidAssistantOptions,
  type MermaidAssistantResponse,
  type MermaidUpdateResult,
} from "./mermaid";
