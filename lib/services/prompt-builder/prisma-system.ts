/**
 * PRISMA System Configuration
 *
 * Load and manage the PRISMA system prompt template.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("prisma-system");

// Default PRISMA system path
const DEFAULT_PRISMA_PATH = "docs/prisma-system.xml";

/**
 * Simplified PRISMA phase for internal use
 */
interface SimplePRISMAPhase {
  id: string;
  name: string;
  description: string;
  signals: Array<{ id: string; description: string }>;
  template: string;
}

/**
 * Simplified PRISMA system for internal use
 */
interface SimplePRISMASystem {
  name: string;
  version: string;
  description: string;
  phases: SimplePRISMAPhase[];
  rawContent: string;
}

/**
 * Load PRISMA system from XML file
 */
export function loadPRISMASystem(customPath?: string): SimplePRISMASystem {
  const filePath = customPath || join(process.cwd(), DEFAULT_PRISMA_PATH);

  if (!existsSync(filePath)) {
    logger.warn("PRISMA system file not found, using default structure", {
      path: filePath,
    });
    return getDefaultPRISMASystem();
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    logger.info("Loaded PRISMA system from file", { path: filePath });
    return parsePRISMAXML(content);
  } catch (error) {
    logger.error("Failed to load PRISMA system", {
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultPRISMASystem();
  }
}

/**
 * Parse PRISMA XML content
 */
function parsePRISMAXML(content: string): SimplePRISMASystem {
  // Basic XML parsing - extract key sections
  const system: SimplePRISMASystem = {
    name: "PRISMA",
    version: "1.0",
    description:
      extractXMLContent(content, "description") ||
      "PRISMA Prompt Generation System",
    phases: [],
    rawContent: content,
  };

  // Extract phases
  const phaseMatches = content.matchAll(/<phase[^>]*>([\s\S]*?)<\/phase>/g);
  for (const match of phaseMatches) {
    const phaseContent = match[1];
    const phase: SimplePRISMAPhase = {
      id: extractXMLAttribute(match[0], "id") || "unknown",
      name: extractXMLContent(phaseContent, "name") || "Unknown Phase",
      description: extractXMLContent(phaseContent, "description") || "",
      signals: extractSignals(phaseContent),
      template: extractXMLContent(phaseContent, "template") || "",
    };
    system.phases.push(phase);
  }

  // If no phases found, use the whole content as a template
  if (system.phases.length === 0) {
    system.phases.push({
      id: "main",
      name: "Main System",
      description: "Complete PRISMA system prompt",
      signals: [],
      template: content,
    });
  }

  return system;
}

/**
 * Extract content from XML tags
 */
function extractXMLContent(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract attribute from XML tag
 */
function extractXMLAttribute(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}=["']([^"']+)["']`, "i");
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract signals from phase content
 */
function extractSignals(phaseContent: string): Array<{
  id: string;
  description: string;
}> {
  const signals: Array<{ id: string; description: string }> = [];
  const signalMatches = phaseContent.matchAll(
    /<signal[^>]*>([\s\S]*?)<\/signal>/g
  );

  for (const match of signalMatches) {
    signals.push({
      id: extractXMLAttribute(match[0], "id") || `signal_${signals.length}`,
      description: match[1].trim(),
    });
  }

  return signals;
}

/**
 * Get default PRISMA system structure
 */
function getDefaultPRISMASystem(): SimplePRISMASystem {
  return {
    name: "PRISMA",
    version: "1.0",
    description:
      "PRISMA - Prompt Response for Intelligent System Messaging Architecture",
    phases: [
      {
        id: "perception",
        name: "Perception Mirror",
        description: "Reflect understanding of the user context",
        signals: [
          { id: "context", description: "User context and background" },
          { id: "needs", description: "Identified user needs" },
        ],
        template:
          "## Perception Mirror\nUnderstand and reflect the user's context...",
      },
      {
        id: "context",
        name: "Context Reframe",
        description: "Reframe the context for optimal response",
        signals: [
          { id: "reframe", description: "New perspective on the situation" },
          { id: "insights", description: "Key insights from reframing" },
        ],
        template: "## Context Reframe\nReframe the understanding...",
      },
      {
        id: "permission",
        name: "Permission Grant",
        description: "Grant permission for action",
        signals: [
          { id: "action", description: "Recommended actions" },
          { id: "authority", description: "Permission and authority" },
        ],
        template:
          "## Permission Grant\nGrant permission for the recommended actions...",
      },
    ],
    rawContent: "",
  };
}

/**
 * Get the PRISMA system prompt for Claude
 */
export function getPRISMASystemPrompt(system?: SimplePRISMASystem): string {
  const prisma = system || loadPRISMASystem();

  if (prisma.rawContent) {
    return `You are an expert prompt engineer using the PRISMA system. Use the following system to generate high-quality assistant prompts:

${prisma.rawContent}

When generating prompts, apply all phases of the PRISMA system to create comprehensive, effective assistant prompts.`;
  }

  // Build from phases
  const phaseDescriptions = prisma.phases
    .map(
      (phase) => `### ${phase.name}\n${phase.description}\n${phase.template}`
    )
    .join("\n\n");

  return `You are an expert prompt engineer using the PRISMA system. 

## PRISMA System: ${prisma.description}

${phaseDescriptions}

When generating prompts, apply all phases of the PRISMA system to create comprehensive, effective assistant prompts.`;
}
