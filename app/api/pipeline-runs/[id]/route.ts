/**
 * Single Pipeline Run API Route
 *
 * GET /api/pipeline-runs/[id] - Get a single pipeline run with full details
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";
import {
  getPipelineRunById,
  getPipelineRunWithCosts,
  listStepsByPipelineRun,
  getCostEntriesByPipelineRun,
} from "@/lib/services/supabase/repositories";

const logger = createLogger("api-pipeline-run");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    logger.info("Fetching pipeline run", { id });

    // Get the pipeline run
    const pipelineRun = await getPipelineRunById(id);

    if (!pipelineRun) {
      return NextResponse.json(
        {
          success: false,
          error: "Pipeline run not found",
        },
        { status: 404 }
      );
    }

    // Get cost breakdown
    const costBreakdown = await getPipelineRunWithCosts(id);

    // Get steps
    const steps = await listStepsByPipelineRun(id);

    // Get detailed cost entries
    const costEntries = await getCostEntriesByPipelineRun(id);

    return NextResponse.json({
      success: true,
      data: {
        ...pipelineRun,
        costBreakdown,
        steps,
        costEntries,
      },
    });
  } catch (error) {
    const { id } = await params;
    logger.error("Failed to fetch pipeline run", {
      id,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch pipeline run",
      },
      { status: 500 }
    );
  }
}
