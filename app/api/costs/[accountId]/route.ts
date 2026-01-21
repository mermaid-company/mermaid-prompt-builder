/**
 * Account-specific Costs API Route
 *
 * GET /api/costs/[accountId] - Get cost details for a specific account
 * Query params:
 *   - days: number of days to look back (default: 30)
 *   - groupBy: 'day' | 'assistant' | 'run' (default: 'day')
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import {
  getDailyCostsByAccount,
  getCostsByAssistant,
  getTotalCostByAccount,
} from "@/lib/services/supabase/repositories";
import { listPipelineRunsWithCosts } from "@/lib/services/supabase/repositories";

const logger = createLogger("api-costs-account");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const groupBy = searchParams.get("groupBy") || "day"; // day | assistant | run

    logger.info("Fetching account costs", { accountId, days, groupBy });

    let data;

    switch (groupBy) {
      case "assistant":
        data = await getCostsByAssistant(accountId);
        break;
      case "run":
        data = await listPipelineRunsWithCosts({
          accountId,
          limit: 100,
        });
        break;
      case "day":
      default:
        data = await getDailyCostsByAccount(accountId, days);
        break;
    }

    // Also get total cost
    const totalCost = await getTotalCostByAccount(accountId);

    return NextResponse.json({
      success: true,
      data,
      summary: {
        accountId,
        totalCost,
        days,
        groupBy,
      },
    });
  } catch (error) {
    const { accountId } = await params;
    logger.error("Failed to fetch account costs", {
      accountId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch account costs",
      },
      { status: 500 }
    );
  }
}
