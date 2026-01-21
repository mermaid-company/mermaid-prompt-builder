/**
 * Assistants Repository
 *
 * CRUD operations for the assistants table.
 */

import { getSupabaseClient } from "../client";
import { createLogger } from "@/lib/utils/logger";
import type {
  Assistant,
  AssistantInsert,
  AssistantUpdate,
} from "@/lib/types/supabase";

const logger = createLogger("repo-assistants");

/**
 * Create a new assistant
 */
export async function createAssistant(
  data: AssistantInsert
): Promise<Assistant> {
  const supabase = getSupabaseClient();
  const { data: assistant, error } = await supabase
    .from("assistants")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Failed to create assistant", { error: error.message });
    throw error;
  }

  logger.info("Created assistant", {
    externalId: assistant.external_id,
    accountId: assistant.account_id,
  });
  return assistant;
}

/**
 * Get assistant by ID
 */
export async function getAssistantById(id: string): Promise<Assistant | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("assistants")
    .select()
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get assistant by ID", { error: error.message });
    throw error;
  }

  return data;
}

/**
 * Get assistant by external ID and account ID
 */
export async function getAssistantByExternalId(
  accountId: string,
  externalId: string
): Promise<Assistant | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("assistants")
    .select()
    .eq("account_id", accountId)
    .eq("external_id", externalId)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get assistant by external ID", {
      error: error.message,
    });
    throw error;
  }

  return data;
}

/**
 * List assistants for an account
 */
export async function listAssistantsByAccount(
  accountId: string
): Promise<Assistant[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("assistants")
    .select()
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list assistants", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Update an assistant
 */
export async function updateAssistantRecord(
  id: string,
  data: AssistantUpdate
): Promise<Assistant> {
  const supabase = getSupabaseClient();
  const { data: assistant, error } = await supabase
    .from("assistants")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update assistant", { error: error.message });
    throw error;
  }

  logger.info("Updated assistant", { id });
  return assistant;
}

/**
 * Delete an assistant
 */
export async function deleteAssistant(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("assistants").delete().eq("id", id);

  if (error) {
    logger.error("Failed to delete assistant", { error: error.message });
    throw error;
  }

  logger.info("Deleted assistant", { id });
}

/**
 * Get or create assistant
 */
export async function getOrCreateAssistant(
  accountId: string,
  externalId: string,
  name: string
): Promise<Assistant> {
  const existing = await getAssistantByExternalId(accountId, externalId);
  if (existing) {
    return existing;
  }

  return createAssistant({
    account_id: accountId,
    external_id: externalId,
    name,
  });
}
