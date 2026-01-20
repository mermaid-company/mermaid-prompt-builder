/**
 * Validation Utility
 *
 * Zod schemas and validation helpers.
 */

import { z } from "zod";

/**
 * BriefingFormData schema - matches the actual form fields
 */
export const BriefingFormDataSchema = z.object({
  // Section 1: Sobre o Negócio
  businessName: z.string().min(1, "Business name is required"),
  productService: z.string().min(1, "Product/service is required"),
  differentials: z.string().default(""),
  salesProcess: z.string().default(""),
  tools: z.string().default(""),

  // Section 2: Sobre o Público-Alvo (arrays)
  idealClient: z.array(z.string()).min(1, "At least one ideal client required"),
  mainDesires: z.array(z.string()).min(1, "At least one desire required"),
  fears: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  journeyMoment: z.array(z.string()).default([]),

  // Section 3: Sobre o Atendimento Ideal
  brandPerception: z.string().min(1, "Brand perception is required"),
  toneOfVoice: z.string().min(1, "Tone of voice is required"),
  mustSayMessages: z.string().default(""),
  internalActions: z.string().default(""),
  neverUse: z.string().default(""),

  // Section 4: Sobre Regras e Automação
  scheduleAdaptation: z.string().min(1, "Schedule adaptation is required"),
  specialConditions: z.string().default(""),
  mandatorySteps: z.string().min(1, "Mandatory steps are required"),
  qualificationCriteria: z.string().default(""),
  documentsFlow: z.string().default(""),

  // Section 5: Objetivo Final
  mainObjective: z.string().min(1, "Main objective is required"),
  minimumResult: z.string().default(""),
});

/**
 * Complete briefing schema
 */
export const BriefingSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  assistantId: z.string().min(1),
  formData: BriefingFormDataSchema,
  createdAt: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Webhook payload schema
 */
export const WebhookPayloadSchema = z.object({
  event: z.enum(["briefing.created", "briefing.updated"]),
  data: BriefingSchema,
  timestamp: z.string(),
});

/**
 * Account config schema - simplified (no per-account API keys)
 */
export const AccountConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  assistants: z.array(z.string()),
  createdAt: z.string(),
  description: z.string().optional(),
  webhookUrl: z.string().optional(),
});

/**
 * Validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Generate a hash for content (for versioning)
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
