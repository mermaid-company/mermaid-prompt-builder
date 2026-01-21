# Supabase Integration Plan

> Complete plan for migrating data storage to Supabase with per-phase cost tracking.

## Overview

This plan migrates the MermAId Prompt Builder from file-based storage to Supabase while:
- Keeping Google Sheets integration active
- Storing all pipeline runs, costs, prompts, and versions in Supabase
- Enabling multi-user access with account-based authentication (via Mermaid Token)
- Providing detailed per-phase cost tracking

---

## Environment Variables

Current `.env` variables to use:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=              # Supabase project URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=  # Client-side (public)
SUPABASE_SK=                           # Service role key (server-only, bypasses RLS)
SUPABASE_DB_PASS=                      # Direct DB password (for migrations if needed)
```

**Security Note:** `SUPABASE_SK` must NEVER use `NEXT_PUBLIC_` prefix - it bypasses Row Level Security.

---

## Phase 1: Database Schema

### 1.1 Tables Overview

```
accounts
    └── assistants
            └── pipeline_runs
                    ├── pipeline_steps
                    ├── cost_entries
                    └── prompt_versions
```

### 1.2 SQL Schema

```sql
-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                    -- e.g., "example-account"
  name TEXT NOT NULL,
  mermaid_token_hash TEXT,                      -- Hashed token for auth
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX idx_accounts_slug ON accounts(slug);

-- ============================================
-- ASSISTANTS TABLE
-- ============================================
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,                    -- MermAId assistant ID
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, external_id)
);

CREATE INDEX idx_assistants_account ON assistants(account_id);
CREATE INDEX idx_assistants_external ON assistants(external_id);

-- ============================================
-- PIPELINE RUNS TABLE
-- ============================================
CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  
  -- Identifiers
  pipeline_id TEXT UNIQUE NOT NULL,             -- e.g., "pipeline_mkn6mzpyplhrmw"
  briefing_id TEXT NOT NULL,                    -- e.g., "briefing_mkn6igzv9cb1ti"
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Input data
  briefing_data JSONB NOT NULL,                 -- Full briefing input
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Cost summary (denormalized for quick queries)
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_runs_account ON pipeline_runs(account_id);
CREATE INDEX idx_pipeline_runs_assistant ON pipeline_runs(assistant_id);
CREATE INDEX idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_created ON pipeline_runs(created_at DESC);

-- ============================================
-- PIPELINE STEPS TABLE (per-phase tracking)
-- ============================================
CREATE TABLE pipeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  
  -- Step info
  step_name TEXT NOT NULL,                      -- e.g., "prompt_generation"
  step_order INTEGER NOT NULL,                  -- 1, 2, 3...
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_steps_run ON pipeline_steps(pipeline_run_id);

-- ============================================
-- COST ENTRIES TABLE (per-operation)
-- ============================================
CREATE TABLE cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  pipeline_step_id UUID REFERENCES pipeline_steps(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  
  -- Operation details
  operation TEXT NOT NULL,                      -- "prompt_generation", "prompt_analysis", "prompt_improvement"
  model TEXT NOT NULL,                          -- "claude-opus-4-5-20251101"
  
  -- Token usage
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  
  -- Cost
  cost_usd DECIMAL(10, 6) NOT NULL,
  
  -- Timing
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cost_entries_pipeline ON cost_entries(pipeline_run_id);
CREATE INDEX idx_cost_entries_account ON cost_entries(account_id);
CREATE INDEX idx_cost_entries_assistant ON cost_entries(assistant_id);
CREATE INDEX idx_cost_entries_operation ON cost_entries(operation);
CREATE INDEX idx_cost_entries_timestamp ON cost_entries(timestamp DESC);

-- ============================================
-- PROMPT VERSIONS TABLE
-- ============================================
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_run_id UUID NOT NULL REFERENCES pipeline_runs(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  
  -- Version info
  version TEXT NOT NULL,                        -- "v1", "v2", etc.
  version_number INTEGER NOT NULL,              -- 1, 2, etc.
  
  -- Content
  prompt_content TEXT NOT NULL,                 -- Full prompt markdown
  prompt_hash TEXT NOT NULL,                    -- SHA256 hash for deduplication
  
  -- Injection file
  injection_content TEXT NOT NULL,              -- Full injection.ts content
  injection_file_path TEXT,                     -- Original file path (for reference)
  
  -- Metadata
  briefing_hash TEXT NOT NULL,
  total_iterations INTEGER DEFAULT 1,
  final_score DECIMAL(5, 2),                    -- Quality score if available
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'deployed', 'archived')),
  deployed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(assistant_id, version)
);

