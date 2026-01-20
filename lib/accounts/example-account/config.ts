/**
 * Example Account Configuration
 *
 * This is a template account configuration.
 * Copy this folder and customize for each new account.
 *
 * NOTE: Uses global ANTHROPIC_API_KEY - no per-account keys needed.
 */

import type { AccountConfig } from "@/lib/types";

export const config: AccountConfig = {
  id: "example-account",
  name: "Example Account",
  description: "Template account configuration",
  assistants: [],
  createdAt: new Date().toISOString(),
};
