/**
 * Card Component
 *
 * Reusable card container for dashboard sections.
 */

import { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  href?: string;
}

export function Card({
  title,
  description,
  children,
  className = "",
  href,
}: CardProps) {
  const content = (
    <>
      {title && <h2 className="text-xl font-semibold mb-2">{title}</h2>}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      )}
      {children}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={`p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {content}
    </div>
  );
}
