-- ============================================
-- MermAId Prompt Builder - Initial Schema
-- Migration: 20260120_001_initial_schema
-- ============================================

-- ============================================
-- ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                    -- e.g., "example-account"
  name TEXT NOT NULL,
  mermaid_token_hash TEXT,                      -- Hashed token for auth
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_accounts_slug ON accounts(slug);

-- ============================================
-- ASSISTANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,                    -- MermAId assistant ID
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(account_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_assistants_account ON assistants(account_id);
CREATE INDEX IF NOT EXISTS idx_assistants_external ON assistants(external_id);

-- ============================================
-- PIPELINE RUNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
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

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_account ON pipeline_runs(account_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_assistant ON pipeline_runs(assistant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_created ON pipeline_runs(created_at DESC);

-- ============================================
-- PIPELINE STEPS TABLE (per-phase tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_steps (
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

CREATE INDEX IF NOT EXISTS idx_pipeline_steps_run ON pipeline_steps(pipeline_run_id);

-- ============================================
-- COST ENTRIES TABLE (per-operation)
-- ============================================
CREATE TABLE IF NOT EXISTS cost_entries (
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

CREATE INDEX IF NOT EXISTS idx_cost_entries_pipeline ON cost_entries(pipeline_run_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_account ON cost_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_assistant ON cost_entries(assistant_id);
CREATE INDEX IF NOT EXISTS idx_cost_entries_operation ON cost_entries(operation);
CREATE INDEX IF NOT EXISTS idx_cost_entries_timestamp ON cost_entries(timestamp DESC);

-- ============================================
-- PROMPT VERSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_versions (
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

CREATE INDEX IF NOT EXISTS idx_prompt_versions_assistant ON prompt_versions(assistant_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_account ON prompt_versions(account_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_status ON prompt_versions(status);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created ON prompt_versions(created_at DESC);

-- ============================================
-- VIEWS FOR COST AGGREGATION
-- ============================================

-- Cost summary per pipeline run with phase breakdown
CREATE OR REPLACE VIEW v_pipeline_cost_breakdown AS
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
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_generation' THEN ce.cost_usd ELSE 0 END), 0) AS generation_cost,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_analysis' THEN ce.cost_usd ELSE 0 END), 0) AS analysis_cost,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_improvement' THEN ce.cost_usd ELSE 0 END), 0) AS improvement_cost,

  -- Per-phase tokens
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_generation' THEN ce.input_tokens ELSE 0 END), 0) AS generation_input_tokens,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_generation' THEN ce.output_tokens ELSE 0 END), 0) AS generation_output_tokens,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_analysis' THEN ce.input_tokens ELSE 0 END), 0) AS analysis_input_tokens,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_analysis' THEN ce.output_tokens ELSE 0 END), 0) AS analysis_output_tokens,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_improvement' THEN ce.input_tokens ELSE 0 END), 0) AS improvement_input_tokens,
  COALESCE(SUM(CASE WHEN ce.operation = 'prompt_improvement' THEN ce.output_tokens ELSE 0 END), 0) AS improvement_output_tokens,

  -- Totals
  COALESCE(SUM(ce.cost_usd), 0) AS total_cost,
  COALESCE(SUM(ce.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(ce.output_tokens), 0) AS total_output_tokens

FROM pipeline_runs pr
JOIN accounts a ON pr.account_id = a.id
JOIN assistants ast ON pr.assistant_id = ast.id
LEFT JOIN cost_entries ce ON pr.id = ce.pipeline_run_id
GROUP BY pr.id, pr.pipeline_id, pr.account_id, pr.assistant_id,
         a.slug, ast.external_id, pr.status, pr.duration_ms,
         pr.started_at, pr.completed_at;

-- Daily cost summary per account
CREATE OR REPLACE VIEW v_daily_costs_by_account AS
SELECT
  DATE(ce.timestamp) AS date,
  a.id AS account_id,
  a.slug AS account_slug,
  a.name AS account_name,
  COUNT(DISTINCT ce.pipeline_run_id) AS pipeline_runs,
  COALESCE(SUM(ce.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(ce.output_tokens), 0) AS total_output_tokens,
  COALESCE(SUM(ce.cost_usd), 0) AS total_cost
FROM cost_entries ce
JOIN accounts a ON ce.account_id = a.id
GROUP BY DATE(ce.timestamp), a.id, a.slug, a.name
ORDER BY date DESC, account_slug;

-- Cost summary per assistant
CREATE OR REPLACE VIEW v_costs_by_assistant AS
SELECT
  ast.id AS assistant_id,
  ast.external_id,
  ast.name AS assistant_name,
  a.id AS account_id,
  a.slug AS account_slug,
  COUNT(DISTINCT ce.pipeline_run_id) AS total_runs,
  COALESCE(SUM(ce.input_tokens), 0) AS total_input_tokens,
  COALESCE(SUM(ce.output_tokens), 0) AS total_output_tokens,
  COALESCE(SUM(ce.cost_usd), 0) AS total_cost,
  COALESCE(AVG(ce.cost_usd), 0) AS avg_cost_per_operation,
  MAX(ce.timestamp) AS last_activity
FROM cost_entries ce
JOIN assistants ast ON ce.assistant_id = ast.id
JOIN accounts a ON ce.account_id = a.id
GROUP BY ast.id, ast.external_id, ast.name, a.id, a.slug;

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

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS tr_update_pipeline_totals ON cost_entries;
CREATE TRIGGER tr_update_pipeline_totals
  AFTER INSERT ON cost_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_pipeline_run_totals();

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to accounts" ON accounts;
DROP POLICY IF EXISTS "Service role has full access to assistants" ON assistants;
DROP POLICY IF EXISTS "Service role has full access to pipeline_runs" ON pipeline_runs;
DROP POLICY IF EXISTS "Service role has full access to pipeline_steps" ON pipeline_steps;
DROP POLICY IF EXISTS "Service role has full access to cost_entries" ON cost_entries;
DROP POLICY IF EXISTS "Service role has full access to prompt_versions" ON prompt_versions;

-- Create policies that allow service_role full access
-- Note: service_role key bypasses RLS by default, but we add explicit policies for clarity

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
