/**
 * Run Supabase Migration Script
 *
 * Usage: node scripts/run-migration.mjs
 *
 * Connects directly to Supabase PostgreSQL and runs the migration.
 */

import pg from "pg";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASS;

  if (!supabaseUrl || !dbPassword) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_DB_PASS");
    process.exit(1);
  }

  // Extract project ref from URL (e.g., https://ozdwvyzvqrevkwlbouyf.supabase.co)
  const projectRef = supabaseUrl
    .replace("https://", "")
    .replace(".supabase.co", "");

  // Use direct connection format (not pooler) for DDL operations
  // Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
  const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

  console.log(`Connecting to Supabase project: ${projectRef}`);
  console.log(`Using direct connection: db.${projectRef}.supabase.co:5432`);

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("Connected to database!\n");

    // Read migration file
    const migrationPath = join(
      __dirname,
      "../supabase/migrations/20260120_001_initial_schema.sql",
    );
    console.log(`Reading migration file: ${migrationPath}\n`);
    const sql = readFileSync(migrationPath, "utf-8");

    console.log("Running migration...\n");

    // Run the entire migration as a single transaction
    await client.query("BEGIN");

    try {
      await client.query(sql);
      await client.query("COMMIT");
      console.log("\n✅ Migration completed successfully!");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }

    // Verify tables were created
    console.log("\nVerifying tables...");
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log("\nTables in database:");
    rows.forEach((row) => console.log(`  - ${row.table_name}`));

    // Verify views
    const { rows: views } = await client.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log("\nViews in database:");
    views.forEach((row) => console.log(`  - ${row.table_name}`));
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    if (error.detail) console.error("Detail:", error.detail);
    if (error.hint) console.error("Hint:", error.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
