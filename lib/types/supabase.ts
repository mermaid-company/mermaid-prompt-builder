/**
 * Supabase Database Types
 *
 * Generated from the database schema for type-safe queries.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          slug: string;
          name: string;
          mermaid_token_hash: string | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          mermaid_token_hash?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          mermaid_token_hash?: string | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      assistants: {
        Row: {
          id: string;
          account_id: string;
          external_id: string;
          name: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          external_id: string;
          name: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          external_id?: string;
          name?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      pipeline_runs: {
        Row: {
          id: string;
          account_id: string;
          assistant_id: string;
          pipeline_id: string;
          briefing_id: string;
          status: "running" | "completed" | "failed";
          error_message: string | null;
          briefing_data: Json;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          total_input_tokens: number;
          total_output_tokens: number;
          total_cost_usd: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          assistant_id: string;
          pipeline_id: string;
          briefing_id: string;
          status: "running" | "completed" | "failed";
          error_message?: string | null;
          briefing_data: Json;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          total_input_tokens?: number;
          total_output_tokens?: number;
          total_cost_usd?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          assistant_id?: string;
          pipeline_id?: string;
          briefing_id?: string;
          status?: "running" | "completed" | "failed";
          error_message?: string | null;
          briefing_data?: Json;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          total_input_tokens?: number;
          total_output_tokens?: number;
          total_cost_usd?: number;
          created_at?: string;
        };
      };
      pipeline_steps: {
        Row: {
          id: string;
          pipeline_run_id: string;
          step_name: string;
          step_order: number;
          status: "pending" | "running" | "completed" | "failed";
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          duration_ms: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          pipeline_run_id: string;
          step_name: string;
          step_order: number;
          status: "pending" | "running" | "completed" | "failed";
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          duration_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          pipeline_run_id?: string;
          step_name?: string;
          step_order?: number;
          status?: "pending" | "running" | "completed" | "failed";
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          duration_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      cost_entries: {
        Row: {
          id: string;
          pipeline_run_id: string;
          pipeline_step_id: string | null;
          account_id: string;
          assistant_id: string;
          operation: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          cache_read_tokens: number;
          cache_write_tokens: number;
          cost_usd: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          pipeline_run_id: string;
          pipeline_step_id?: string | null;
          account_id: string;
          assistant_id: string;
          operation: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          cache_read_tokens?: number;
          cache_write_tokens?: number;
          cost_usd: number;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          pipeline_run_id?: string;
          pipeline_step_id?: string | null;
          account_id?: string;
          assistant_id?: string;
          operation?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          cache_read_tokens?: number;
          cache_write_tokens?: number;
          cost_usd?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
      prompt_versions: {
        Row: {
          id: string;
          pipeline_run_id: string;
          account_id: string;
          assistant_id: string;
          version: string;
          version_number: number;
          prompt_content: string;
          prompt_hash: string;
          injection_content: string;
          injection_file_path: string | null;
          briefing_hash: string;
          total_iterations: number;
          final_score: number | null;
          status: "draft" | "final" | "deployed" | "archived";
          deployed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pipeline_run_id: string;
          account_id: string;
          assistant_id: string;
          version: string;
          version_number: number;
          prompt_content: string;
          prompt_hash: string;
          injection_content: string;
          injection_file_path?: string | null;
          briefing_hash: string;
          total_iterations?: number;
          final_score?: number | null;
          status?: "draft" | "final" | "deployed" | "archived";
          deployed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          pipeline_run_id?: string;
          account_id?: string;
          assistant_id?: string;
          version?: string;
          version_number?: number;
          prompt_content?: string;
          prompt_hash?: string;
          injection_content?: string;
          injection_file_path?: string | null;
          briefing_hash?: string;
          total_iterations?: number;
          final_score?: number | null;
          status?: "draft" | "final" | "deployed" | "archived";
          deployed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      v_pipeline_cost_breakdown: {
        Row: {
          pipeline_run_id: string;
          pipeline_id: string;
          account_id: string;
          assistant_id: string;
          account_slug: string;
          assistant_external_id: string;
          status: string;
          duration_ms: number | null;
          started_at: string;
          completed_at: string | null;
          generation_cost: number;
          analysis_cost: number;
          improvement_cost: number;
          generation_input_tokens: number;
          generation_output_tokens: number;
          analysis_input_tokens: number;
          analysis_output_tokens: number;
          improvement_input_tokens: number;
          improvement_output_tokens: number;
          total_cost: number;
          total_input_tokens: number;
          total_output_tokens: number;
        };
      };
      v_daily_costs_by_account: {
        Row: {
          date: string;
          account_id: string;
          account_slug: string;
          account_name: string;
          pipeline_runs: number;
          total_input_tokens: number;
          total_output_tokens: number;
          total_cost: number;
        };
      };
      v_costs_by_assistant: {
        Row: {
          assistant_id: string;
          external_id: string;
          assistant_name: string;
          account_id: string;
          account_slug: string;
          total_runs: number;
          total_input_tokens: number;
          total_output_tokens: number;
          total_cost: number;
          avg_cost_per_operation: number;
          last_activity: string | null;
        };
      };
    };
    Functions: {
      get_next_version_number: {
        Args: { p_assistant_id: string };
        Returns: number;
      };
    };
  };
}

// Convenience type aliases
export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
export type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];

export type Assistant = Database["public"]["Tables"]["assistants"]["Row"];
export type AssistantInsert = Database["public"]["Tables"]["assistants"]["Insert"];
export type AssistantUpdate = Database["public"]["Tables"]["assistants"]["Update"];

export type PipelineRun = Database["public"]["Tables"]["pipeline_runs"]["Row"];
export type PipelineRunInsert = Database["public"]["Tables"]["pipeline_runs"]["Insert"];
export type PipelineRunUpdate = Database["public"]["Tables"]["pipeline_runs"]["Update"];

export type PipelineStep = Database["public"]["Tables"]["pipeline_steps"]["Row"];
export type PipelineStepInsert = Database["public"]["Tables"]["pipeline_steps"]["Insert"];
export type PipelineStepUpdate = Database["public"]["Tables"]["pipeline_steps"]["Update"];

export type CostEntryRow = Database["public"]["Tables"]["cost_entries"]["Row"];
export type CostEntryInsert = Database["public"]["Tables"]["cost_entries"]["Insert"];
export type CostEntryUpdate = Database["public"]["Tables"]["cost_entries"]["Update"];

export type PromptVersion = Database["public"]["Tables"]["prompt_versions"]["Row"];
export type PromptVersionInsert = Database["public"]["Tables"]["prompt_versions"]["Insert"];
export type PromptVersionUpdate = Database["public"]["Tables"]["prompt_versions"]["Update"];

export type PipelineCostBreakdown = Database["public"]["Views"]["v_pipeline_cost_breakdown"]["Row"];
export type DailyCostByAccount = Database["public"]["Views"]["v_daily_costs_by_account"]["Row"];
export type CostByAssistant = Database["public"]["Views"]["v_costs_by_assistant"]["Row"];
