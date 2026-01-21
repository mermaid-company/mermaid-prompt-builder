"use client";

/**
 * Cost Breakdown Chart Component
 *
 * Displays a visual breakdown of costs by phase (generation, analysis, improvement).
 */

interface PhaseBreakdown {
  generation: number;
  analysis: number;
  improvement: number;
}

interface CostBreakdownChartProps {
  costs: PhaseBreakdown;
  tokens?: {
    generation: { input: number; output: number };
    analysis: { input: number; output: number };
    improvement: { input: number; output: number };
  };
}

export function CostBreakdownChart({ costs, tokens }: CostBreakdownChartProps) {
  const total = costs.generation + costs.analysis + costs.improvement;

  const phases = [
    {
      name: "Generation",
      cost: costs.generation,
      color: "bg-blue-500",
      lightColor: "bg-blue-100 dark:bg-blue-900/30",
      tokens: tokens?.generation,
    },
    {
      name: "Analysis",
      cost: costs.analysis,
      color: "bg-purple-500",
      lightColor: "bg-purple-100 dark:bg-purple-900/30",
      tokens: tokens?.analysis,
    },
    {
      name: "Improvement",
      cost: costs.improvement,
      color: "bg-green-500",
      lightColor: "bg-green-100 dark:bg-green-900/30",
      tokens: tokens?.improvement,
    },
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700 dark:text-gray-300">
        Cost by Phase
      </h4>

      {/* Bar chart */}
      <div className="h-8 flex rounded-lg overflow-hidden">
        {phases.map((phase) => {
          const percentage = total > 0 ? (phase.cost / total) * 100 : 0;
          if (percentage === 0) return null;
          return (
            <div
              key={phase.name}
              className={`${phase.color} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
              title={`${phase.name}: $${phase.cost.toFixed(4)} (${percentage.toFixed(1)}%)`}
            />
          );
        })}
        {total === 0 && (
          <div className="w-full bg-gray-200 dark:bg-gray-700" />
        )}
      </div>

      {/* Legend and details */}
      <div className="grid grid-cols-3 gap-4">
        {phases.map((phase) => {
          const percentage = total > 0 ? (phase.cost / total) * 100 : 0;
          return (
            <div
              key={phase.name}
              className={`p-3 rounded-lg ${phase.lightColor}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${phase.color}`} />
                <span className="text-sm font-medium">{phase.name}</span>
              </div>
              <p className="text-lg font-bold">${phase.cost.toFixed(4)}</p>
              <p className="text-xs text-gray-500">
                {percentage.toFixed(1)}% of total
              </p>
              {phase.tokens && (
                <p className="text-xs text-gray-400 mt-1">
                  {phase.tokens.input.toLocaleString()} in /{" "}
                  {phase.tokens.output.toLocaleString()} out
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
