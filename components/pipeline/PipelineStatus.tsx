/**
 * Pipeline Status Component
 *
 * Display pipeline execution status and progress.
 */

"use client";

import { Badge } from "@/components/ui";

interface PipelineStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  timestamp?: string;
  startedAt?: string;
  error?: string;
}

interface PipelineStatusProps {
  pipelineId?: string;
  id?: string;
  status: "pending" | "running" | "completed" | "failed";
  steps: PipelineStep[];
  totalDuration?: number;
  error?: string;
}

const statusVariants = {
  pending: "default",
  running: "info",
  completed: "success",
  failed: "error",
} as const;

const statusIcons = {
  pending: "○",
  running: "◐",
  completed: "✓",
  failed: "✗",
};

export function PipelineStatus({
  pipelineId,
  id,
  status,
  steps,
  totalDuration,
  error,
}: PipelineStatusProps) {
  const displayId = pipelineId || id || "unknown";
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            Pipeline {displayId.slice(0, 8)}
          </h3>
          {totalDuration && (
            <p className="text-sm text-gray-500">
              Duration: {(totalDuration / 1000).toFixed(2)}s
            </p>
          )}
        </div>
        <Badge variant={statusVariants[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`
              flex items-center gap-3 p-3 rounded-lg border
              ${
                step.status === "failed"
                  ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              }
            `}
          >
            <span
              className={`
                text-lg font-mono
                ${step.status === "completed" ? "text-green-600" : ""}
                ${step.status === "failed" ? "text-red-600" : ""}
                ${
                  step.status === "running" ? "text-blue-600 animate-pulse" : ""
                }
                ${step.status === "pending" ? "text-gray-400" : ""}
              `}
            >
              {statusIcons[step.status]}
            </span>
            <div className="flex-1">
              <p className="font-medium">{step.name}</p>
              {step.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {step.error}
                </p>
              )}
            </div>
            {(step.timestamp || step.startedAt) && (
              <span className="text-xs text-gray-500">
                {new Date(
                  step.timestamp || step.startedAt || ""
                ).toLocaleTimeString()}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
