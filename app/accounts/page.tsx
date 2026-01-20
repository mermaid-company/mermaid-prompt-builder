/**
 * Accounts List Page
 *
 * View all registered accounts and their assistants.
 */

import { Card, Badge } from "@/components/ui";
import { AccountList } from "@/components/accounts";

export default function AccountsPage() {
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
            Accounts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage client accounts and their assistant configurations
          </p>
        </div>

        {/* Account List */}
        <AccountList />

        {/* Help Section */}
        <Card className="mt-8">
          <h3 className="font-semibold mb-4">Adding a New Account</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>To add a new account, create the following folder structure:</p>
            <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs overflow-x-auto">
              {`lib/accounts/[account-id]/
├── config.ts           # Account configuration
└── assistants/
    └── [assistant-id]/
        ├── metadata.ts  # Assistant metadata
        └── v1/
            ├── prompt.md       # Generated prompt
            └── injection.ts    # Injection file`}
            </pre>
            <p className="mt-4">
              <Badge variant="info">Note</Badge> Account API keys should be
              stored in{" "}
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                .env.local
              </code>{" "}
              with account-prefixed names (e.g.,{" "}
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
                ACME_ANTHROPIC_KEY
              </code>
              ).
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
