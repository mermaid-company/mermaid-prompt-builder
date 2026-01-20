/**
 * Prompt Generator Service
 *
 * Generate prompts from briefings using Claude and PRISMA system.
 */

import type {
  Briefing,
  GeneratedPrompt,
  SimplePromptIteration,
  TokenUsage,
} from "@/lib/types";
import {
  generatePromptFromBriefing,
  analyzePrompt,
  improvePrompt,
  logCost,
} from "@/lib/services/anthropic";
import { getPRISMASystemPrompt } from "./prisma-system";
import { createLogger } from "@/lib/utils/logger";
import { generateId } from "@/lib/utils/validation";

const logger = createLogger("prompt-generator");

/**
 * Format briefing as markdown for Claude
 * Uses the new BriefingFormData structure from the actual form
 */
export function formatBriefingAsMarkdown(briefing: Briefing): string {
  const fd = briefing.formData;

  // Helper to format array fields
  const formatArray = (arr: string[]): string =>
    arr.filter((s) => s.trim()).join("\n- ") || "Não informado";

  return `# Briefing: ${fd.businessName}

## 1. Sobre o Negócio
- **Nome do Negócio:** ${fd.businessName}
- **Produto/Serviço:** ${fd.productService}
- **Diferenciais:** ${fd.differentials || "Não informado"}
- **Processo de Venda:** ${fd.salesProcess || "Não informado"}
- **Ferramentas/CRM:** ${fd.tools || "Não informado"}

## 2. Sobre o Público-Alvo
### Cliente Ideal:
- ${formatArray(fd.idealClient)}

### Principais Desejos:
- ${formatArray(fd.mainDesires)}

### Medos/Inseguranças:
- ${formatArray(fd.fears)}

### Objeções Frequentes:
- ${formatArray(fd.objections)}

### Momento da Jornada:
- ${formatArray(fd.journeyMoment)}

## 3. Sobre o Atendimento Ideal
- **Percepção da Marca:** ${fd.brandPerception}
- **Tom de Voz:** ${fd.toneOfVoice}
- **Mensagens Obrigatórias:** ${fd.mustSayMessages || "Não informado"}
- **Ações Internas:** ${fd.internalActions || "Não informado"}
- **NUNCA Utilizar:** ${fd.neverUse || "Não informado"}

## 4. Sobre Regras e Automação
- **Adaptação por Horário:** ${fd.scheduleAdaptation}
- **Condições Especiais:** ${fd.specialConditions || "Não informado"}
- **Etapas Obrigatórias (antes de transferir):** ${fd.mandatorySteps}
- **Critérios de Qualificação:** ${fd.qualificationCriteria || "Não informado"}
- **Fluxo de Documentos:** ${fd.documentsFlow || "Não informado"}

## 5. Objetivo Final
- **Objetivo Principal:** ${fd.mainObjective}
- **Resultado Mínimo Esperado:** ${fd.minimumResult || "Não informado"}
`;
}

/**
 * Generate initial prompt from briefing
 */
export async function generateInitialPrompt(params: {
  briefing: Briefing;
  accountId: string;
}): Promise<{
  prompt: string;
  usage: TokenUsage;
}> {
  const briefingContent = formatBriefingAsMarkdown(params.briefing);
  const prismaSystemPrompt = getPRISMASystemPrompt();

  logger.info("Generating initial prompt", {
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
  });

  const response = await generatePromptFromBriefing({
    briefingContent,
    prismaSystemPrompt,
  });

  // Log cost
  logCost({
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
    operation: "prompt_generation",
    usage: response.usage,
    metadata: { phase: "initial" },
  });

  return {
    prompt: response.content,
    usage: response.usage,
  };
}

/**
 * Analyze a generated prompt
 */
