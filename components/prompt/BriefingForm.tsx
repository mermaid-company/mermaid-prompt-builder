/**
 * Briefing Form Component
 *
 * Form for manually submitting briefings for testing.
 * Matches the structure from form-for-n8n/components/briefing-form.tsx
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { BriefingFormData } from "@/lib/types";

interface BriefingFormProps {
  onSubmit: (briefing: BriefingSubmitData) => Promise<void>;
}

interface BriefingSubmitData {
  accountId: string;
  assistantId: string;
  formData: BriefingFormData;
}

const defaultFormData: BriefingFormData = {
  // Section 1: Sobre o Negócio
  businessName: "Empresa Exemplo",
  productService: "Soluções de software para pequenas empresas",
  differentials: "Suporte 24/7, Fácil integração, Preços acessíveis",
  salesProcess: "Demo → Trial → Compra → Onboarding",
  tools: "HubSpot",

  // Section 2: Sobre o Público-Alvo (arrays)
  idealClient: ["Donos de pequenas empresas que buscam otimizar operações"],
  mainDesires: ["Economizar tempo", "Reduzir custos", "Crescer o negócio"],
  fears: ["Implementação complexa", "Custos escondidos"],
  objections: ["Muito caro", "Não tenho tempo para aprender"],
  journeyMoment: ["Descoberta - comparando soluções"],

  // Section 3: Sobre o Atendimento Ideal
  brandPerception: "Prestativa, profissional, inovadora",
  toneOfVoice: "Amigável mas profissional, orientado a soluções",
  mustSayMessages: "Como posso ajudar você hoje?",
  internalActions: "Registrar todas as interações no CRM",
  neverUse:
    "Nunca mencionar concorrentes pelo nome. NUNCA fazer promessas de resultado.",

  // Section 4: Sobre Regras e Automação
  scheduleAdaptation: "Segunda a Sexta 9h-18h",
  specialConditions: "Fora do horário, mensagem automática de retorno",
  mandatorySteps:
    "Coletar nome, email e resumo da necessidade antes de transferir",
  qualificationCriteria: "Orçamento > R$500/mês, equipe > 5 pessoas",
  documentsFlow: "Enviar proposta comercial após qualificação",

  // Section 5: Objetivo Final
  mainObjective: "Qualificar leads e agendar demonstrações do produto",
  minimumResult: "Nome, email e interesse do lead registrado",
};

export function BriefingForm({ onSubmit }: BriefingFormProps) {
  const [accountId, setAccountId] = useState("example-account");
  const [assistantId, setAssistantId] = useState("test-assistant");
  const [formData, setFormData] = useState<BriefingFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState(
    JSON.stringify(
      {
        accountId: "example-account",
        assistantId: "test-assistant",
        formData: defaultFormData,
      },
      null,
      2
    )
  );

  const updateField = (
    field: keyof BriefingFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = jsonMode
        ? JSON.parse(jsonText)
        : { accountId, assistantId, formData };
      await onSubmit(data);
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Test Briefing</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setJsonMode(!jsonMode);
            if (!jsonMode) {
              setJsonText(
                JSON.stringify({ accountId, assistantId, formData }, null, 2)
              );
            }
          }}
        >
          {jsonMode ? "Modo Formulário" : "Modo JSON"}
        </Button>
      </div>

      {jsonMode ? (
        <div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full h-96 p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg"
          />
        </div>
      ) : (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Account & Assistant */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Account ID
              </label>
              <input
                type="text"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Assistant ID
              </label>
              <input
                type="text"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>

          {/* Section 1: Sobre o Negócio */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold px-2">
              1. Sobre o Negócio
            </legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  1.1 Nome do Negócio *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  1.2 Produto/Serviço *
                </label>
                <textarea
                  value={formData.productService}
                  onChange={(e) =>
                    updateField("productService", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  1.3 Diferenciais
                </label>
                <textarea
                  value={formData.differentials}
                  onChange={(e) => updateField("differentials", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  1.4 Processo de Venda
                </label>
                <textarea
                  value={formData.salesProcess}
                  onChange={(e) => updateField("salesProcess", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  1.5 Ferramentas/CRM
                </label>
                <input
                  type="text"
                  value={formData.tools}
                  onChange={(e) => updateField("tools", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Público-Alvo */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold px-2">
              2. Sobre o Público-Alvo
            </legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  2.1 Cliente Ideal * (um por linha)
                </label>
                <textarea
                  value={formData.idealClient.join("\n")}
                  onChange={(e) =>
                    updateField(
                      "idealClient",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  2.2 Principais Desejos * (um por linha)
                </label>
                <textarea
                  value={formData.mainDesires.join("\n")}
                  onChange={(e) =>
                    updateField(
                      "mainDesires",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  2.3 Medos/Inseguranças (um por linha)
                </label>
                <textarea
                  value={formData.fears.join("\n")}
                  onChange={(e) =>
                    updateField(
                      "fears",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  2.4 Objeções Frequentes (um por linha)
                </label>
                <textarea
                  value={formData.objections.join("\n")}
                  onChange={(e) =>
                    updateField(
                      "objections",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  2.5 Momento da Jornada (um por linha)
                </label>
                <textarea
                  value={formData.journeyMoment.join("\n")}
                  onChange={(e) =>
                    updateField(
                      "journeyMoment",
                      e.target.value.split("\n").filter(Boolean)
                    )
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
            </div>
          </fieldset>

          {/* Section 3: Atendimento Ideal */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold px-2">
              3. Sobre o Atendimento Ideal
            </legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  3.1 Percepção da Marca *
                </label>
                <textarea
                  value={formData.brandPerception}
                  onChange={(e) =>
                    updateField("brandPerception", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  3.2 Tom de Voz *
                </label>
                <textarea
                  value={formData.toneOfVoice}
                  onChange={(e) => updateField("toneOfVoice", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  3.3 Mensagens Obrigatórias
                </label>
                <textarea
                  value={formData.mustSayMessages}
                  onChange={(e) =>
                    updateField("mustSayMessages", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  3.4 Ações Internas
                </label>
                <textarea
                  value={formData.internalActions}
                  onChange={(e) =>
                    updateField("internalActions", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  3.5 NUNCA Utilizar
                </label>
                <textarea
                  value={formData.neverUse}
                  onChange={(e) => updateField("neverUse", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  placeholder="NUNCA fazer promessas de resultado ou dar garantias."
                />
              </div>
            </div>
          </fieldset>

          {/* Section 4: Regras e Automação */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold px-2">
              4. Sobre Regras e Automação
            </legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  4.1 Adaptação por Horário *
                </label>
                <textarea
                  value={formData.scheduleAdaptation}
                  onChange={(e) =>
                    updateField("scheduleAdaptation", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  4.2 Condições Especiais
                </label>
                <textarea
                  value={formData.specialConditions}
                  onChange={(e) =>
                    updateField("specialConditions", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  4.3 Etapas Obrigatórias *
                </label>
                <textarea
                  value={formData.mandatorySteps}
                  onChange={(e) =>
                    updateField("mandatorySteps", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  4.4 Critérios de Qualificação
                </label>
                <textarea
                  value={formData.qualificationCriteria}
                  onChange={(e) =>
                    updateField("qualificationCriteria", e.target.value)
                  }
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  4.5 Fluxo de Documentos
                </label>
                <textarea
                  value={formData.documentsFlow}
                  onChange={(e) => updateField("documentsFlow", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
            </div>
          </fieldset>

          {/* Section 5: Objetivo Final */}
          <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="text-sm font-semibold px-2">
              5. Objetivo Final
            </legend>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  5.1 Objetivo Principal *
                </label>
                <textarea
                  value={formData.mainObjective}
                  onChange={(e) => updateField("mainObjective", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  5.2 Resultado Mínimo Esperado
                </label>
                <textarea
                  value={formData.minimumResult}
                  onChange={(e) => updateField("minimumResult", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  rows={2}
                />
              </div>
            </div>
          </fieldset>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Gerar Prompt
      </Button>
    </form>
  );
}