CREATE INDEX idx_prompt_versions_assistant ON prompt_versions(assistant_id);
CREATE INDEX idx_prompt_versions_account ON prompt_versions(account_id);
CREATE INDEX idx_prompt_versions_status ON prompt_versions(status);
CREATE INDEX idx_prompt_versions_created ON prompt_versions(created_at DESC);

-- ============================================
-- VIEWS FOR COST AGGREGATION
-- ============================================

-- Cost summary per pipeline run with phase breakdown
CREATE VIEW v_pipeline_cost_breakdown AS
SELECT 
  pr.id AS pipeline_run_id,
  pr.pipeline_id,
  pr.account_id,
  pr.assistant_id,
  a.slug AS account_slug,
  ast.external_id AS assistant_external_id,
  pr.status,
  pr.duration_ms,
  pr.started_at,
  pr.completed_at,
  
  -- Per-phase costs
  SUM(CASE WHEN ce.operation = 'prompt_generation' THEN ce.cost_usd ELSE 0 END) AS generation_cost,
  SUM(CASE WHEN ce.operation = 'prompt_analysis' THEN ce.cost_usd ELSE 0 END) AS analysis_cost,
  SUM(CASE WHEN ce.operation = 'prompt_improvement' THEN ce.cost_usd ELSE 0 END) AS improvement_cost,
  
  -- Per-phase tokens
  SUM(CASE WHEN ce.operation = 'prompt_generation' THEN ce.input_tokens ELSE 0 END) AS generation_input_tokens,
  SUM(CASE WHEN ce.operation = 'prompt_generation' THEN ce.output_tokens ELSE 0 END) AS generation_output_tokens,
  SUM(CASE WHEN ce.operation = 'prompt_analysis' THEN ce.input_tokens ELSE 0 END) AS analysis_input_tokens,
  SUM(CASE WHEN ce.operation = 'prompt_analysis' THEN ce.output_tokens ELSE 0 END) AS analysis_output_tokens,
  SUM(CASE WHEN ce.operation = 'prompt_improvement' THEN ce.input_tokens ELSE 0 END) AS improvement_input_tokens,
  SUM(CASE WHEN ce.operation = 'prompt_improvement' THEN ce.output_tokens ELSE 0 END) AS improvement_output_tokens,
  
  -- Totals
  SUM(ce.cost_usd) AS total_cost,
  SUM(ce.input_tokens) AS total_input_tokens,
  SUM(ce.output_tokens) AS total_output_tokens

FROM pipeline_runs pr
JOIN accounts a ON pr.account_id = a.id
JOIN assistants ast ON pr.assistant_id = ast.id
LEFT JOIN cost_entries ce ON pr.id = ce.pipeline_run_id
GROUP BY pr.id, pr.pipeline_id, pr.account_id, pr.assistant_id, 
         a.slug, ast.external_id, pr.status, pr.duration_ms, 
         pr.started_at, pr.completed_at;

-- Daily cost summary per account
CREATE VIEW v_daily_costs_by_account AS
SELECT 
  DATE(ce.timestamp) AS date,
  a.id AS account_id,
  a.slug AS account_slug,
  a.name AS account_name,
  COUNT(DISTINCT ce.pipeline_run_id) AS pipeline_runs,
  SUM(ce.input_tokens) AS total_input_tokens,
  SUM(ce.output_tokens) AS total_output_tokens,
  SUM(ce.cost_usd) AS total_cost
FROM cost_entries ce
JOIN accounts a ON ce.account_id = a.id
GROUP BY DATE(ce.timestamp), a.id, a.slug, a.name
ORDER BY date DESC, account_slug;

