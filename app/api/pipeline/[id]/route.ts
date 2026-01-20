/**
 * Pipeline Status Route
 *
 * GET /api/pipeline/[id]
 * Get pipeline execution status and results.
 */

import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("pipeline-status-route");

// In-memory pipeline results cache (in production, use a database)
const pipelineResults = new Map<string, unknown>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  logger.info("Pipeline status request", { id });

  const result = pipelineResults.get(id);

  if (!result) {
    return NextResponse.json(
      { error: "Pipeline not found", id },
      { status: 404 }
    );
  }

  return NextResponse.json(result);
}
