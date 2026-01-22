export const dynamic = "force-dynamic";
/**
 * Global Costs API Route
 *
 * GET /api/costs - Get cost summary across all accounts
 * Query params:
 *   - days: number of days to look back (default: 30)
 *   - accountId: filter by account (optional)
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import {
  listPipelineRunsWithCosts,
  getCostSummaryByAccount,
  getCostSummaryByAssistant,
} from "@/lib/services/supabase/repositories";

const logger = createLogger("api-costs");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const days = parseInt(searchParams.get("days") || "30", 10);
    const groupBy = searchParams.get("groupBy") || "account"; // account | assistant | run

    logger.info("Fetching cost summary", { accountId, days, groupBy });

    let data;

    switch (groupBy) {
      case "assistant":
        data = await getCostSummaryByAssistant(accountId || undefined);
        break;
      case "run":
        data = await listPipelineRunsWithCosts({
          accountId: accountId || undefined,
          limit: 100,
        });
        break;
      case "account":
      default:
        data = await getCostSummaryByAccount(days);
        break;
    }

    return NextResponse.json({
      success: true,
      data,
      params: { accountId, days, groupBy },
    });
  } catch (error) {
    logger.error("Failed to fetch costs", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch costs",
      },
      { status: 500 },
    );
  }
}
