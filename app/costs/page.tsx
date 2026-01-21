"use client";

/**
 * Cost Dashboard Page
 *
 * Displays cost tracking and pipeline history information.
 */

import { useState, useEffect } from "react";
import { Card, Badge } from "@/components/ui";
import {
  CostSummaryCard,
  CostBreakdownChart,
  PipelineRunsList,
} from "@/components/costs";
import { ArrowLeft, RefreshCw, Filter } from "lucide-react";
import Link from "next/link";

interface PipelineRunWithCosts {
  pipeline_run_id: string;
  pipeline_id: string;
  account_id: string;
  assistant_id: string;
  account_slug: string;
  assistant_external_id: string;
  status: string;
  duration_ms: number | null;
  started_at: string;
  completed_at: string | null;
  generation_cost: number;
  analysis_cost: number;
  improvement_cost: number;
  generation_input_tokens: number;
  generation_output_tokens: number;
  analysis_input_tokens: number;
  analysis_output_tokens: number;
  improvement_input_tokens: number;
  improvement_output_tokens: number;
  total_cost: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

export default function CostDashboardPage() {
  const [runs, setRuns] = useState<PipelineRunWithCosts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PipelineRunWithCosts | null>(
    null
  );

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pipeline-runs?withCosts=true&limit=50");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch data");
      }

      setRuns(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate totals from runs
  const totals = runs.reduce(
    (acc, run) => ({
      totalCost: acc.totalCost + (run.total_cost || 0),
      totalRuns: acc.totalRuns + 1,
      totalInputTokens: acc.totalInputTokens + (run.total_input_tokens || 0),
      totalOutputTokens: acc.totalOutputTokens + (run.total_output_tokens || 0),
      generationCost: acc.generationCost + (run.generation_cost || 0),
      analysisCost: acc.analysisCost + (run.analysis_cost || 0),
      improvementCost: acc.improvementCost + (run.improvement_cost || 0),
      generationInputTokens:
        acc.generationInputTokens + (run.generation_input_tokens || 0),
      generationOutputTokens:
        acc.generationOutputTokens + (run.generation_output_tokens || 0),
      analysisInputTokens:
        acc.analysisInputTokens + (run.analysis_input_tokens || 0),
      analysisOutputTokens:
        acc.analysisOutputTokens + (run.analysis_output_tokens || 0),
      improvementInputTokens:
        acc.improvementInputTokens + (run.improvement_input_tokens || 0),
      improvementOutputTokens:
        acc.improvementOutputTokens + (run.improvement_output_tokens || 0),
    }),
    {
      totalCost: 0,
      totalRuns: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      generationCost: 0,
      analysisCost: 0,
      improvementCost: 0,
      generationInputTokens: 0,
      generationOutputTokens: 0,
      analysisInputTokens: 0,
      analysisOutputTokens: 0,
      improvementInputTokens: 0,
      improvementOutputTokens: 0,
    }
  );

  const handleSelectRun = (runId: string) => {
    const run = runs.find((r) => r.pipeline_run_id === runId);
    setSelectedRun(run || null);
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Cost Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track API costs and pipeline history
              </p>
            </div>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CostSummaryCard
            totalCost={totals.totalCost}
            totalRuns={totals.totalRuns}
            totalInputTokens={totals.totalInputTokens}
            totalOutputTokens={totals.totalOutputTokens}
          />

          <Card>
            <CostBreakdownChart
              costs={{
                generation: totals.generationCost,
                analysis: totals.analysisCost,
                improvement: totals.improvementCost,
              }}
              tokens={{
                generation: {
                  input: totals.generationInputTokens,
                  output: totals.generationOutputTokens,
                },
                analysis: {
                  input: totals.analysisInputTokens,
                  output: totals.analysisOutputTokens,
                },
                improvement: {
                  input: totals.improvementInputTokens,
                  output: totals.improvementOutputTokens,
                },
              }}
            />
          </Card>
        </div>

        {/* Selected Run Detail */}
        {selectedRun && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Pipeline Run Details</h3>
              <button
                onClick={() => setSelectedRun(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Pipeline ID</p>
                <p className="font-mono text-sm">{selectedRun.pipeline_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account</p>
                <p className="font-medium">{selectedRun.account_slug}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assistant</p>
                <p className="font-mono text-sm">
                  {selectedRun.assistant_external_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge
                  variant={
                    selectedRun.status === "completed"
                      ? "success"
                      : selectedRun.status === "failed"
                      ? "error"
                      : "warning"
                  }
                >
                  {selectedRun.status}
                </Badge>
              </div>
            </div>

            <CostBreakdownChart
              costs={{
                generation: selectedRun.generation_cost || 0,
                analysis: selectedRun.analysis_cost || 0,
                improvement: selectedRun.improvement_cost || 0,
              }}
              tokens={{
                generation: {
                  input: selectedRun.generation_input_tokens || 0,
                  output: selectedRun.generation_output_tokens || 0,
                },
                analysis: {
                  input: selectedRun.analysis_input_tokens || 0,
                  output: selectedRun.analysis_output_tokens || 0,
                },
                improvement: {
                  input: selectedRun.improvement_input_tokens || 0,
                  output: selectedRun.improvement_output_tokens || 0,
                },
              }}
            />
          </Card>
        )}

        {/* Pipeline Runs List */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Pipeline Runs</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              Showing {runs.length} runs
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            <PipelineRunsList runs={runs} onSelectRun={handleSelectRun} />
          )}
        </Card>
      </div>
    </main>
  );
}
