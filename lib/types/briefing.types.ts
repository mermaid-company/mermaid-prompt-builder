/**
 * Briefing Types
 *
 * Types for client briefings received via webhook from the form-for-n8n form.
 * Briefings contain business information used to generate assistant prompts.
 *
 * Field names match exactly with the form at:
 * https://github.com/mermaid-company/form-for-n8n
 */

/**
 * FormData structure - matches the actual briefing form exactly
 * This is the raw data structure submitted by the form.
 */
export interface BriefingFormData {
  // Section 1: Sobre o Negócio
  /** 1.1. Qual é o nome do seu negócio? */
  businessName: string;
  /** 1.2. O que você vende (produto ou serviço)? */
  productService: string;
  /** 1.3. Quais são os diferenciais da sua empresa? */
  differentials: string;
  /** 1.4. Qual é o seu processo de venda hoje (passo a passo)? */
  salesProcess: string;
  /** 1.5. Você já utiliza alguma ferramenta de atendimento ou CRM? */
  tools: string;

  // Section 2: Sobre o Público-Alvo (arrays - user can add multiple)
  /** 2.1. Quem é seu cliente ideal? */
  idealClient: string[];
  /** 2.2. Principais desejos ao procurar a solução */
  mainDesires: string[];
  /** 2.3. Maiores medos ou inseguranças */
  fears: string[];
  /** 2.4. Objeções e perguntas frequentes */
  objections: string[];
  /** 2.5. Momento da jornada em que entram em contato */
  journeyMoment: string[];

  // Section 3: Sobre o Atendimento Ideal
  /** 3.1. Como a marca deve ser percebida no atendimento */
  brandPerception: string;
  /** 3.2. Qual deve ser o tom de voz da comunicação? */
  toneOfVoice: string;
  /** 3.3. Mensagens ou frases que devem ser sempre ditas */
  mustSayMessages: string;
  /** 3.4. Ações internas que a equipe deve executar */
  internalActions: string;
  /** 3.5. Mensagens, comportamentos ou termos que NUNCA devem ser utilizados */
  neverUse: string;

  // Section 4: Sobre Regras e Automação
  /** 4.1. O atendimento precisa ser adaptado por horário? */
  scheduleAdaptation: string;
  /** 4.2. Condições especiais para finais de semana, feriados ou plantões? */
  specialConditions: string;
  /** 4.3. Etapas obrigatórias antes de transferir para um humano */
  mandatorySteps: string;
  /** 4.4. O que precisa ser registrado para o lead ser considerado qualificado? */
  qualificationCriteria: string;
  /** 4.5. Fluxo de documentos, proposta, simulação ou material */
  documentsFlow: string;

  // Section 5: Objetivo Final
  /** 5.1. Qual é o principal objetivo do seu atendimento? */
  mainObjective: string;
  /** 5.2. Existe algum resultado mínimo esperado por atendimento? */
  minimumResult: string;
}

/**
 * Complete briefing structure - wraps FormData with metadata
 */
export interface Briefing {
  /** Unique briefing identifier (generated) */
  id: string;
  /** Account this briefing belongs to */
  accountId: string;
  /** Assistant this briefing is for */
  assistantId: string;
  /** The actual form data */
  formData: BriefingFormData;
  /** ISO timestamp when created */
  createdAt: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Webhook payload wrapper for briefing
 */
export interface BriefingPayload {
  /** Event type */
  event: "briefing.created" | "briefing.updated";
  /** The briefing data */
  data: Briefing;
  /** ISO timestamp of the event */
  timestamp: string;
}

/**
 * Alias for incoming webhook data
 */
export type WebhookPayload = BriefingPayload;

/**
 * Simplified briefing payload for pipeline
 */
export interface PipelineBriefingInput {
  /** The briefing data */
  briefing: Briefing;
  /** Account ID */
  accountId: string;
  /** Assistant ID */
  assistantId: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Expected webhook headers
 */
export interface WebhookHeaders {
  /** Webhook signature for validation */
  "x-webhook-signature": string;
  /** Content type (should be application/json) */
  "content-type": string;
}
