/**
 * Account Types
 *
 * Types for account configuration and management.
 * Account configs are server-only and never exposed to clients.
 *
 * NOTE: Uses a SINGLE global ANTHROPIC_API_KEY for all accounts.
 * No per-account API keys needed.
 */

/**
 * Account metadata (safe for client)
 */
export interface Account {
  /** Account identifier */
  id: string;
  /** Display name */
  name: string;
  /** Number of assistants */
  assistantCount: number;
  /** ISO timestamp when created */
  createdAt: string;
  /** Account status */
  status: "active" | "inactive";
}

/**
 * Full account configuration (server-only)
 * Simplified - no per-account API keys required
 */
export interface AccountConfig {
  /** Account identifier */
  id: string;
  /** Display name */
  name: string;
  /** List of assistant IDs */
  assistants: string[];
  /** ISO timestamp when created */
  createdAt: string;
  /** Optional description */
  description?: string;
  /** Webhook URL for this account (optional) */
  webhookUrl?: string;
}

/**
 * Account registry entry
 */
export interface AccountRegistryEntry {
  /** Account identifier */
  id: string;
  /** Path to config file */
  configPath: string;
  /** Whether account is active */
  active: boolean;
}

/**
 * Account list response
 */
export interface AccountListResponse {
  /** List of accounts */
  accounts: Account[];
  /** Total count */
  total: number;
}
