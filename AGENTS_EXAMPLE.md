# Agent Instructions

Guidelines for AI agents working on this codebase.

> ⚠️ **STRICT COMPLIANCE REQUIRED**: These are not suggestions. Every rule must be followed exactly. No exceptions, no shortcuts, no "it's just a small helper function." If a rule exists, enforce it.

## Quick Reference

| Need to...               | Look at...                          |
| ------------------------ | ----------------------------------- |
| Understand architecture  | `docs/ARCHITECTURE.md`              |
| Track session changes    | `docs/MEMENTO.md`                   |
| See refactoring progress | `docs/pipeline-refactoring-plan.md` |
| Add a new type           | `lib/builder/types/` (never inline) |
| Add S3 functionality     | `lib/builder/services/s3/`          |
| Add cost tracking        | `lib/builder/utils/cost-tracker.ts` |
| Add AWS billing data     | `lib/builder/utils/aws-costs.ts`    |
| Modify CLI exports       | `lib/builder/index.ts`              |

---

## Available Credentials (in `.env`)

| Variable                  | Service          | API Capabilities                          |
| ------------------------- | ---------------- | ----------------------------------------- |
| `AWS_ACCESS_KEY_ID`       | AWS              | S3, Transcribe, Cost Explorer             |
| `AWS_SECRET_ACCESS_KEY`   | AWS              | S3, Transcribe, Cost Explorer             |
| `ANTHROPIC_API_KEY`       | Anthropic Claude | Messages API (transcript processing)      |
| `ANTHROPIC_ADMIN_API_KEY` | Anthropic Admin  | Usage & Cost API (org-wide billing/usage) |

### What You Can Do With These:

**AWS Cost Explorer** - `lib/builder/utils/aws-costs.ts`:

- `fetchAWSCosts(startDate, endDate)` - Get actual AWS billing
- `getTranscribeCosts()` - Transcribe-specific costs
- Note: 24-48 hour delay before costs appear

**Anthropic Claude** - `lib/builder/services/claude/`:

- Token usage returned per request: `message.usage.input_tokens`, `message.usage.output_tokens`
- Costs calculated locally using `lib/builder/config.ts` pricing

**Anthropic Admin API** - `lib/builder/services/anthropic-admin/`:

- `getUsageSummary(start, end)` - Org-wide token usage by model
- `getCostSummary(start, end)` - Actual billed costs in USD
- `printAnthropicUsageReport()` - Display full usage report
- CLI: `npx tsx scripts/build-lesson.ts anthropic-usage`

---

## Core Principles

### 1. Double Check Work

- **Always verify** that created files exist and have no errors
- Run `get_errors` after making changes
- Run `npx tsc --noEmit` to verify TypeScript compiles
- Confirm imports work correctly
- Test that new code compiles before marking tasks complete

### 2. Always Update Plans

- Keep `docs/` documentation in sync with actual progress
- Mark completed phases as ✅ in plan documents
- Note any deviations from the original plan
- Update progress tables after completing work
- **Update `docs/MEMENTO.md`** with session changes
- **Search for "Checklist:"** to find all task lists in plan files
- Mark items with `[x]` when done, `[ ]` when pending

### 3. Keep Concerns Separate

