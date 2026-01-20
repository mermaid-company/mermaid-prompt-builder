/**
 * Prompt Preview Component
 *
 * Display and preview generated prompts with syntax highlighting.
 */

"use client";

import { useState } from "react";
import { Button, Badge } from "@/components/ui";

interface PromptPreviewProps {
  content: string;
  version: string;
  accountId: string;
  assistantId: string;
  createdAt: string;
  iterations?: number;
}

export function PromptPreview({
  content,
  version,
  accountId,
  assistantId,
  createdAt,
  iterations = 1,
}: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayContent = expanded ? content : content.slice(0, 1000);
  const isLong = content.length > 1000;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="info">{version}</Badge>
          <Badge variant="default">
            {iterations} iteration{iterations !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          Account:{" "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
            {accountId}
          </code>
        </p>
        <p>
          Assistant:{" "}
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">
            {assistantId}
          </code>
        </p>
        <p>Created: {new Date(createdAt).toLocaleString()}</p>
      </div>

      {/* Content */}
      <div className="relative">
        <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
          {displayContent}
          {isLong && !expanded && "..."}
        </pre>
        {isLong && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? "Show less"
                : `Show more (${content.length.toLocaleString()} chars)`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
