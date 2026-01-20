/**
 * Webhook Parser Service
 *
 * Parse and validate webhook payloads.
 */

import type {
  BriefingPayload,
  PipelineBriefingInput,
  WebhookPayload,
} from "@/lib/types";
import { WebhookPayloadSchema, validate } from "@/lib/utils/validation";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("webhook-parser");

/**
 * Parse and validate a webhook payload
 */
export function parseWebhookPayload(body: unknown):
  | {
      success: true;
      payload: WebhookPayload;
    }
  | {
      success: false;
      error: string;
    } {
  const result = validate(WebhookPayloadSchema, body);

  if (!result.success) {
    const errorMessages = result.errors.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");

    logger.error("Webhook payload validation failed", {
      errors: errorMessages,
    });

    return {
      success: false,
      error: `Invalid payload: ${errorMessages}`,
    };
  }

  logger.info("Webhook payload parsed", {
    event: result.data.event,
    briefingId: result.data.data.id,
    accountId: result.data.data.accountId,
  });

  return {
    success: true,
    payload: result.data as WebhookPayload,
  };
}

/**
 * Extract briefing from webhook payload for pipeline processing
 */
export function extractBriefing(
  payload: WebhookPayload
): PipelineBriefingInput {
  return {
    briefing: payload.data,
    accountId: payload.data.accountId,
    assistantId: payload.data.assistantId,
    timestamp: payload.timestamp,
  };
}