| Layer           | Purpose                  | Example                        |
| --------------- | ------------------------ | ------------------------------ |
| **types/**      | ALL type definitions     | `JobCost`, `LessonMetadata`    |
| **services/**   | External integrations    | S3, Transcribe, Claude clients |
| **core/**       | Job lifecycle & patterns | `JobManager`, `Result<T,E>`    |
| **utils/**      | Utilities & helpers      | Logging, cost calculations     |
| **domain/**     | Business logic           | Transcript caching             |
| **pipeline.ts** | Orchestration            | Coordinates all steps          |
| **index.ts**    | Public API               | What CLI scripts import        |
| **app/**        | UI ONLY                  | React components, no logic     |

### 4. Check for Duplicated Functionality

- Before creating new code, search for existing implementations
- When refactoring, identify what can be reused vs. rewritten
- Legacy files should be clearly marked before deletion
- Consolidate similar functions rather than duplicating

### 5. Next.js / React Pages Rules

**CRITICAL**: The `app/` folder is for UI presentation ONLY.

#### ❌ NEVER do this in `app/*.tsx` files:

- Define interfaces/types (use `lib/builder/types/`)
- Define utility functions, even "small helpers" (use `lib/builder/utils/`)
- Import `fs`, `path`, or any Node.js modules directly
- Parse CSV/JSON files directly
- Define business logic or data transformations
- Duplicate functions that exist elsewhere
- Say "it's just a 2-line function" — move it anyway

#### ✅ ALWAYS do this for pages:

- Import data functions from `lib/builder`
- Import types from `lib/builder`
- Keep components focused on rendering
- Use server components to call `lib/builder` functions

#### Example - Correct Page Pattern:

```tsx
// app/logs/page.tsx
import { getJobRecords } from "@/lib/builder";
import type { JobRecord } from "@/lib/builder";

export default async function LogsPage() {
  const jobs = await getJobRecords(); // Data comes from lib/builder
  return <JobTable jobs={jobs} />; // UI only renders data
}
```

#### Before Creating Any Page:

1. ❓ Does the data function exist in `lib/builder`? → Use it
2. ❓ Need a new data function? → Add to `lib/builder/utils/`, export from `lib/builder/index.ts`
3. ❓ Need a new type? → Add to `lib/builder/types/`, export from barrel
4. ❓ Duplicating code? → STOP. Find and reuse existing code.

---

## Module Guide

### Types (`lib/builder/types/`)

**RULE**: All types live here. Never define interfaces inline in service files.

| File              | Contains                                                         |
| ----------------- | ---------------------------------------------------------------- |
| `s3.types.ts`     | S3VideoFile, S3Config, KeyResolution, S3UsageStats               |
| `job.types.ts`    | JobStatus, PipelineOptions, LessonBuildJob, JobCost, CostSummary |
| `lesson.types.ts` | LessonMetadata, CourseProductionScript, ContentBlock             |
| `errors.types.ts` | ErrorCode enum, PipelineError class                              |
| `prompts.ts`      | Claude AI prompts                                                |

**When adding a new type:**

1. Add to appropriate `.types.ts` file
2. Export from `types/index.ts` (barrel export)
3. Import in consuming files as `import type { MyType } from "../types/"`

### Services (`lib/builder/services/`)

Each service folder follows this pattern:

```
services/s3/
├── index.ts          # Barrel export
├── client.ts         # Client factory function
├── operations.ts     # Business operations
└── [others].ts       # Additional modules
```

**Available services:**

- `s3/` - Video listing, transcript storage, metadata parsing
- `transcribe/` - AWS Transcribe job management
- `claude/` - Claude AI transcript processing
- `audio/` - FFmpeg audio extraction

### Core (`lib/builder/core/`)

- `result.ts` - Functional error handling with `Result<T, E>`
- `job-manager.ts` - Job lifecycle, manifest management, deduplication

### Utils (`lib/builder/utils/`)

- `logger.ts` - Structured logging with component prefixes
- `cost-tracker.ts` - Cost calculations, CSV logging
- `aws-costs.ts` - AWS Cost Explorer integration

### Public API (`lib/builder/index.ts`)

**RULE**: This is the ONLY file external consumers (like `scripts/build-lesson.ts`) should import from.

If you add a function that CLI scripts need, you MUST:

1. Export it from the module's barrel file
2. Re-export it from `lib/builder/index.ts`
3. Verify with `npx tsc --noEmit`

---

## Import Rules

### For CLI Scripts (External)

```typescript
// ✅ CORRECT - import from barrel
import { processVideo, loadManifest } from "../lib/builder";

// ❌ WRONG - don't import from internal paths
import { processVideo } from "../lib/builder/pipeline";
```

### For Internal Modules

```typescript
// ✅ CORRECT - relative imports with types from types/
import type { JobCost, LessonMetadata } from "../types/";
import { createS3Client } from "../services/s3";
import { logJobCost } from "../utils/cost-tracker";

// ❌ WRONG - importing types from service files
import type { JobCost } from "../services/transcribe/operations";
```

---

## Adding New Functionality

### Adding a New Service

1. Create folder: `lib/builder/services/myservice/`
2. Create files:
   - `client.ts` - Factory function
   - `operations.ts` - Business logic
   - `index.ts` - Barrel export
3. Add types to `types/` folder
4. Export from `services/index.ts`
5. If CLI needs it, add to `lib/builder/index.ts`

### Adding a New Type

1. Find appropriate file in `types/` or create new one
2. Add interface/type with JSDoc comments
3. Ensure it's exported from `types/index.ts`
4. Update consuming files to import from `types/`

### Adding a New Utility

1. Create or update file in `utils/`
2. Export from `utils/index.ts`
3. If CLI needs it, add to `lib/builder/index.ts`

---

## Testing Checklist

Before completing ANY task:

1. ✅ `npx tsc --noEmit` - No TypeScript errors
2. ✅ `get_errors` on modified files - No Pylance/ESLint issues
3. ✅ Verify barrel exports are updated
4. ✅ Verify `lib/builder/index.ts` exports what CLI needs
5. ✅ Update documentation if architecture changed

### Full Integration Test

```bash
npx tsx scripts/build-lesson.ts list      # Lists S3 videos
npx tsx scripts/build-lesson.ts status    # Shows processing status
npx tsx scripts/build-lesson.ts costs     # Shows cost summary
```

---

## Plan Navigation & Execution

### Finding Plans

- Plans are in `docs/` folder
- Architecture overview: `docs/ARCHITECTURE.md`
- Refactoring plan: `docs/pipeline-refactoring-plan.md`
- Search for `## Progress Tracking` to find status tables
- Search for `**Checklist:**` to find actionable items

### Execution Workflow

1. **READ** the plan first - understand the full scope
2. **IDENTIFY** remaining tasks (unchecked `[ ]` items)
3. **EXECUTE** one task at a time
4. **VERIFY** with `npx tsc --noEmit` after each change
5. **UPDATE** the checklist item to `[x]`
6. **COMMIT** logical chunks (don't leave work half-done)

---

## Legacy Files

The following files are DEPRECATED and should NOT be used for new code:

| File                    | Replaced by                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `claude-service.ts`     | `services/claude/`                                                     |
| `transcribe-service.ts` | `services/transcribe/`                                                 |
| `s3-service.ts`         | `services/s3/`                                                         |
| `audio-service.ts`      | `services/audio/`                                                      |
| `cost-service.ts`       | `utils/cost-tracker.ts` + `utils/aws-costs.ts` + `core/job-manager.ts` |

These files still exist for backwards compatibility but will be removed once all references are migrated.

---

## Error Handling

- Use `Result<T, E>` pattern from `core/result.ts` for operations that can fail
- Create specific error codes in `types/errors.types.ts`
- Always include suggestions for user-facing errors

```typescript
import { ok, err, Result } from "../core/result";
import { PipelineError, ErrorCode } from "../types/";

async function myOperation(): Promise<Result<Data, PipelineError>> {
  try {
    // ...
    return ok(data);
  } catch (error) {
    return err(
      new PipelineError("Operation failed", ErrorCode.S3_KEY_NOT_FOUND, {
        suggestion: "Check if the file exists",
      })
    );
  }
}
```
