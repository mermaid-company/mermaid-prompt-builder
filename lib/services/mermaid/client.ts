/**
 * MermAId Chat API Client
 *
 * Client for interacting with the MermAId Chat API to manage assistants.
 * API endpoint: https://api.mermaid.chat/api/assistants/{assistantId}
 */

import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("mermaid-client");

const MERMAID_API_BASE = "https://api.mermaid.chat/api";

/**
 * MermAId Assistant Options (payload structure for update)
 */
export interface MermaidAssistantOptions {
  assistantName: string;
  organizationName: string;
  organizationBusiness: string;
  promptPrelude?: string;
  assistantRole: string;
  assistantPersonality: string;
  organizationInfo: string[];
  promptPostlude?: string;
}

/**
 * MermAId Assistant Response
 */
export interface MermaidAssistantResponse {
  id: string;
  name: string;
  options: MermaidAssistantOptions;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Result of an assistant update operation
 */
export interface MermaidUpdateResult {
  success: boolean;
  assistantId: string;
  message?: string;
  error?: string;
  response?: MermaidAssistantResponse;
  timestamp: string;
}

/**
 * Get MermAId API token from environment
 */
function getMermaidToken(): string {
  const token = process.env.MERMAID_TOKEN;
  if (!token) {
    throw new Error("MERMAID_TOKEN environment variable is not set");
  }
  return token;
}

/**
 * Get assistant configuration from MermAId API
 */
export async function getAssistant(
  assistantId: string
): Promise<MermaidAssistantResponse> {
  const token = getMermaidToken();
  const url = `${MERMAID_API_BASE}/assistants/${assistantId}`;

  logger.info("Fetching assistant from MermAId API", { assistantId });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error("Failed to fetch assistant", {
      status: response.status,
      error: errorText,
    });
    throw new Error(
      `Failed to fetch assistant: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  logger.info("Successfully fetched assistant", { assistantId });

  return data;
}

/**
 * Update assistant via MermAId API
 *
 * This sends a PATCH request to update the assistant's prompt configuration.
 */
export async function updateAssistant(
  assistantId: string,
  options: MermaidAssistantOptions
): Promise<MermaidUpdateResult> {
  const token = getMermaidToken();
  const url = `${MERMAID_API_BASE}/assistants/${assistantId}`;

  logger.info("Updating assistant via MermAId API", { assistantId });

  try {
    const payload = { options };

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Failed to update assistant", {
        status: response.status,
        error: errorText,
      });

      return {
        success: false,
        assistantId,
        error: `API error: ${response.status} - ${errorText}`,
        timestamp: new Date().toISOString(),
      };
    }

    const data = await response.json();
    logger.info("Successfully updated assistant", { assistantId });

    return {
      success: true,
      assistantId,
      message: "Assistant updated successfully",
      response: data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error updating assistant", { error: errorMessage });

    return {
      success: false,
      assistantId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Parse generated prompt content into MermAId assistant options
 *
 * This transforms the generated prompt into the MermAId API format.
 * The prompt is typically a markdown document that needs to be parsed
 * into the structured fields expected by MermAId.
 */
export function parsePromptToMermaidOptions(
  promptContent: string,
  metadata: {
    assistantName: string;
    organizationName: string;
    organizationBusiness: string;
  }
): MermaidAssistantOptions {
  // The generated prompt is the full system prompt content
  // For MermAId, we split it into:
  // - assistantRole: The first paragraph describing what the assistant is
  // - assistantPersonality: Personality traits and communication style
  // - organizationInfo: Array of knowledge sections
  // - promptPostlude: Any rules, flows, or guidelines

  // Simple parsing strategy: use the whole prompt as the postlude
  // since it contains all the structured information

  return {
    assistantName: metadata.assistantName,
    organizationName: metadata.organizationName,
    organizationBusiness: metadata.organizationBusiness,
    promptPrelude: "",
    assistantRole: `Assistente virtual de ${metadata.organizationName}`,
    assistantPersonality:
      "Comunicativo, prestativo e focado em ajudar o cliente",
    organizationInfo: [],
    promptPostlude: promptContent,
  };
}
