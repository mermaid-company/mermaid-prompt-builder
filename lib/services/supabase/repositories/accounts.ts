/**
 * Accounts Repository
 *
 * CRUD operations for the accounts table.
 */

import { getSupabaseClient } from "../client";
import { createLogger } from "@/lib/utils/logger";
import type {
  Account,
  AccountInsert,
  AccountUpdate,
} from "@/lib/types/supabase";

const logger = createLogger("repo-accounts");

/**
 * Create a new account
 */
export async function createAccount(data: AccountInsert): Promise<Account> {
  const supabase = getSupabaseClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Failed to create account", { error: error.message });
    throw error;
  }

  logger.info("Created account", { slug: account.slug });
  return account;
}

/**
 * Get account by ID
 */
export async function getAccountById(id: string): Promise<Account | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .select()
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get account by ID", { error: error.message });
    throw error;
  }

  return data;
}

/**
 * Get account by slug
 */
export async function getAccountBySlug(slug: string): Promise<Account | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .select()
    .eq("slug", slug)
    .single();

  if (error && error.code !== "PGRST116") {
    logger.error("Failed to get account by slug", { error: error.message });
    throw error;
  }

  return data;
}

/**
 * List all accounts
 */
export async function listAccounts(): Promise<Account[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("accounts")
    .select()
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to list accounts", { error: error.message });
    throw error;
  }

  return data || [];
}

/**
 * Update an account
 */
export async function updateAccount(
  id: string,
  data: AccountUpdate
): Promise<Account> {
  const supabase = getSupabaseClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update account", { error: error.message });
    throw error;
  }

  logger.info("Updated account", { id });
  return account;
}

/**
 * Delete an account
 */
export async function deleteAccount(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    logger.error("Failed to delete account", { error: error.message });
    throw error;
  }

  logger.info("Deleted account", { id });
}

/**
 * Get or create account by slug
 */
export async function getOrCreateAccount(
  slug: string,
  name: string
): Promise<Account> {
  const existing = await getAccountBySlug(slug);
  if (existing) {
    return existing;
  }

  return createAccount({ slug, name });
}
