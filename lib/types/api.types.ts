/**
 * API Types
 *
 * Types for API responses, errors, and common patterns.
 */

/**
 * Generic API response wrapper
 */
export interface APIResponse<T> {
  /** Whether the request succeeded */
  success: boolean;
  /** Response data (if success) */
  data?: T;
  /** Error information (if failed) */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  /** ISO timestamp */
  timestamp: string;
}

/**
 * API error codes
 */
export type APIErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "WEBHOOK_INVALID_SIGNATURE"
  | "WEBHOOK_PARSE_ERROR"
  | "ACCOUNT_NOT_FOUND"
  | "ASSISTANT_NOT_FOUND"
  | "VERSION_NOT_FOUND"
  | "ANTHROPIC_ERROR"
  | "GOOGLE_SHEETS_ERROR"
  | "PIPELINE_ERROR"
  | "INTERNAL_ERROR";

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: APIErrorCode,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "APIError";
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Webhook validation result
 */
export interface WebhookValidationResult {
  /** Whether signature is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  /** Items on current page */
  items: T[];
  /** Pagination metadata */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Pipeline step status
 */
export interface PipelineStep {
  /** Step name */
  name: string;
  /** Step status */
  status: "pending" | "running" | "completed" | "failed";
  /** ISO timestamp */
  timestamp: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Pipeline execution result
 */
export interface PipelineResult {
  /** Pipeline ID */
  id: string;
  /** Overall status */
  status: "pending" | "running" | "completed" | "failed";
  /** Briefing ID */
  briefingId: string;
  /** Account ID */
  accountId: string;
  /** Assistant ID */
  assistantId: string;
  /** Generated prompt (if successful) */
  generatedPrompt?: import("./prompt.types").GeneratedPrompt;
  /** Injection file (if successful) */
  injectionFile?: import("./prompt.types").InjectionFile;
  /** Cost entries */
  costEntries: import("./cost.types").CostEntry[];
  /** Total duration in ms */
  totalDuration: number;
  /** Pipeline steps */
  steps: PipelineStep[];
  /** Error message if failed */
  error?: string;
  /** Completion timestamp */
  completedAt: string;
}
