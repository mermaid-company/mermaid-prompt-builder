/**
 * Test Supabase Client Connection
 *
 * Usage: node scripts/test-supabase-client.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

async function testConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SK;

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SK");
    process.exit(1);
  }

  console.log(`Connecting to: ${url}`);

  const supabase = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Test query - list tables
  console.log("\nTesting connection...");

  // Query accounts table
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .limit(5);

  if (accountsError) {
    console.error("Error querying accounts:", accountsError.message);
    process.exit(1);
  }

  console.log(`\n✅ Connected successfully!`);
  console.log(`\nAccounts in database: ${accounts.length}`);

  if (accounts.length > 0) {
    console.log("\nSample accounts:");
    accounts.forEach(a => console.log(`  - ${a.slug}: ${a.name}`));
  }

  // Test inserting and deleting a test account
  console.log("\nTesting insert/delete...");

  const testSlug = `test-account-${Date.now()}`;
  const { data: inserted, error: insertError } = await supabase
    .from("accounts")
    .insert({ slug: testSlug, name: "Test Account" })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting test account:", insertError.message);
    process.exit(1);
  }

  console.log(`  Inserted: ${inserted.slug}`);

  // Delete the test account
  const { error: deleteError } = await supabase
    .from("accounts")
    .delete()
    .eq("id", inserted.id);

  if (deleteError) {
    console.error("Error deleting test account:", deleteError.message);
    process.exit(1);
  }

  console.log(`  Deleted: ${inserted.slug}`);

  console.log("\n✅ All tests passed!");
}

testConnection().catch(console.error);
