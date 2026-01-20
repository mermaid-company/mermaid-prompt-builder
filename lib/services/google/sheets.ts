/**
 * Google Sheets Service
 *
 * Manage spreadsheets for cost tracking.
 */

import { getSheetsClient, getDriveClient } from "./auth";
import { createLogger } from "@/lib/utils/logger";
import type { CostEntry, VersionSheetRow } from "@/lib/types";
import { formatCostSheetRow, formatVersionSheetRow } from "@/lib/utils";

const logger = createLogger("google-sheets");

// Sheet names
export const SHEETS = {
  COSTS: "API Costs",
  VERSIONS: "Version History",
  SUMMARY: "Summary",
} as const;

// Column headers
const COST_HEADERS = [
  "Timestamp",
  "Account ID",
  "Assistant ID",
  "Operation",
  "Model",
  "Input Tokens",
  "Output Tokens",
  "Cost (USD)",
  "Version",
];

const VERSION_HEADERS = [
  "Timestamp",
  "Account ID",
  "Assistant ID",
  "Version",
  "Briefing Hash",
  "Prompt Hash",
  "File Path",
  "Status",
];

/**
 * Create a new cost tracking spreadsheet
 */
export async function createCostSpreadsheet(
  name: string,
  parentFolderId?: string
): Promise<string> {
  const sheets = getSheetsClient();
  const drive = getDriveClient();

  // Create spreadsheet
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: name,
      },
      sheets: [
        {
          properties: {
            title: SHEETS.COSTS,
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: SHEETS.VERSIONS,
            gridProperties: { frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: SHEETS.SUMMARY,
          },
        },
      ],
    },
  });

  const spreadsheetId = response.data.spreadsheetId!;
  logger.info(`Created spreadsheet: ${name}`, { id: spreadsheetId });

  // Add headers
  await addHeaders(spreadsheetId);

  // Move to folder if specified
  if (parentFolderId) {
    await drive.files.update({
      fileId: spreadsheetId,
      addParents: parentFolderId,
      fields: "id, parents",
      supportsAllDrives: true,
    });
    logger.info(`Moved spreadsheet to folder`, { folderId: parentFolderId });
  }

  return spreadsheetId;
}

/**
 * Add headers to sheets
 */
async function addHeaders(spreadsheetId: string): Promise<void> {
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        {
          range: `'${SHEETS.COSTS}'!A1`,
          values: [COST_HEADERS],
        },
        {
          range: `'${SHEETS.VERSIONS}'!A1`,
          values: [VERSION_HEADERS],
        },
        {
          range: `'${SHEETS.SUMMARY}'!A1`,
          values: [["Metric", "Value"]],
        },
      ],
    },
  });

  logger.info("Added headers to spreadsheet");
}

/**
 * Append cost entries to the spreadsheet
 */
export async function appendCostEntries(
  spreadsheetId: string,
  entries: CostEntry[]
): Promise<void> {
  const sheets = getSheetsClient();

  const rows = entries.map(formatCostSheetRow);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${SHEETS.COSTS}'!A:I`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows,
    },
  });

  logger.info(`Appended ${entries.length} cost entries`);
}

/**
 * Append version entries to the spreadsheet
 */
export async function appendVersionEntries(
  spreadsheetId: string,
  entries: VersionSheetRow[]
): Promise<void> {
  const sheets = getSheetsClient();

  const rows = entries.map(formatVersionSheetRow);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${SHEETS.VERSIONS}'!A:H`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows,
    },
  });

  logger.info(`Appended ${entries.length} version entries`);
}

/**
 * Update summary sheet with current totals
 */
export async function updateSummary(
  spreadsheetId: string,
  summary: {
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalOperations: number;
    lastUpdated: string;
  }
): Promise<void> {
  const sheets = getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${SHEETS.SUMMARY}'!A2:B7`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        ["Total Cost (USD)", summary.totalCost.toFixed(4)],
        ["Total Input Tokens", summary.totalInputTokens.toString()],
        ["Total Output Tokens", summary.totalOutputTokens.toString()],
        ["Total Operations", summary.totalOperations.toString()],
        ["Last Updated", summary.lastUpdated],
      ],
    },
  });

  logger.info("Updated summary sheet");
}

/**
 * Get all cost entries from spreadsheet
 */
export async function getCostEntries(
  spreadsheetId: string
): Promise<string[][]> {
  const sheets = getSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${SHEETS.COSTS}'!A2:I`,
  });

  return (response.data.values as string[][]) || [];
}

/**
 * Find existing cost tracking spreadsheet
 */
export async function findCostSpreadsheet(
  name: string,
  folderId?: string
): Promise<string | null> {
  const drive = getDriveClient();

  const query = folderId
    ? `name='${name}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;

  const response = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  return null;
}