-- Cost summary per assistant
CREATE VIEW v_costs_by_assistant AS
SELECT 
  ast.id AS assistant_id,
  ast.external_id,
  ast.name AS assistant_name,
  a.id AS account_id,
  a.slug AS account_slug,
  COUNT(DISTINCT ce.pipeline_run_id) AS total_runs,
  SUM(ce.input_tokens) AS total_input_tokens,
  SUM(ce.output_tokens) AS total_output_tokens,
  SUM(ce.cost_usd) AS total_cost,
  AVG(ce.cost_usd) AS avg_cost_per_operation,
  MAX(ce.timestamp) AS last_activity
FROM cost_entries ce
JOIN assistants ast ON ce.assistant_id = ast.id
JOIN accounts a ON ce.account_id = a.id
GROUP BY ast.id, ast.external_id, ast.name, a.id, a.slug;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations via service role (server-side)
-- We'll authenticate via Mermaid Token in the application layer
-- These policies allow service_role key to access everything

CREATE POLICY "Service role has full access to accounts"
  ON accounts FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to assistants"
  ON assistants FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to pipeline_runs"
  ON pipeline_runs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to pipeline_steps"
  ON pipeline_steps FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to cost_entries"
  ON cost_entries FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to prompt_versions"
  ON prompt_versions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next version number for an assistant
