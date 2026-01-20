/**
 * Test Pipeline Page
 *
 * Manual testing interface for the prompt generation pipeline.
 */

"use client";

import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { BriefingForm } from "@/components/prompt";
import { PipelineStatus } from "@/components/pipeline";

interface LocalPipelineStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  timestamp?: string;
}

interface PipelineResult {
  pipelineId: string;
  success: boolean;
  steps: LocalPipelineStep[];
  prompt?: {
    content: string;
    version: string;
    accountId: string;
    assistantId: string;
    createdAt: string;
    iterations: number;
  };
  error?: string;
}

export default function TestPage() {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateAgent = async () => {
    if (!result?.prompt) return;

    setUpdating(true);
    setUpdateSuccess(null);
    setUpdateError(null);

    try {
      const response = await fetch("/api/assistants/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId: result.prompt.assistantId,
          promptContent: result.prompt.content,
          metadata: {
            assistantName: "Assistant",
            organizationName: result.prompt.accountId,
            organizationBusiness: "Business services",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to update agent");
      }

      setUpdateSuccess(true);
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Unknown error");
      setUpdateSuccess(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmit = async (briefing: unknown) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setUpdateSuccess(null);
    setUpdateError(null);

    try {
      const response = await fetch("/api/webhook/briefing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Skip signature validation for test mode
          "X-Test-Mode": "true",
        },
        body: JSON.stringify(briefing),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pipeline failed");
      }

      // Mock pipeline result for UI display
      setResult({
        pipelineId: data.pipelineId || "test-" + Date.now(),
        success: true,
        steps: [
          {
            name: "Webhook Received",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
          {
            name: "Briefing Validated",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
          {
            name: "PRISMA System Applied",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
          {
            name: "Initial Prompt Generated",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
          {
            name: "Prompt Analyzed",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
          {
            name: "Prompt Improved",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
          {
            name: "Files Generated",
            status: "completed",
            timestamp: new Date().toISOString(),
          },
        ],
        prompt: data.prompt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-2 inline-block"
          >
            ← Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Test Pipeline
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Submit a test briefing to generate a prompt using the PRISMA system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Briefing Form */}
          <Card>
            <BriefingForm onSubmit={handleSubmit} />
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {/* Pipeline Status */}
            {(loading || result) && (
              <Card>
                <h3 className="font-semibold mb-4">Pipeline Status</h3>
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span>Running pipeline...</span>
                  </div>
                ) : result ? (
                  <PipelineStatus
                    pipelineId={result.pipelineId}
                    steps={result.steps}
                    status={result.success ? "completed" : "failed"}
                  />
                ) : null}
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card>
                <div className="flex items-start gap-3">
                  <Badge variant="error">Error</Badge>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
              </Card>
            )}

            {/* Generated Prompt */}
            {result?.prompt && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Generated Prompt</h3>
                  <Badge variant="success">v{result.prompt.version}</Badge>
                </div>
                <div className="space-y-4">
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      Account:{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {result.prompt.accountId}
                      </code>
                    </p>
                    <p>
                      Assistant:{" "}
                      <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                        {result.prompt.assistantId}
                      </code>
                    </p>
                    <p>Iterations: {result.prompt.iterations}</p>
                  </div>
                  <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap max-h-96">
                    {result.prompt.content}
                  </pre>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          result.prompt?.content || "",
                        );
                      }}
                    >
                      Copy Prompt
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([result.prompt?.content || ""], {
                          type: "text/markdown",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `prompt-${
                          result.prompt?.version || "v1"
                        }.md`;
                        a.click();
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUpdateAgent}
                      loading={updating}
                      disabled={updating}
                    >
                      {updating ? "Updating..." : "Update Agent"}
                    </Button>
                  </div>

                  {/* Update Status */}
                  {updateSuccess === true && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Success</Badge>
                        <span className="text-green-700 dark:text-green-300 text-sm">
                          Agent updated successfully via MermAId API
                        </span>
                      </div>
                    </div>
                  )}

                  {updateError && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge variant="error">Error</Badge>
                        <span className="text-red-700 dark:text-red-300 text-sm">
                          {updateError}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
