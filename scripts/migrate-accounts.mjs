/**
 * Account Migration Script
 *
 * Migrates existing file-based accounts to Supabase.
 * Run with: node scripts/migrate-accounts.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SK;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const accountsDir = path.join(__dirname, "..", "lib", "accounts");

async function migrateAccounts() {
  console.log("Starting account migration...\n");

  // Find all account directories
  const entries = fs.readdirSync(accountsDir, { withFileTypes: true });
  const accountDirs = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith(".")
  );

  console.log(`Found ${accountDirs.length} account(s) to migrate\n`);

  for (const dir of accountDirs) {
    const accountSlug = dir.name;
    const configPath = path.join(accountsDir, accountSlug, "config.ts");

    console.log(`\n--- Migrating: ${accountSlug} ---`);

    // Check if config exists
    if (!fs.existsSync(configPath)) {
      console.log(`  No config.ts found, skipping`);
      continue;
    }

    // Parse config (basic extraction)
    const configContent = fs.readFileSync(configPath, "utf-8");
    const nameMatch = configContent.match(/name:\s*["']([^"']+)["']/);
    const descMatch = configContent.match(/description:\s*["']([^"']+)["']/);

    const accountName = nameMatch ? nameMatch[1] : accountSlug;
    const accountDesc = descMatch ? descMatch[1] : "";

    // Check if account already exists in Supabase
    const { data: existingAccount } = await supabase
      .from("accounts")
      .select()
      .eq("slug", accountSlug)
      .single();

    let account;

    if (existingAccount) {
      console.log(`  Account already exists in Supabase`);
      account = existingAccount;
    } else {
      // Create account in Supabase
      const { data: newAccount, error: accountError } = await supabase
        .from("accounts")
        .insert({
          slug: accountSlug,
          name: accountName,
          settings: { description: accountDesc, migratedFromFile: true },
        })
        .select()
        .single();

      if (accountError) {
        console.error(`  Failed to create account: ${accountError.message}`);
        continue;
      }

      console.log(`  Created account: ${newAccount.id}`);
      account = newAccount;
    }

    // Find assistants
    const assistantsDir = path.join(accountsDir, accountSlug, "assistants");
    if (!fs.existsSync(assistantsDir)) {
      console.log(`  No assistants directory found`);
      continue;
    }

    const assistantDirs = fs
      .readdirSync(assistantsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    console.log(`  Found ${assistantDirs.length} assistant(s)`);

    for (const assistantDir of assistantDirs) {
      const assistantId = assistantDir.name;

      // Check if assistant exists
      const { data: existingAssistant } = await supabase
        .from("assistants")
        .select()
        .eq("account_id", account.id)
        .eq("external_id", assistantId)
        .single();

      if (existingAssistant) {
        console.log(`    Assistant ${assistantId} already exists`);
        continue;
      }

      // Create assistant
      const { data: newAssistant, error: assistantError } = await supabase
        .from("assistants")
        .insert({
          account_id: account.id,
          external_id: assistantId,
          name: assistantId,
          settings: { migratedFromFile: true },
        })
        .select()
        .single();

      if (assistantError) {
        console.error(
          `    Failed to create assistant: ${assistantError.message}`
        );
        continue;
      }

      console.log(`    Created assistant: ${newAssistant.id}`);

      // Find versions
      const versionsPath = path.join(assistantsDir, assistantId);
      const versionDirs = fs
        .readdirSync(versionsPath, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith("v"));

      for (const versionDir of versionDirs) {
        const version = versionDir.name;
        const injectionPath = path.join(
          versionsPath,
          version,
          "injection.ts"
        );

        if (!fs.existsSync(injectionPath)) {
          continue;
        }

        const injectionContent = fs.readFileSync(injectionPath, "utf-8");

        // Extract prompt content from injection file
        const promptMatch = injectionContent.match(
          /SYSTEM_PROMPT\s*=\s*`([^`]+)`/s
        );
        const promptContent = promptMatch
          ? promptMatch[1]
          : "// Could not extract prompt";

        // Check if version exists
        const { data: existingVersion } = await supabase
          .from("prompt_versions")
          .select()
          .eq("assistant_id", newAssistant.id)
          .eq("version", version)
          .single();

        if (existingVersion) {
          console.log(`      Version ${version} already exists`);
          continue;
        }

        // Create a dummy pipeline run for the migrated version
        const { data: pipelineRun } = await supabase
          .from("pipeline_runs")
          .insert({
            account_id: account.id,
            assistant_id: newAssistant.id,
            pipeline_id: `migration_${accountSlug}_${assistantId}_${version}_${Date.now()}`,
            briefing_id: `migrated_${version}`,
            status: "completed",
            briefing_data: { migrated: true },
          })
          .select()
          .single();

        if (!pipelineRun) {
          console.error(`      Failed to create pipeline run for migration`);
          continue;
        }

        // Create prompt version
        const versionNumber = parseInt(version.replace("v", ""), 10) || 1;
        const { error: versionError } = await supabase
          .from("prompt_versions")
          .insert({
            pipeline_run_id: pipelineRun.id,
            account_id: account.id,
            assistant_id: newAssistant.id,
            version,
            version_number: versionNumber,
            prompt_content: promptContent,
            prompt_hash: hashString(promptContent),
            injection_content: injectionContent,
            injection_file_path: injectionPath,
            briefing_hash: "migrated",
            total_iterations: 1,
            status: "final",
          });

        if (versionError) {
          console.error(
            `      Failed to create version: ${versionError.message}`
          );
        } else {
          console.log(`      Created version: ${version}`);
        }
      }
    }
  }

  console.log("\n\nMigration complete!");
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

migrateAccounts().catch(console.error);
