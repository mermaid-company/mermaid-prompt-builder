import { Card, Badge } from "@/components/ui";
import { AccountList } from "@/components/accounts";
import { Lightbulb, Building2, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mermaid Prompt Builder
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Pipeline for briefing ingestion, prompt generation, and assistant
            management
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card href="/test">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Lightbulb className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold">Test Pipeline</h3>
                <p className="text-sm text-gray-500">Generate a test prompt</p>
              </div>
            </div>
          </Card>

          <Card href="/accounts">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold">Accounts</h3>
                <p className="text-sm text-gray-500">Manage client accounts</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div>
                <h3 className="font-semibold">Cost Tracking</h3>
                <p className="text-sm text-gray-500">View API usage & costs</p>
                <Badge variant="warning" className="mt-1">
                  Coming Soon
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Accounts Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Accounts</h2>
          <AccountList />
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold mb-4">System Configuration</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">AI Model</dt>
                <dd className="font-mono">claude-opus-4-5-20251101</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">PRISMA System</dt>
                <dd>
                  <Badge variant="success">Active</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Iteration Mode</dt>
                <dd>Analysis + Improvement</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="font-semibold mb-4">Webhook Endpoint</h3>
            <div className="space-y-2 text-sm">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-xs overflow-x-auto">
                POST /api/webhook/briefing
              </div>
              <p className="text-gray-500">
                Send briefings via webhook to trigger the prompt generation
                pipeline.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
