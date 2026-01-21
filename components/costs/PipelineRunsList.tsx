"use client";

/**
 * Pipeline Runs List Component
 *
 * Displays a list of pipeline runs with cost information.
 */

import { Badge } from "@/components/ui";
import { Clock, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface PipelineRun {
  pipeline_run_id: string;
  pipeline_id: string;
  account_slug: string;
  assistant_external_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  total_cost: number;
  total_input_tokens: number;
  total_output_tokens: number;
  generation_cost: number;
  analysis_cost: number;
  improvement_cost: number;
}

interface PipelineRunsListProps {
  runs: PipelineRun[];
  onSelectRun?: (runId: string) => void;
}

export function PipelineRunsList({ runs, onSelectRun }: PipelineRunsListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "success" | "error" | "warning" | "default" => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "running":
        return "warning";
      default:
        return "default";
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (runs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pipeline runs found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => (
        <div
          key={run.pipeline_run_id}
          onClick={() => onSelectRun?.(run.pipeline_run_id)}
          className={`p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${
            onSelectRun ? "cursor-pointer hover:border-blue-500 transition-colors" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(run.status)}
              <span className="font-mono text-sm">{run.pipeline_id}</span>
              <Badge variant={getStatusVariant(run.status)}>
                {run.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              {formatDate(run.started_at)}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">{run.account_slug}</span>
                {" / "}
                <span className="font-mono">{run.assistant_external_id}</span>
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-500">
                {formatDuration(run.duration_ms)}
              </span>
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <DollarSign className="w-4 h-4" />
                {run.total_cost.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Mini cost breakdown */}
          <div className="mt-2 flex gap-2">
            {run.generation_cost > 0 && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                Gen: ${run.generation_cost.toFixed(4)}
              </span>
            )}
            {run.analysis_cost > 0 && (
              <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                Anl: ${run.analysis_cost.toFixed(4)}
              </span>
            )}
            {run.improvement_cost > 0 && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                Imp: ${run.improvement_cost.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
