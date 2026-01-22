export const dynamic = "force-dynamic";
/**
 * Pipeline Runs API Route
 *
 * GET /api/pipeline-runs - List pipeline runs with cost breakdowns
 * Query params:
 *   - accountId: filter by account (optional)
 *   - assistantId: filter by assistant (optional)
 *   - status: filter by status (optional)
 *   - limit: max results (default: 50)
 *   - offset: pagination offset (default: 0)
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import {
  listPipelineRuns,
  listPipelineRunsWithCosts,
} from "@/lib/services/supabase/repositories";

const logger = createLogger("api-pipeline-runs");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") || undefined;
    const assistantId = searchParams.get("assistantId") || undefined;
    const status = searchParams.get("status") as
      | "running"
      | "completed"
      | "failed"
      | undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const withCosts = searchParams.get("withCosts") === "true";

    logger.info("Listing pipeline runs", {
      accountId,
      assistantId,
      status,
      limit,
      offset,
      withCosts,
    });

    let data;

    if (withCosts) {
      // Use the cost breakdown view
      data = await listPipelineRunsWithCosts({
        accountId,
        assistantId,
        limit,
      });
    } else {
      // Use the basic pipeline runs table
      data = await listPipelineRuns({
        accountId,
        assistantId,
        status,
        limit,
        offset,
      });
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        limit,
        offset,
        count: data.length,
      },
    });
  } catch (error) {
    logger.error("Failed to list pipeline runs", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to list pipeline runs",
      },
      { status: 500 },
    );
  }
}
