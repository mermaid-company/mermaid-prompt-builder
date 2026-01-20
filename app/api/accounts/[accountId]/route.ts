/**
 * Account Detail Route
 *
 * GET /api/accounts/[accountId]
 * Get account details and assistants.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  loadAccountConfig,
  validateApiKeyConfigured,
  getAccountAssistantsPath,
} from "@/lib/services/accounts";
import { createLogger } from "@/lib/utils/logger";
import { readdirSync, existsSync } from "fs";

const logger = createLogger("account-detail-route");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params;

  try {
    const config = await loadAccountConfig(accountId);

    if (!config) {
      return NextResponse.json(
        { error: "Account not found", accountId },
        { status: 404 }
      );
    }

    // Validate global API key is configured
    const credentialsValid = validateApiKeyConfigured();

    // List assistants with versions
    const assistantsPath = getAccountAssistantsPath(accountId);
    const assistants: Array<{
      id: string;
      versions: string[];
    }> = [];

    if (existsSync(assistantsPath)) {
      const assistantDirs = readdirSync(assistantsPath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const assistantId of assistantDirs) {
        const versionPath = `${assistantsPath}/${assistantId}`;
        const versions = existsSync(versionPath)
          ? readdirSync(versionPath, { withFileTypes: true })
              .filter((d) => d.isDirectory() && d.name.startsWith("v"))
              .map((d) => d.name)
          : [];

        assistants.push({
          id: assistantId,
          versions,
        });
      }
    }

    logger.info("Loaded account details", { accountId });

    return NextResponse.json({
      id: config.id,
      name: config.name,
      description: config.description,
      credentialsConfigured: credentialsValid.valid,
      assistants,
      createdAt: config.createdAt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to load account", { accountId, error: errorMessage });

    return NextResponse.json(
      { error: "Failed to load account", message: errorMessage },
      { status: 500 }
    );
  }
}
