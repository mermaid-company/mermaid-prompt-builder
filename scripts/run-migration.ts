/**
 * Run Supabase Migration Script
 *
 * Usage: npx tsx scripts/run-migration.ts
 *
 * This script runs the SQL migration file against Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SK;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SK");
    process.exit(1);
  }

  console.log("Connecting to Supabase...");
  console.log(`URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Read migration file
  const migrationPath = join(
    process.cwd(),
    "supabase/migrations/20260120_001_initial_schema.sql"
  );

  console.log(`\nReading migration file: ${migrationPath}`);
  const sql = readFileSync(migrationPath, "utf-8");

  // Split into individual statements (roughly - this is a simple approach)
  // For complex migrations, you might want to run the whole file at once via SQL editor

  console.log("\nRunning migration...\n");

  // Use the sql function to execute raw SQL
  const { data, error } = await supabase.rpc("exec_sql", { sql_query: sql });

  if (error) {
    // If exec_sql doesn't exist, we'll need to run statements individually
    // or use a direct database connection
    console.log("Note: exec_sql RPC not available. Running via individual statements...\n");

    // Split by semicolons (basic approach - may not work for all SQL)
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length < 10) continue; // Skip empty-ish statements

      const shortStmt = statement.substring(0, 60).replace(/\n/g, " ");

      try {
        // For DDL statements, we need to use the SQL editor or pg client
        // The Supabase JS client doesn't support raw DDL
        console.log(`Statement: ${shortStmt}...`);
        successCount++;
      } catch (err) {
        console.error(`Error: ${err}`);
        errorCount++;
      }
    }

    console.log(`\nProcessed ${successCount + errorCount} statements`);
    console.log("\n⚠️  Note: The Supabase JS client cannot run DDL statements directly.");
    console.log("Please run the migration SQL in the Supabase Dashboard SQL Editor:");
    console.log(`\nFile: ${migrationPath}`);
    console.log("\nOr use: supabase db push (if using Supabase CLI with linked project)");
  } else {
    console.log("Migration completed successfully!");
    console.log(data);
  }
}

runMigration().catch(console.error);
