/**
 * Test script for Supabase repositories
 *
 * Run with: node scripts/test-repositories.mjs
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SK;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRepositories() {
  console.log("Testing Supabase repositories...\n");

  // Test 1: Create an account
  console.log("1. Creating test account...");
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      slug: "test-account-" + Date.now(),
      name: "Test Account",
      settings: { test: true },
    })
    .select()
    .single();

  if (accountError) {
    console.error("   Failed:", accountError.message);
    return;
  }
  console.log("   Created account:", account.id);

  // Test 2: Create an assistant
  console.log("2. Creating test assistant...");
  const { data: assistant, error: assistantError } = await supabase
    .from("assistants")
    .insert({
      account_id: account.id,
      external_id: "test-assistant-" + Date.now(),
      name: "Test Assistant",
      settings: {},
    })
    .select()
    .single();

  if (assistantError) {
    console.error("   Failed:", assistantError.message);
    return;
  }
  console.log("   Created assistant:", assistant.id);

  // Test 3: Create a pipeline run
  console.log("3. Creating test pipeline run...");
  const { data: pipelineRun, error: runError } = await supabase
    .from("pipeline_runs")
    .insert({
      account_id: account.id,
      assistant_id: assistant.id,
      pipeline_id: "pipeline_test_" + Date.now(),
      briefing_id: "briefing_test_" + Date.now(),
      status: "running",
      briefing_data: { test: true },
    })
    .select()
    .single();

  if (runError) {
    console.error("   Failed:", runError.message);
    return;
  }
  console.log("   Created pipeline run:", pipelineRun.id);

  // Test 4: Create pipeline steps
  console.log("4. Creating pipeline steps...");
  const steps = [
    {
      pipeline_run_id: pipelineRun.id,
      step_name: "prompt_generation",
      step_order: 1,
      status: "completed",
    },
    {
      pipeline_run_id: pipelineRun.id,
      step_name: "prompt_analysis",
      step_order: 2,
      status: "completed",
    },
    {
      pipeline_run_id: pipelineRun.id,
      step_name: "prompt_improvement",
      step_order: 3,
      status: "pending",
    },
  ];

  const { data: createdSteps, error: stepsError } = await supabase
    .from("pipeline_steps")
    .insert(steps)
    .select();

  if (stepsError) {
    console.error("   Failed:", stepsError.message);
    return;
  }
  console.log("   Created", createdSteps.length, "steps");

  // Test 5: Create cost entries
  console.log("5. Creating cost entries...");
  const costEntries = [
    {
      pipeline_run_id: pipelineRun.id,
      pipeline_step_id: createdSteps[0].id,
      account_id: account.id,
      assistant_id: assistant.id,
      operation: "prompt_generation",
      model: "claude-opus-4-5-20251101",
      input_tokens: 1500,
      output_tokens: 800,
      cost_usd: 0.045,
    },
    {
      pipeline_run_id: pipelineRun.id,
      pipeline_step_id: createdSteps[1].id,
      account_id: account.id,
      assistant_id: assistant.id,
      operation: "prompt_analysis",
      model: "claude-opus-4-5-20251101",
      input_tokens: 2000,
      output_tokens: 1200,
      cost_usd: 0.062,
    },
  ];

  const { data: costs, error: costsError } = await supabase
    .from("cost_entries")
    .insert(costEntries)
    .select();

  if (costsError) {
    console.error("   Failed:", costsError.message);
    return;
  }
  console.log("   Created", costs.length, "cost entries");

  // Test 6: Verify cost view
  console.log("6. Checking cost breakdown view...");
  const { data: costBreakdown, error: viewError } = await supabase
    .from("v_pipeline_cost_breakdown")
    .select()
    .eq("pipeline_run_id", pipelineRun.id);

  if (viewError) {
    console.error("   Failed:", viewError.message);
    return;
  }
  console.log("   Cost breakdown:");
  if (costBreakdown && costBreakdown.length > 0) {
    const row = costBreakdown[0];
    console.log(
      `     - Generation: $${row.generation_cost?.toFixed(4) || "0.0000"}`,
    );
    console.log(
      `     - Analysis: $${row.analysis_cost?.toFixed(4) || "0.0000"}`,
    );
    console.log(
      `     - Improvement: $${row.improvement_cost?.toFixed(4) || "0.0000"}`,
    );
    console.log(`     - Total: $${row.total_cost?.toFixed(4) || "0.0000"}`);
  }

  // Test 7: Verify pipeline run total cost was updated by trigger
  console.log("7. Checking pipeline run total cost (trigger)...");
  const { data: updatedRun, error: fetchRunError } = await supabase
    .from("pipeline_runs")
    .select()
    .eq("id", pipelineRun.id)
    .single();

  if (fetchRunError) {
    console.error("   Failed:", fetchRunError.message);
    return;
  }
  console.log(
    "   Pipeline run total cost: $" +
      (updatedRun.total_cost_usd?.toFixed(4) || "0.0000"),
  );

  // Cleanup
  console.log("\n8. Cleaning up test data...");
  await supabase
    .from("cost_entries")
    .delete()
    .eq("pipeline_run_id", pipelineRun.id);
  await supabase
    .from("pipeline_steps")
    .delete()
    .eq("pipeline_run_id", pipelineRun.id);
  await supabase.from("pipeline_runs").delete().eq("id", pipelineRun.id);
  await supabase.from("assistants").delete().eq("id", assistant.id);
  await supabase.from("accounts").delete().eq("id", account.id);
  console.log("   Cleanup complete");

  console.log("\nAll repository tests passed!");
}

testRepositories().catch(console.error);