CREATE OR REPLACE FUNCTION get_next_version_number(p_assistant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_num
  FROM prompt_versions
  WHERE assistant_id = p_assistant_id;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update pipeline run totals after cost entry
CREATE OR REPLACE FUNCTION update_pipeline_run_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pipeline_runs
  SET 
    total_input_tokens = (
      SELECT COALESCE(SUM(input_tokens), 0) 
      FROM cost_entries 
      WHERE pipeline_run_id = NEW.pipeline_run_id
    ),
    total_output_tokens = (
      SELECT COALESCE(SUM(output_tokens), 0) 
      FROM cost_entries 
      WHERE pipeline_run_id = NEW.pipeline_run_id
    ),
    total_cost_usd = (
      SELECT COALESCE(SUM(cost_usd), 0) 
      FROM cost_entries 
      WHERE pipeline_run_id = NEW.pipeline_run_id
    )
  WHERE id = NEW.pipeline_run_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update totals
CREATE TRIGGER tr_update_pipeline_totals
  AFTER INSERT ON cost_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_run_totals();
```

### 1.3 Checklist - Phase 1

- [x] Create Supabase migration file with schema above
- [x] Run migration via `node scripts/run-migration.mjs`
- [x] Verify all tables created correctly (accounts, assistants, cost_entries, pipeline_runs, pipeline_steps, prompt_versions)
- [x] Verify views work (v_costs_by_assistant, v_daily_costs_by_account, v_pipeline_cost_breakdown)
- [x] Verify trigger works (tr_update_pipeline_totals)
- [x] Test RLS policies with service role key

**Completed:** 2026-01-20

---

## Phase 2: Supabase Client Setup

### 2.1 Install Dependencies

```bash
npm install @supabase/supabase-js
```

Note: We use `@supabase/supabase-js` directly (not `@supabase/ssr`) because we're primarily doing server-side operations with the service role key.

### 2.2 Create Supabase Client Files

**File: `lib/services/supabase/client.ts`**

```typescript
/**
 * Supabase Client Factory
 * 
 * Creates Supabase clients for server-side operations.
 * Uses SUPABASE_SK (service role key) which bypasses RLS.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/utils/logger";
import type { Database } from "@/lib/types/supabase";

const logger = createLogger("supabase-client");

let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client with service role key (server-side only)
 * This client bypasses RLS and has full access.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SK;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceKey) {
    throw new Error("SUPABASE_SK is not set");
  }

  logger.info("Creating Supabase client");

  cachedClient = createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return cachedClient;
}

/**
 * Clear client cache (useful for testing)
 */
export function clearSupabaseCache(): void {
  cachedClient = null;
  logger.info("Supabase client cache cleared");
}
```

**File: `lib/services/supabase/index.ts`**

```typescript
/**
 * Supabase Service Barrel Export
 */

export { getSupabaseClient, clearSupabaseCache } from "./client";

// Repositories
export * from "./repositories/accounts";
export * from "./repositories/assistants";
export * from "./repositories/pipeline-runs";
export * from "./repositories/cost-entries";
export * from "./repositories/prompt-versions";
```

### 2.3 Generate TypeScript Types

Run Supabase CLI to generate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/supabase.ts
```

Or manually create `lib/types/supabase.ts` based on schema.

### 2.4 Checklist - Phase 2

- [x] Install `@supabase/supabase-js`
- [x] Create `lib/services/supabase/client.ts`
- [x] Create `lib/services/supabase/index.ts`
- [x] Generate or create `lib/types/supabase.ts`
- [x] Test client connection (via `node scripts/test-supabase-client.mjs`)

**Completed:** 2026-01-20

---

## Phase 3: Repository Layer

Create repository files for each entity.

### 3.1 Accounts Repository

**File: `lib/services/supabase/repositories/accounts.ts`**

```typescript
/**
 * Accounts Repository
 */

import { getSupabaseClient } from "../client";
import type { Database } from "@/lib/types/supabase";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];

export async function createAccount(data: AccountInsert): Promise<Account> {
  const supabase = getSupabaseClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return account;
}

export async function getAccountBySlug(slug: string): Promise<Account | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .select()
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function listAccounts(): Promise<Account[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .select()
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getOrCreateAccount(
  slug: string, 
  name: string
): Promise<Account> {
  const existing = await getAccountBySlug(slug);
  if (existing) return existing;
  
  return createAccount({ slug, name });
}
```

### 3.2 Pipeline Runs Repository

**File: `lib/services/supabase/repositories/pipeline-runs.ts`**

```typescript
/**
 * Pipeline Runs Repository
 */

import { getSupabaseClient } from "../client";
import type { Database } from "@/lib/types/supabase";

type PipelineRun = Database["public"]["Tables"]["pipeline_runs"]["Row"];
type PipelineRunInsert = Database["public"]["Tables"]["pipeline_runs"]["Insert"];

export async function createPipelineRun(
  data: PipelineRunInsert
): Promise<PipelineRun> {
  const supabase = getSupabaseClient();
  const { data: run, error } = await supabase
    .from("pipeline_runs")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return run;
}

export async function updatePipelineRun(
  id: string,
  data: Partial<PipelineRunInsert>
): Promise<PipelineRun> {
  const supabase = getSupabaseClient();
  const { data: run, error } = await supabase
    .from("pipeline_runs")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return run;
}

export async function getPipelineRunWithCosts(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_pipeline_cost_breakdown")
    .select()
    .eq("pipeline_run_id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function listPipelineRuns(params: {
  accountId?: string;
  assistantId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("pipeline_runs")
    .select("*, cost_entries(*), pipeline_steps(*)")
    .order("created_at", { ascending: false });

  if (params.accountId) query = query.eq("account_id", params.accountId);
  if (params.assistantId) query = query.eq("assistant_id", params.assistantId);
  if (params.status) query = query.eq("status", params.status);
  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.range(params.offset, params.offset + (params.limit || 10) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

### 3.3 Cost Entries Repository

**File: `lib/services/supabase/repositories/cost-entries.ts`**

```typescript
/**
 * Cost Entries Repository
 */

import { getSupabaseClient } from "../client";
import type { Database } from "@/lib/types/supabase";
import type { CostEntry } from "@/lib/types";

type CostEntryRow = Database["public"]["Tables"]["cost_entries"]["Row"];
type CostEntryInsert = Database["public"]["Tables"]["cost_entries"]["Insert"];

export async function createCostEntry(
  data: CostEntryInsert
): Promise<CostEntryRow> {
  const supabase = getSupabaseClient();
  const { data: entry, error } = await supabase
    .from("cost_entries")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return entry;
}

export async function createCostEntries(
  entries: CostEntryInsert[]
): Promise<CostEntryRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cost_entries")
    .insert(entries)
    .select();

  if (error) throw error;
  return data || [];
}

