/**
 * PRISMA System Types
 *
 * Types for the PRISMA prompt engineering framework.
 * Based on the 3-phase perception-context-permission model.
 */

/**
 * PRISMA phase identifiers
 */
export type PRISMAPhase = "perception" | "context" | "permission";

/**
 * Signal categories for perception phase
 */
export type PerceptionCategory =
  | "identity"
  | "history"
  | "capability"
  | "comparison";

/**
 * Signal categories for context phase
 */
export type ContextCategory = "industry" | "cultural" | "temporal" | "economic";

/**
 * Signal categories for permission phase
 */
export type PermissionCategory =
  | "deservedness"
  | "fear"
  | "validation"
  | "perfectionism";

/**
 * Pattern signal detected in briefing
 */
export interface PRISMASignal {
  /** Category of the signal */
  category: PerceptionCategory | ContextCategory | PermissionCategory;
  /** Pattern text */
  pattern: string;
  /** Detected instance from briefing */
  instance?: string;
}

/**
 * Response template for a signal
 */
export interface PRISMATemplate {
  /** Template name */
  name: string;
  /** Template text */
  text: string;
  /** Variables to replace */
  variables: string[];
}

/**
 * Cognitive technique for cognitive load management
 */
export interface CognitiveTechnique {
  /** Technique name */
  name: string;
  /** Description */
  description: string;
}

/**
 * Intervention sequence steps
 */
export interface InterventionSequence {
  /** Sequence name */
  name: string;
  /** Steps in order */
  steps: string[];
}

/**
 * Platform optimization configuration
 */
export interface PlatformOptimization {
  /** Platform name */
  name: string;
  /** Attention window description */
  attentionWindow: string;
  /** Content structure */
  structure: Record<string, string>;
  /** Hook types */
  hookTypes?: string[];
  /** Example patterns */
  examples?: string[];
}

/**
 * Cognitive bias pattern
 */
export interface CognitiveBiasPattern {
  /** Pattern name */
  name: string;
  /** Pattern text */
  text: string;
}

/**
 * Ethical guardrail
 */
export interface EthicalGuardrail {
  /** Category */
  category: "consent" | "truth" | "dependency" | "manipulation";
  /** Rules */
  rules: string[];
}

/**
 * Quality metric
 */
export interface QualityMetric {
  /** Metric name */
  name: string;
  /** Expected value or range */
  expected: string;
}

/**
 * Full PRISMA system configuration
 */
export interface PRISMASystem {
  /** Version */
  version: string;
  /** Central directive */
  centralDirective: string;
  /** Operational principles */
  operationalPrinciples: string[];
  /** Neural architecture */
  neuralArchitecture: {
    predictionProcessing: {
      predictiveCoding: string;
      predictionErrorExploitation: string;
      memoryReconsolidation: string;
    };
    cognitiveLoadManagement: {
      principle: string;
      techniques: CognitiveTechnique[];
    };
    mirrorNeuronTriggers: string[];
    somaticMarkers: {
      physicalAnchors: string[];
      linguisticTriggers: string[];
    };
  };
  /** Prediction layers */
  predictionLayers: {
    self: { sublayers: string[] };
    social: { sublayers: string[] };
    authority: { sublayers: string[] };
    temporal: { sublayers: string[] };
    competence: { sublayers: string[] };
  };
  /** Intervention sequences */
  interventionSequences: InterventionSequence[];
  /** Phase 1: Perception Mirror */
  perceptionMirror: {
    signals: PRISMASignal[];
    templates: PRISMATemplate[];
  };
  /** Phase 2: Context Reframe */
  contextReframe: {
    signals: PRISMASignal[];
    contextShifts: PRISMATemplate[];
  };
  /** Phase 3: Permission Grant */
  permissionGrant: {
    signals: PRISMASignal[];
    formulas: PRISMATemplate[];
  };
  /** Platform optimizations */
  platformOptimizations: PlatformOptimization[];
  /** Cognitive bias patterns */
  cognitiveBiasPatterns: CognitiveBiasPattern[];
  /** Temporal distortions */
  temporalDistortions: CognitiveBiasPattern[];
  /** Identity reconsolidation patterns */
  identityReconsolidation: CognitiveBiasPattern[];
  /** Ethical guardrails */
  ethicalGuardrails: EthicalGuardrail[];
  /** Quality metrics */
  qualityMetrics: QualityMetric[];
}

/**
 * PRISMA output for a specific briefing
 */
export interface PRISMAOutput {
  /** Detected signals from briefing */
  detectedSignals: PRISMASignal[];
  /** Generated perception mirror content */
  perceptionContent: string;
  /** Generated context reframe content */
  contextContent: string;
  /** Generated permission grant content */
  permissionContent: string;
  /** Platform-specific optimizations applied */
  platformOptimizations?: string;
  /** Ethical compliance check */
  ethicalCheck: {
    passed: boolean;
    issues: string[];
  };
}
