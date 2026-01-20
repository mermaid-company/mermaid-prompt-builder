import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mermaid Prompt Builder",
  description:
    "Pipeline for briefing ingestion, PRISMA-based prompt generation, and Claude assistant management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
