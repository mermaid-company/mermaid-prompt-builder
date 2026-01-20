/**
 * Assistant Types
 *
 * Types for Claude assistant configuration and management.
 */

/**
 * Operations that can be performed on an assistant
 */
export type AssistantOperation = "create" | "update" | "get" | "delete";

/**
 * Assistant status
 */
export type AssistantStatus = "active" | "draft" | "archived";

/**
 * Claude model identifiers
 */
export type ClaudeModel =
  | "claude-opus-4-5-20251101"
  | "claude-sonnet-4-20250514"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022";

/**
 * Assistant version metadata
 */
export interface AssistantVersion {
  /** Version number (e.g., "v1", "v2") */
  version: string;
  /** ISO timestamp when created */
  createdAt: string;
  /** Hash of the briefing used */
  briefingHash: string;
  /** Hash of the generated prompt */
  promptHash: string;
  /** Status of this version */
  status: "draft" | "final";
  /** Path to the prompt file */
  promptPath: string;
  /** Path to the injection file */
  injectionPath: string;
}

/**
 * Local assistant configuration
 */
export interface AssistantConfig {
  /** Assistant identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Claude model to use */
  model: ClaudeModel;
  /** Maximum tokens for responses */
  maxTokens: number;
  /** Temperature setting (0-1) */
  temperature: number;
  /** Whether to use extended thinking */
  useThinking: boolean;
  /** Thinking budget tokens (if useThinking is true) */
  thinkingBudget?: number;
  /** Current active version */
  activeVersion: string;
  /** All versions */
  versions: AssistantVersion[];
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
}

/**
 * Assistant data for API responses (safe for client)
 */
export interface Assistant {
  /** Assistant identifier */
  id: string;
  /** Account identifier */
  accountId: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Claude model */
  model: ClaudeModel;
  /** Current status */
  status: AssistantStatus;
  /** Active version */
  activeVersion: string;
  /** Version count */
  versionCount: number;
  /** ISO timestamp when created */
  createdAt: string;
  /** ISO timestamp when last updated */
  updatedAt: string;
}

/**
 * Assistant creation request
 */
export interface CreateAssistantRequest {
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Claude model to use */
  model?: ClaudeModel;
  /** Initial prompt content */
  prompt?: string;
}

/**
 * Assistant update request
 */
export interface UpdateAssistantRequest {
  /** New display name */
  name?: string;
  /** New description */
  description?: string;
  /** New model */
  model?: ClaudeModel;
  /** New prompt content (creates new version) */
  prompt?: string;
  /** Max tokens */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
}
