/**
 * Anthropic Messages Service
 *
 * Send messages to Claude for prompt generation and analysis.
 * Uses single global ANTHROPIC_API_KEY.
 */

import type {
  MessageParam,
  ContentBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { TokenUsage } from "@/lib/types";
import { getAnthropicClient, DEFAULT_MODEL } from "./client";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("anthropic-messages");

/**
 * Response from a message request
 */
export interface MessageResponse {
  content: string;
  usage: TokenUsage;
  stopReason: string | null;
  model: string;
}

/**
 * Send a message to Claude
 */
export async function sendMessage(params: {
  systemPrompt?: string;
  messages: MessageParam[];
  maxTokens?: number;
  model?: string;
}): Promise<MessageResponse> {
  const client = getAnthropicClient();
  const model = params.model || DEFAULT_MODEL;

  logger.info("Sending message to Claude", {
    model,
    messageCount: params.messages.length,
  });

  const response = await client.messages.create({
    model,
    max_tokens: params.maxTokens || 16384,
    system: params.systemPrompt,
    messages: params.messages,
  });

  const textContent = response.content
    .filter(
      (block): block is ContentBlock & { type: "text" } => block.type === "text"
    )
    .map((block) => block.text)
    .join("\n");

  const usage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: (response.usage as { cache_read_input_tokens?: number })
      .cache_read_input_tokens,
    cacheWriteTokens: (
      response.usage as { cache_creation_input_tokens?: number }
    ).cache_creation_input_tokens,
  };

  logger.info("Message response received", {
    model: response.model,
    stopReason: response.stop_reason,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  return {
    content: textContent,
    usage,
    stopReason: response.stop_reason,
    model: response.model,
  };
}

/**
 * Generate prompt from briefing using PRISMA system
 */
export async function generatePromptFromBriefing(params: {
  briefingContent: string;
  prismaSystemPrompt: string;
}): Promise<MessageResponse> {
  return sendMessage({
    systemPrompt: params.prismaSystemPrompt,
    messages: [
      {
        role: "user",
        content: `Analyze the following briefing and generate a complete assistant prompt using the PRISMA system:

${params.briefingContent}`,
      },
    ],
    maxTokens: 16384,
  });
}

/**
 * Analyze a generated prompt for improvements
 */
export async function analyzePrompt(params: {
  promptContent: string;
  briefingContent: string;
}): Promise<MessageResponse> {
  return sendMessage({
    systemPrompt: `You are an expert prompt engineer. Analyze the provided prompt and identify:
1. Areas that could be clearer or more specific
2. Missing elements based on the briefing
3. Potential ambiguities
4. Suggestions for improvement

Provide specific, actionable feedback.`,
    messages: [
      {
        role: "user",
        content: `## Original Briefing
${params.briefingContent}

## Generated Prompt
${params.promptContent}

Please analyze this prompt and provide detailed improvement suggestions.`,
      },
    ],
    maxTokens: 8192,
  });
}

/**
 * Improve a prompt based on analysis feedback
 */
export async function improvePrompt(params: {
  promptContent: string;
  analysisFeedback: string;
  briefingContent: string;
  prismaSystemPrompt: string;
}): Promise<MessageResponse> {
  return sendMessage({
    systemPrompt: params.prismaSystemPrompt,
    messages: [
      {
        role: "user",
        content: `## Original Briefing
${params.briefingContent}

## Current Prompt
${params.promptContent}

## Analysis Feedback
${params.analysisFeedback}

Based on the analysis feedback, please generate an improved version of the prompt that addresses the identified issues while maintaining the PRISMA system structure.`,
      },
    ],
    maxTokens: 16384,
  });
}
