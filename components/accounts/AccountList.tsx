/**
 * Account List Component
 *
 * Display list of accounts with their status.
 */

"use client";

import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";

interface Account {
  id: string;
  name: string;
  description?: string;
  assistantCount: number;
  credentialsConfigured?: boolean;
}

export function AccountList() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch("/api/accounts");
        const data = await response.json();
        if (data.accounts) {
          setAccounts(data.accounts);
        }
      } catch (err) {
        setError("Failed to load accounts");
      } finally {
        setLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        {error}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 text-center">
        No accounts configured. Add an account in <code>lib/accounts/</code>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {accounts.map((account) => (
        <Card
          key={account.id}
          title={account.name}
          description={account.description}
          href={`/accounts/${account.id}`}
        >
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="info">{account.assistantCount} assistants</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}
