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

// Single cached client instance
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

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SK
  );
}
