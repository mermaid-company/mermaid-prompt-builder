"use client";

/**
 * Cost Summary Card Component
 *
 * Displays a summary of costs with key metrics.
 */

import { Card } from "@/components/ui";
import { DollarSign, TrendingUp, Zap, Clock } from "lucide-react";

interface CostSummaryCardProps {
  totalCost: number;
  totalRuns: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  period?: string;
}

export function CostSummaryCard({
  totalCost,
  totalRuns,
  totalInputTokens,
  totalOutputTokens,
  period = "All time",
}: CostSummaryCardProps) {
  const avgCostPerRun = totalRuns > 0 ? totalCost / totalRuns : 0;
  const totalTokens = totalInputTokens + totalOutputTokens;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Cost Summary</h3>
        <span className="text-sm text-gray-500">{period}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Cost
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${totalCost.toFixed(4)}
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Pipeline Runs
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalRuns}</p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Tokens
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {totalTokens.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Avg Cost/Run
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            ${avgCostPerRun.toFixed(4)}
          </p>
        </div>
      </div>
    </Card>
  );
}
