/**
 * Anthropic Client Factory
 *
 * Creates and configures Anthropic SDK clients.
 * Uses a single global ANTHROPIC_API_KEY for all accounts.
 */

import Anthropic from "@anthropic-ai/sdk";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("anthropic-client");

// Single cached client instance
let cachedClient: Anthropic | null = null;
let cachedAdminClient: Anthropic | null = null;

/**
 * Get the global Anthropic client
 * Uses the single ANTHROPIC_API_KEY for all accounts
 */
export function getAnthropicClient(): Anthropic {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set.");
  }

  logger.info("Creating Anthropic client");

  cachedClient = new Anthropic({
    apiKey,
  });

  return cachedClient;
}

/**
 * Get Anthropic Admin client for usage tracking
 */
export function getAnthropicAdminClient(): Anthropic {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY;

  if (!adminKey) {
    throw new Error("ANTHROPIC_ADMIN_API_KEY environment variable is not set.");
  }

  logger.info("Creating Anthropic Admin client");

  cachedAdminClient = new Anthropic({
    apiKey: adminKey,
  });

  return cachedAdminClient;
}

/**
 * Clear client cache (useful for testing)
 */
export function clearClientCache(): void {
  cachedClient = null;
  cachedAdminClient = null;
  logger.info("Client cache cleared");
}

/**
 * Default model for all operations
 */
export const DEFAULT_MODEL = "claude-opus-4-5-20251101" as const;
