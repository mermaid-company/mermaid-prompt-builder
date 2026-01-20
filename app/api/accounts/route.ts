/**
 * Accounts List Route
 *
 * GET /api/accounts
 * List all available accounts.
 */

import { NextResponse } from "next/server";
import { listAccounts, loadAccountConfig } from "@/lib/services/accounts";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("accounts-route");

export async function GET() {
  try {
    const accountIds = listAccounts();

    const accounts = await Promise.all(
      accountIds.map(async (id) => {
        const config = await loadAccountConfig(id);
        return config
          ? {
              id: config.id,
              name: config.name,
              description: config.description,
              assistantCount: config.assistants.length,
            }
          : null;
      })
    );

    const validAccounts = accounts.filter(Boolean);

    logger.info("Listed accounts", { count: validAccounts.length });

    return NextResponse.json({
      accounts: validAccounts,
      total: validAccounts.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to list accounts", { error: errorMessage });

    return NextResponse.json(
      { error: "Failed to list accounts", message: errorMessage },
      { status: 500 }
    );
  }
}
