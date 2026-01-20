/**
 * Account Registry
 *
 * Manage and load account configurations.
 */

import { readdirSync, existsSync } from "fs";
import { join } from "path";
import type { AccountConfig } from "@/lib/types";
import { AccountConfigSchema, validate } from "@/lib/utils/validation";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("account-registry");

// Account cache
const accountCache = new Map<string, AccountConfig>();

// Accounts directory path
const ACCOUNTS_DIR = join(process.cwd(), "lib/accounts");

/**
 * List all available accounts
 */
export function listAccounts(): string[] {
  if (!existsSync(ACCOUNTS_DIR)) {
    logger.warn("Accounts directory not found", { path: ACCOUNTS_DIR });
    return [];
  }

  const entries = readdirSync(ACCOUNTS_DIR, { withFileTypes: true });
  const accountIds = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  logger.info(`Found ${accountIds.length} accounts`);
  return accountIds;
}

/**
 * Load account configuration
 */
export async function loadAccountConfig(
  accountId: string
): Promise<AccountConfig | null> {
  // Check cache
  if (accountCache.has(accountId)) {
    return accountCache.get(accountId)!;
  }

  const configPath = join(ACCOUNTS_DIR, accountId, "config.ts");

  if (!existsSync(configPath)) {
    logger.warn("Account config not found", { accountId, path: configPath });
    return null;
  }

  try {
    // Dynamic import of the config
    const configModule = await import(`@/lib/accounts/${accountId}/config`);
    const config = configModule.config || configModule.default;

    // Validate
    const result = validate(AccountConfigSchema, config);
    if (!result.success) {
      logger.error("Invalid account config", {
        accountId,
        errors: result.errors.issues,
      });
      return null;
    }

    accountCache.set(accountId, result.data);
    logger.info("Loaded account config", { accountId });
    return result.data;
  } catch (error) {
    logger.error("Failed to load account config", {
      accountId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get the global Anthropic API key
 * Uses a single ANTHROPIC_API_KEY for all accounts
 */
export function getAnthropicApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

/**
 * Validate that the global API key is configured
 */
export function validateApiKeyConfigured(): {
  valid: boolean;
  error?: string;
} {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return {
      valid: false,
      error: "ANTHROPIC_API_KEY environment variable not set",
    };
  }
  return { valid: true };
}

/**
 * Clear account cache
 */
export function clearAccountCache(): void {
  accountCache.clear();
  logger.info("Account cache cleared");
}

/**
 * Check if account exists
 */
export function accountExists(accountId: string): boolean {
  const accountPath = join(ACCOUNTS_DIR, accountId);
  return existsSync(accountPath);
}

/**
 * Get account assistants directory path
 */
export function getAccountAssistantsPath(accountId: string): string {
  return join(ACCOUNTS_DIR, accountId, "assistants");
}