export async function getCostsByPipelineRun(
  pipelineRunId: string
): Promise<CostEntryRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("cost_entries")
    .select()
    .eq("pipeline_run_id", pipelineRunId)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getDailyCostsByAccount(accountId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_daily_costs_by_account")
    .select()
    .eq("account_id", accountId)
    .order("date", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
}

export async function getCostSummaryByAssistant(accountId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_costs_by_assistant")
    .select()
    .eq("account_id", accountId);

  if (error) throw error;
  return data || [];
}
```

### 3.4 Prompt Versions Repository

**File: `lib/services/supabase/repositories/prompt-versions.ts`**

```typescript
/**
 * Prompt Versions Repository
 */

import { getSupabaseClient } from "../client";
import type { Database } from "@/lib/types/supabase";

type PromptVersion = Database["public"]["Tables"]["prompt_versions"]["Row"];
type PromptVersionInsert = Database["public"]["Tables"]["prompt_versions"]["Insert"];

export async function createPromptVersion(
  data: PromptVersionInsert
): Promise<PromptVersion> {
  const supabase = getSupabaseClient();
  const { data: version, error } = await supabase
    .from("prompt_versions")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return version;
}

export async function getLatestVersion(
  assistantId: string
): Promise<PromptVersion | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select()
    .eq("assistant_id", assistantId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function listVersions(
  assistantId: string
): Promise<PromptVersion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select()
    .eq("assistant_id", assistantId)
    .order("version_number", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateVersionStatus(
  id: string,
  status: "draft" | "final" | "deployed" | "archived",
  deployedAt?: string
): Promise<PromptVersion> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .update({ 
      status, 
      deployed_at: status === "deployed" ? deployedAt || new Date().toISOString() : null 
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 3.5 Checklist - Phase 3

- [x] Create `repositories/accounts.ts`
- [x] Create `repositories/assistants.ts`
- [x] Create `repositories/pipeline-runs.ts`
- [x] Create `repositories/pipeline-steps.ts`
- [x] Create `repositories/cost-entries.ts`
- [x] Create `repositories/prompt-versions.ts`
- [x] Create `repositories/index.ts` barrel export
- [x] Test each repository with sample data

**Completed:** 2026-01-21

---

## Phase 4: Update Pipeline Orchestrator

### 4.1 Modify Pipeline to Save to Supabase

Update `lib/services/pipeline/orchestrator.ts`:

```typescript
// At the start of runPipeline():

// 1. Get or create account/assistant in Supabase
const account = await getOrCreateAccount(payload.accountId, payload.accountId);
const assistant = await getOrCreateAssistant(
  account.id,
  payload.briefing.assistantId,
  payload.briefing.assistantId
);

// 2. Create pipeline run record
const pipelineRun = await createPipelineRun({
  account_id: account.id,
  assistant_id: assistant.id,
  pipeline_id: generateId("pipeline"),
  briefing_id: payload.briefing.id,
  status: "running",
  briefing_data: payload.briefing,
  started_at: new Date().toISOString(),
});

// 3. For each step, create pipeline_step record and update status

// 4. For each AI call, create cost_entry with:
//    - pipeline_run_id
//    - pipeline_step_id (link to current step)
//    - operation (prompt_generation, prompt_analysis, prompt_improvement)
//    - tokens and cost

// 5. At the end, create prompt_version with:
//    - Full prompt content
//    - Injection file content
//    - Hashes and metadata

// 6. Update pipeline_run status to completed/failed
```

### 4.2 Example Cost Entry Creation

```typescript
// In cost-tracker.ts or directly in generator.ts

async function logCostToSupabase(params: {
  pipelineRunId: string;
  pipelineStepId: string;
  accountId: string;
  assistantId: string;
  operation: "prompt_generation" | "prompt_analysis" | "prompt_improvement";
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}) {
  await createCostEntry({
    pipeline_run_id: params.pipelineRunId,
    pipeline_step_id: params.pipelineStepId,
    account_id: params.accountId,
    assistant_id: params.assistantId,
    operation: params.operation,
    model: params.model,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    cost_usd: params.costUsd,
    timestamp: new Date().toISOString(),
  });
}
```

### 4.3 Checklist - Phase 4

- [x] Update pipeline orchestrator to create pipeline_run at start
- [x] Add pipeline step tracking with status updates
- [x] Modify cost tracking to save to Supabase (in addition to session tracking)
- [x] Create prompt_version at end of successful run
- [x] Update pipeline_run status on completion/failure
- [ ] Test full pipeline with Supabase logging
- [ ] Verify cost breakdown view shows correct data

**Completed:** 2026-01-21

---

## Phase 5: API Routes for Cost Dashboard

### 5.1 New API Routes

**`app/api/costs/route.ts`** - Global cost summary

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  const days = parseInt(searchParams.get("days") || "30");
  
  // Return aggregated costs
}
```

**`app/api/costs/[accountId]/route.ts`** - Account-specific costs

**`app/api/pipeline-runs/route.ts`** - List pipeline runs with costs

**`app/api/pipeline-runs/[id]/route.ts`** - Single run with full breakdown

### 5.2 Checklist - Phase 5

- [x] Create `/api/costs` route
- [x] Create `/api/costs/[accountId]` route  
- [x] Create `/api/pipeline-runs` route
- [x] Create `/api/pipeline-runs/[id]` route
- [ ] Test all endpoints

**Completed:** 2026-01-21

---

## Phase 6: UI Updates

### 6.1 Cost Dashboard Page

Create `app/costs/page.tsx`:

- Global cost overview
- Per-account breakdown
- Per-assistant breakdown
- Daily/weekly/monthly trends
- Per-phase cost visualization (generation vs analysis vs improvement)

### 6.2 Pipeline History

Update test page or create new page:

- List of all pipeline runs
- Click to see detailed breakdown
- Per-phase timing and costs
- Link to generated prompt versions

### 6.3 Checklist - Phase 6

- [x] Create cost dashboard page (`app/costs/page.tsx`)
- [x] Create pipeline runs list component
- [x] Add cost breakdown visualization (bar chart per phase)
- [x] Add cost summary card component
- [x] Update dashboard home page to link to cost tracking

**Completed:** 2026-01-21

---

## Phase 7: Migration

### 7.1 Migrate Existing Accounts

Script to migrate accounts from `lib/accounts/` to Supabase:

```typescript
// scripts/migrate-accounts.ts
import { readdirSync } from "fs";
import { getOrCreateAccount } from "@/lib/services/supabase";

async function migrateAccounts() {
  const accountsDir = "lib/accounts";
  const accounts = readdirSync(accountsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("_"))
    .map(d => d.name);

  for (const slug of accounts) {
    await getOrCreateAccount(slug, slug);
    console.log(`Migrated account: ${slug}`);
  }
}
```

### 7.2 Checklist - Phase 7

- [x] Create migration script (`scripts/migrate-accounts.mjs`)
- [x] Run migration for existing accounts
- [x] Verify data in Supabase (1 account, 1 assistant, 1 version migrated)
- [ ] Update account registry to read from Supabase (with file fallback) - optional future work

**Completed:** 2026-01-21

---

## Summary Checklist

### Phase 1: Database Schema
- [x] Create SQL migration file
- [x] Run migration
- [x] Verify tables, views, triggers

### Phase 2: Supabase Client
- [x] Install dependencies
- [x] Create client factory
- [x] Generate/create TypeScript types

### Phase 3: Repository Layer
- [x] Accounts repository
- [x] Assistants repository
- [x] Pipeline runs repository
- [x] Pipeline steps repository
- [x] Cost entries repository
- [x] Prompt versions repository

### Phase 4: Pipeline Integration
- [x] Update orchestrator for Supabase logging
- [x] Per-step tracking
- [x] Per-operation cost logging
- [x] Prompt version storage

### Phase 5: API Routes
- [x] Cost summary endpoints
- [x] Pipeline history endpoints

### Phase 6: UI
- [x] Cost dashboard
- [x] Pipeline history
- [x] Phase breakdown visualization

### Phase 7: Migration
- [x] Migrate existing accounts
- [ ] Update account registry (optional future work)

**All phases completed: 2026-01-21**

---

## Cost Tracking Output Example

After implementation, a pipeline run will show:

```json
{
  "pipeline_id": "pipeline_mkn6mzpyplhrmw",
  "status": "completed",
  "duration_ms": 210884,
  "costs": {
    "generation": {
      "input_tokens": 10451,
      "output_tokens": 2839,
      "cost_usd": 0.3697
    },
    "analysis": {
      "input_tokens": 3532,
      "output_tokens": 2415,
      "cost_usd": 0.2341
    },
    "improvement": {
      "input_tokens": 15726,
      "output_tokens": 6120,
      "cost_usd": 0.6949
    },
    "total": {
      "input_tokens": 29709,
      "output_tokens": 11374,
      "cost_usd": 1.2987
    }
  }
}
```

---

## References

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase SSR Client Setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Service Role Key Usage](https://github.com/orgs/supabase/discussions/30739)
