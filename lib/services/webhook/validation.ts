/**
 * Webhook Validation Service
 *
 * Validates incoming webhook signatures.
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { WebhookValidationResult } from "@/lib/types";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("webhook");

/**
 * Validate webhook signature using HMAC-SHA256
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): WebhookValidationResult {
  if (!signature) {
    return {
      valid: false,
      error: "Missing signature header",
    };
  }

  if (!secret) {
    logger.error("Webhook secret not configured");
    return {
      valid: false,
      error: "Webhook secret not configured",
    };
  }

  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(`sha256=${expectedSignature}`, "utf8");

    // Handle sha256= prefix if present
    const normalizedSignature = signature.startsWith("sha256=")
      ? signature
      : `sha256=${signature}`;
    const normalizedSigBuffer = Buffer.from(normalizedSignature, "utf8");

    if (normalizedSigBuffer.length !== expectedBuffer.length) {
      return {
        valid: false,
        error: "Invalid signature length",
      };
    }

    const valid = timingSafeEqual(normalizedSigBuffer, expectedBuffer);

    if (!valid) {
      logger.warn("Webhook signature mismatch");
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    logger.info("Webhook signature validated");
    return { valid: true };
  } catch (error) {
    logger.error("Webhook validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      valid: false,
      error: "Validation failed",
    };
  }
}

/**
 * Get webhook secret from environment
 */
export function getWebhookSecret(): string | undefined {
  return process.env.WEBHOOK_SECRET;
}

/**
 * Create a webhook signature for testing
 */
export function createWebhookSignature(
  payload: string,
  secret: string
): string {
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `sha256=${signature}`;
}
