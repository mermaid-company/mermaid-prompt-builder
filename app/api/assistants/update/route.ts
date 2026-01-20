/**
 * Assistant Update Route
 *
 * POST /api/assistants/update
 * Updates an assistant via the MermAId Chat API with the generated prompt.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  updateAssistant,
  parsePromptToMermaidOptions,
  type MermaidAssistantOptions,
} from "@/lib/services/mermaid";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("assistant-update-route");

interface UpdateRequestBody {
  assistantId: string;
  promptContent: string;
  metadata: {
    assistantName: string;
    organizationName: string;
    organizationBusiness: string;
  };
  // Optional: provide full options directly instead of parsing from prompt
  options?: MermaidAssistantOptions;
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateRequestBody = await request.json();

    // Validate required fields
    if (!body.assistantId) {
      return NextResponse.json(
        { error: "assistantId is required" },
        { status: 400 }
      );
    }

    if (!body.promptContent && !body.options) {
      return NextResponse.json(
        { error: "Either promptContent or options is required" },
        { status: 400 }
      );
    }

    logger.info("Updating assistant", {
      assistantId: body.assistantId,
      hasOptions: !!body.options,
      hasPromptContent: !!body.promptContent,
    });

    // Use provided options or parse from prompt content
    const options: MermaidAssistantOptions = body.options
      ? body.options
      : parsePromptToMermaidOptions(body.promptContent, {
          assistantName: body.metadata?.assistantName || "Assistant",
          organizationName: body.metadata?.organizationName || "Organization",
          organizationBusiness:
            body.metadata?.organizationBusiness || "Business",
        });

    // Update assistant via MermAId API
    const result = await updateAssistant(body.assistantId, options);

    if (!result.success) {
      logger.error("Failed to update assistant", { error: result.error });
      return NextResponse.json(
        {
          error: "Failed to update assistant",
          message: result.error,
          assistantId: body.assistantId,
        },
        { status: 500 }
      );
    }

    logger.info("Assistant updated successfully", {
      assistantId: body.assistantId,
    });

    return NextResponse.json({
      success: true,
      message: "Assistant updated successfully",
      assistantId: body.assistantId,
      timestamp: result.timestamp,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error in assistant update route", { error: errorMessage });

    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * GET handler for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/assistants/update",
    methods: ["POST"],
    description: "Update assistant via MermAId API",
    timestamp: new Date().toISOString(),
  });
}
