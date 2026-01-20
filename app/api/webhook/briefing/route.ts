/**
 * Webhook Briefing Route
 *
 * POST /api/webhook/briefing
 * Receives briefings and triggers the prompt generation pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  validateWebhookSignature,
  getWebhookSecret,
  parseWebhookPayload,
  extractBriefing,
} from "@/lib/services/webhook";
import { runPipeline } from "@/lib/services/pipeline";
import { createLogger } from "@/lib/utils/logger";
import { generateId } from "@/lib/utils/validation";

const logger = createLogger("webhook-route");

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get raw body for signature validation
    const body = await request.text();
    const signature = request.headers.get("x-webhook-signature") || "";
    const testMode = request.headers.get("x-test-mode") === "true";

    // Skip signature validation in test mode (for local testing)
    if (!testMode) {
      // Validate signature
      const webhookSecret = getWebhookSecret();
      if (!webhookSecret) {
        logger.error("Webhook secret not configured");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }

      const validationResult = validateWebhookSignature(
        body,
        signature,
        webhookSecret
      );
      if (!validationResult.valid) {
        logger.warn("Webhook signature validation failed", {
          error: validationResult.error,
        });
        return NextResponse.json(
          { error: "Invalid signature", message: validationResult.error },
          { status: 401 }
        );
      }
    } else {
      logger.info("Test mode enabled, skipping signature validation");
    }

    // Parse payload
    const payload = JSON.parse(body);

    // In test mode, the payload is: { accountId, assistantId, formData }
    // We need to wrap it as a proper briefing structure
    const normalizedPayload =
      testMode && !payload.event
        ? {
            event: "briefing.created" as const,
            timestamp: new Date().toISOString(),
            data: {
              id: generateId("briefing"),
              accountId: payload.accountId,
              assistantId: payload.assistantId,
              formData: payload.formData,
              createdAt: new Date().toISOString(),
            },
          }
        : payload;

    const parseResult = parseWebhookPayload(normalizedPayload);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid payload", message: parseResult.error },
        { status: 400 }
      );
    }

    // Extract briefing
    const briefingPayload = extractBriefing(parseResult.payload);

    logger.info("Webhook received", {
      event: parseResult.payload.event,
      accountId: briefingPayload.accountId,
      assistantId: briefingPayload.assistantId,
      briefingId: briefingPayload.briefing.id,
    });

    // Run pipeline
    const pipelineResult = await runPipeline(briefingPayload);

    const duration = Date.now() - startTime;

    if (pipelineResult.status === "failed") {
      logger.error("Pipeline failed", {
        error: pipelineResult.error,
        duration,
      });
      return NextResponse.json(
        {
          error: "Pipeline failed",
          message: pipelineResult.error,
          pipelineId: pipelineResult.id,
          steps: pipelineResult.steps,
        },
        { status: 500 }
      );
    }

    logger.info("Pipeline completed", {
      pipelineId: pipelineResult.id,
      duration,
      injectionFile: pipelineResult.injectionFile?.filePath,
    });

    return NextResponse.json({
      success: true,
      pipelineId: pipelineResult.id,
      status: pipelineResult.status,
      injectionFile: pipelineResult.injectionFile?.filePath,
      version: pipelineResult.injectionFile?.version,
      steps: pipelineResult.steps,
      totalDuration: pipelineResult.totalDuration,
      // Include prompt content for UI display
      prompt: pipelineResult.generatedPrompt
        ? {
            content: pipelineResult.generatedPrompt.content,
            version: pipelineResult.injectionFile?.version || "v1",
            accountId: briefingPayload.accountId,
            assistantId: briefingPayload.assistantId,
            createdAt: new Date().toISOString(),
            iterations:
              pipelineResult.generatedPrompt.simpleIterations?.length || 1,
          }
        : undefined,
      costSummary: {
        operations: pipelineResult.costEntries.length,
        totalCost: pipelineResult.costEntries.reduce(
          (sum, c) => sum + c.costUsd,
          0
        ),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Webhook processing error", { error: errorMessage });

    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Health check for the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhook/briefing",
    methods: ["POST"],
    timestamp: new Date().toISOString(),
  });
}