export async function analyzeGeneratedPrompt(params: {
  promptContent: string;
  briefing: Briefing;
  accountId: string;
}): Promise<{
  analysis: string;
  usage: TokenUsage;
}> {
  const briefingContent = formatBriefingAsMarkdown(params.briefing);

  logger.info("Analyzing prompt", {
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
  });

  const response = await analyzePrompt({
    promptContent: params.promptContent,
    briefingContent,
  });

  // Log cost
  logCost({
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
    operation: "prompt_analysis",
    usage: response.usage,
    metadata: { phase: "analysis" },
  });

  return {
    analysis: response.content,
    usage: response.usage,
  };
}

/**
 * Improve a prompt based on analysis
 */
export async function improveGeneratedPrompt(params: {
  promptContent: string;
  analysisFeedback: string;
  briefing: Briefing;
  accountId: string;
  iteration: number;
}): Promise<{
  prompt: string;
  usage: TokenUsage;
}> {
  const briefingContent = formatBriefingAsMarkdown(params.briefing);
  const prismaSystemPrompt = getPRISMASystemPrompt();

  logger.info("Improving prompt", {
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
    iteration: params.iteration,
  });

  const response = await improvePrompt({
    promptContent: params.promptContent,
    analysisFeedback: params.analysisFeedback,
    briefingContent,
    prismaSystemPrompt,
  });

  // Log cost
  logCost({
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
    operation: "prompt_improvement",
    usage: response.usage,
    metadata: { phase: "improvement", iteration: params.iteration },
  });

  return {
    prompt: response.content,
    usage: response.usage,
  };
}

/**
 * Generate prompt with analysis and improvement iteration
 */
export async function generatePromptWithIteration(params: {
  briefing: Briefing;
  accountId: string;
  maxIterations?: number;
}): Promise<GeneratedPrompt> {
  const maxIterations = params.maxIterations || 1;
  const iterations: SimplePromptIteration[] = [];
  let totalUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
  };

  // Step 1: Generate initial prompt
  const { prompt: initialPrompt, usage: initialUsage } =
    await generateInitialPrompt({
      briefing: params.briefing,
      accountId: params.accountId,
    });

  totalUsage.inputTokens += initialUsage.inputTokens;
  totalUsage.outputTokens += initialUsage.outputTokens;

  let currentPrompt = initialPrompt;

  // Step 2: Iterate analysis and improvement
  for (let i = 0; i < maxIterations; i++) {
    // Analyze
    const { analysis, usage: analysisUsage } = await analyzeGeneratedPrompt({
      promptContent: currentPrompt,
      briefing: params.briefing,
      accountId: params.accountId,
    });

    totalUsage.inputTokens += analysisUsage.inputTokens;
    totalUsage.outputTokens += analysisUsage.outputTokens;

    // Improve
    const { prompt: improvedPrompt, usage: improvementUsage } =
      await improveGeneratedPrompt({
        promptContent: currentPrompt,
        analysisFeedback: analysis,
        briefing: params.briefing,
        accountId: params.accountId,
        iteration: i + 1,
      });

    totalUsage.inputTokens += improvementUsage.inputTokens;
    totalUsage.outputTokens += improvementUsage.outputTokens;

    // Record iteration
    iterations.push({
      iterationNumber: i + 1,
      analysis: {
        feedback: analysis,
        timestamp: new Date().toISOString(),
      },
      changes: `Iteration ${i + 1} improvements applied`,
      promptSnapshot: improvedPrompt,
      timestamp: new Date().toISOString(),
    });

    currentPrompt = improvedPrompt;
  }

  const result: GeneratedPrompt = {
    id: generateId("prompt"),
    accountId: params.accountId,
    assistantId: params.briefing.assistantId,
    content: currentPrompt,
    version: "draft",
    createdAt: new Date().toISOString(),
    metadata: {
      briefingId: params.briefing.id,
      iterations: maxIterations,
      model: "claude-opus-4-5-20251101",
    },
    simpleIterations: iterations,
  };

  logger.info("Prompt generation complete", {
    id: result.id,
    iterations: maxIterations,
    totalInputTokens: totalUsage.inputTokens,
    totalOutputTokens: totalUsage.outputTokens,
  });

  return result;
}
