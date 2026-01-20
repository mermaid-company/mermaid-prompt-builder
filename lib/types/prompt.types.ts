/**
 * Prompt Types
 *
 * Types for prompt generation, templates, and injection files.
 */

/**
 * Prompt iteration status
 */
export type IterationStatus = "initial" | "analyzed" | "improved" | "final";

/**
 * Template variable mapping
 */
export interface PromptVariables {
  /** Business name */
  businessName: string;
  /** Product description */
  product: string;
  /** Target audience */
  audience: string;
  /** Tone of voice */
  tone: string;
  /** Required phrases */
  requiredPhrases: string[];
  /** Forbidden terms */
  forbidden: string[];
  /** Primary objective */
  objective: string;
  /** Additional context */
  context?: Record<string, string>;
}

/**
 * PRISMA-based template structure
 */
export interface PromptTemplate {
  /** Template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** System message template */
  systemTemplate: string;
  /** Required variables */
  requiredVariables: string[];
  /** Optional variables */
  optionalVariables: string[];
  /** PRISMA phases included */
  prismaPhases: ("perception" | "context" | "permission")[];
  /** Platform optimization target */
  platform?: string;
}

/**
 * Analysis result from prompt review
 */
export interface PromptAnalysis {
  /** Overall quality score (0-100) */
  qualityScore: number;
  /** PRISMA phase coverage scores */
  phaseCoverage: {
    perception: number;
    context: number;
    permission: number;
  };
  /** Tone consistency score */
  toneConsistency: number;
  /** Identified strengths */
  strengths: string[];
  /** Identified weaknesses */
  weaknesses: string[];
  /** Specific improvement suggestions */
  suggestions: string[];
  /** Ethical compliance check */
  ethicalCompliance: {
    passed: boolean;
    issues: string[];
  };
}

/**
 * Single iteration in prompt generation
 */
export interface PromptIteration {
  /** Iteration number */
  iteration: number;
  /** Status of this iteration */
  status: IterationStatus;
  /** Generated content */
  content: string;
  /** Analysis (if analyzed) */
  analysis?: PromptAnalysis;
  /** Token usage for this iteration */
  tokenUsage: {
    input: number;
    output: number;
  };
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Simplified iteration for generator
 */
export interface SimplePromptIteration {
  /** Iteration number */
  iterationNumber: number;
  /** Analysis feedback */
  analysis: {
    feedback: string;
    timestamp: string;
  };
  /** Changes description */
  changes: string;
  /** Snapshot of prompt at this iteration */
  promptSnapshot: string;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Generated prompt with full metadata
 */
export interface GeneratedPrompt {
  /** Unique identifier */
  id: string;
  /** Account identifier */
  accountId: string;
  /** Assistant identifier */
  assistantId: string;
  /** Version string */
  version: string;
  /** Final prompt content */
  content: string;
  /** All iterations (detailed) */
  iterations?: PromptIteration[];
  /** Simple iterations for generator */
  simpleIterations?: SimplePromptIteration[];
  /** Final analysis */
  finalAnalysis?: PromptAnalysis;
  /** Variables used */
  variables?: PromptVariables;
  /** Template used */
  templateId?: string;
  /** Total token usage */
  totalTokenUsage?: {
    input: number;
    output: number;
  };
  /** Total cost in USD */
  totalCostUsd?: number;
  /** ISO timestamp when created */
  createdAt: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Injection file structure
 */
export interface InjectionFile {
  /** Unique identifier */
  id?: string;
  /** Account identifier */
  accountId: string;
  /** Assistant identifier */
  assistantId: string;
  /** Version string */
  version: string;
  /** File path */
  filePath?: string;
  /** Prompt content */
  promptContent?: string;
  /** System prompt content */
  systemPrompt?: string;
  /** Model configuration */
  modelConfig?: {
    model: string;
    maxTokens: number;
    temperature: number;
    useThinking: boolean;
    thinkingBudget?: number;
  };
  /** Metadata */
  metadata?: {
    generatedAt: string;
    briefingHash: string;
    promptHash: string;
    totalIterations: number;
    finalScore: number;
  };
  /** ISO timestamp */
  createdAt?: string;
  /** Status */
  status?: "pending" | "ready" | "executed";
}

/**
 * Injection execution result
 */
export interface InjectionResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Operation performed */
  operation: "create" | "update";
  /** Assistant ID (if created/updated) */
  assistantId?: string;
  /** Error message (if failed) */
  error?: string;
  /** Token usage */
  tokenUsage?: {
    input: number;
    output: number;
  };
  /** Cost in USD */
  costUsd?: number;
  /** ISO timestamp */
  timestamp: string;
}
