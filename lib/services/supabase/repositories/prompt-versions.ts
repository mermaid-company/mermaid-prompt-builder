/**
 * Prompt Versions Repository
 *
 * CRUD operations for the prompt_versions table.
 */

import { getSupabaseClient } from "../client";
import { createLogger } from "@/lib/utils/logger";
import type {
  PromptVersion,
  PromptVersionInsert,
  PromptVersionUpdate,
} from "@/lib/types/supabase";

const logger = createLogger("repo-prompt-versions");

/**
 * Create a new prompt version
 */
export async function createPromptVersion(
  data: PromptVersionInsert
): Promise<PromptVersion> {
  const supabase = getSupabaseClient();
  const { data: version, error } = await supabase
    .from("prompt_versions")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Failed to create prompt version", { error: error.message });
    throw error;
  }

  logger.info("Created prompt version", {
    version: version.version,
    assistantId: version.assistant_id,
  });
  return version;
}

/**
 * Get prompt version by ID
 */
export async function getPromptVersionById(
  id: string
): Promise<PromptVersion | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select()
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get prompt version", { error: error.message });
    throw error;
  }

  return data;
}

/**
 * Get latest version for an assistant
 */
export async function getLatestPromptVersion(
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

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get latest prompt version", {
      error: error.message,
    });
    throw error;
  }

  return data;
}

/**
 * Get next version number for an assistant
 */
export async function getNextVersionNumber(
  assistantId: string
): Promise<number> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("get_next_version_number", {
    p_assistant_id: assistantId,
  });

  if (error) {
    logger.error("Failed to get next version number", { error: error.message });
    // Fallback: query manually
    const latest = await getLatestPromptVersion(assistantId);
    return (latest?.version_number || 0) + 1;
  }

  return data;
}

/**
 * List versions for an assistant
 */
export async function listPromptVersions(
  assistantId: string
): Promise<PromptVersion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select()
    .eq("assistant_id", assistantId)
    .order("version_number", { ascending: false });

  if (error) {
    logger.error("Failed to list prompt versions", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * List versions for an account
 */
export async function listPromptVersionsByAccount(
  accountId: string,
  limit?: number
): Promise<PromptVersion[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from("prompt_versions")
    .select()
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    logger.error("Failed to list prompt versions by account", {
      error: error.message,
    });
    throw error;
  }

  return data || [];
}

/**
 * Update a prompt version
 */
export async function updatePromptVersion(
  id: string,
  data: PromptVersionUpdate
): Promise<PromptVersion> {
  const supabase = getSupabaseClient();
  const { data: version, error } = await supabase
    .from("prompt_versions")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update prompt version", { error: error.message });
    throw error;
  }

  logger.info("Updated prompt version", { id, status: data.status });
  return version;
}

/**
 * Update version status
 */
export async function updatePromptVersionStatus(
  id: string,
  status: "draft" | "final" | "deployed" | "archived"
): Promise<PromptVersion> {
  const updates: PromptVersionUpdate = { status };
  if (status === "deployed") {
    updates.deployed_at = new Date().toISOString();
  }
  return updatePromptVersion(id, updates);
}

/**
 * Get version by assistant and version string
 */
export async function getPromptVersionByVersion(
  assistantId: string,
  version: string
): Promise<PromptVersion | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select()
    .eq("assistant_id", assistantId)
    .eq("version", version)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get prompt version by version", {
      error: error.message,
    });
    throw error;
  }

  return data;
}

/**
 * Get deployed version for an assistant
 */
export async function getDeployedPromptVersion(
  assistantId: string
): Promise<PromptVersion | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("prompt_versions")
    .select()
    .eq("assistant_id", assistantId)
    .eq("status", "deployed")
    .order("deployed_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get deployed version", { error: error.message });
    throw error;
  }

  return data;
}
