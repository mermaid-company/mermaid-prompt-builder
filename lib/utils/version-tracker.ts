/**
 * Version Tracker Utility
 *
 * Track prompt versions and log to Google Sheets.
 */

import type { VersionSheetRow } from "@/lib/types";
import { createLogger } from "./logger";
import { hashContent, generateId } from "./validation";

const logger = createLogger("version-tracker");

/**
 * Get the next version number for an assistant
 */
export function getNextVersion(existingVersions: string[]): string {
  if (existingVersions.length === 0) {
    return "v1";
  }

  const versionNumbers = existingVersions
    .map((v) => parseInt(v.replace("v", ""), 10))
    .filter((n) => !isNaN(n));

  const maxVersion = Math.max(...versionNumbers, 0);
  return `v${maxVersion + 1}`;
}

/**
 * Create a version entry for logging
 */
export function createVersionEntry(params: {
  accountId: string;
  assistantId: string;
  version: string;
  briefingContent: string;
  promptContent: string;
  filePath: string;
  status: "draft" | "final";
}): VersionSheetRow {
  const entry: VersionSheetRow = {
    timestamp: new Date().toISOString(),
    account_id: params.accountId,
    assistant_id: params.assistantId,
    version: params.version,
    briefing_hash: hashContent(params.briefingContent),
    prompt_hash: hashContent(params.promptContent),
    file_path: params.filePath,
    status: params.status,
  };

  logger.info(`Version tracked: ${params.version}`, {
    accountId: params.accountId,
    assistantId: params.assistantId,
    status: params.status,
  });

  return entry;
}

/**
 * Format version entry as Google Sheets row
 */
export function formatVersionSheetRow(entry: VersionSheetRow): string[] {
  return [
    entry.timestamp,
    entry.account_id,
    entry.assistant_id,
    entry.version,
    entry.briefing_hash,
    entry.prompt_hash,
    entry.file_path,
    entry.status,
  ];
}

/**
 * Generate file path for a version
 */
export function generateVersionPath(
  accountId: string,
  assistantId: string,
  version: string
): string {
  return `lib/accounts/${accountId}/assistants/${assistantId}/${version}`;
}

/**
 * Generate injection file name
 */
export function generateInjectionFileName(version: string): string {
  return `injection.ts`;
}

/**
 * Generate prompt file name
 */
export function generatePromptFileName(version: string): string {
  return `prompt.md`;
}
