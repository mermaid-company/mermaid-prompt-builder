# Implementation Plan: Mermaid Prompt Builder

> Pipeline for briefing ingestion, PRISMA-based prompt generation, and Anthropic Claude assistant management with cost tracking.

## Overview

This plan outlines the conversion of the current project into a Next.js App Router application with:

- Webhook-based briefing ingestion
- PRISMA system for briefing → prompt transformation
- Claude Opus 4.5 for all AI operations
- Analysis + improvement iteration before final output
- Injection files for manual UI execution
- Google Sheets cost tracking (IARA-ADMIN shared drive)
- Prompt version tracking and audit trail
- Secure account/assistant configuration management

---

## Environment Variables

```bash
# .env.local
WEBHOOK_SECRET=                           # Webhook signature validation
MERMAID_TOKEN=                            # Legacy/internal token
MERMAID_ASSISTANT_ID=                     # Default assistant UUID
MERMAID_ACCOUNT_ID=                       # Default account UUID
ANTHROPIC_API_KEY=                        # Claude API key
ANTHROPIC_ADMIN_API_KEY=                  # Anthropic Admin API (usage/billing)
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON=  # Google Drive/Sheets access
```

---

## Phase 1: Project Setup & Structure

**Goal**: Convert to Next.js App Router project with proper TypeScript configuration.

### Checklist:

- [ ] Initialize Next.js project with App Router (no `src/` folder)
- [ ] Configure TypeScript with strict mode
- [ ] Set up ESLint and Prettier
- [ ] Create folder structure:
  ```
  app/
    api/
      webhook/
        briefing/route.ts
      assistants/
        [accountId]/
          [assistantId]/route.ts
      cost/
        route.ts
    preview/
      [accountId]/
        [assistantId]/
          page.tsx
          [version]/page.tsx
    page.tsx
    layout.tsx
  components/
    ui/
    AssistantPreview.tsx
    PromptPreview.tsx
    InjectionRunner.tsx
    CostDashboard.tsx
    VersionHistory.tsx
  lib/
    types/
      index.ts
      briefing.types.ts
      assistant.types.ts
      prompt.types.ts
      account.types.ts
      api.types.ts
      cost.types.ts
      prisma-system.types.ts
    services/
      index.ts
      webhook/
      anthropic/
      prompt-builder/
      accounts/
      google/
    accounts/
      _template/
    utils/
      logger.ts
      validation.ts
      cost-tracker.ts
    config/
      prisma-system.ts
  docs/
    ARCHITECTURE.md
    MEMENTO.md
  ```
- [ ] Create `.env.local.example` with required variables
- [ ] Update `package.json` with dependencies
- [ ] Create `tsconfig.json` with path aliases

### Dependencies:

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@anthropic-ai/sdk": "^0.x",
    "googleapis": "^130.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "@types/react": "^18.x",
    "typescript": "^5.x",
    "eslint": "^8.x",
    "eslint-config-next": "^14.x"
  }
}
```

---

## Phase 2: Type Definitions

**Goal**: Define all TypeScript interfaces and types with concise, precise taxonomy.

### Checklist:

- [ ] Create `lib/types/briefing.types.ts`
  - `Briefing` - Core briefing data structure (business info, client profile, tone)
  - `BriefingPayload` - Webhook payload wrapper
  - `BriefingSection` - Individual section of briefing
  - `WebhookHeaders` - Expected webhook headers
  
- [ ] Create `lib/types/assistant.types.ts`
  - `Assistant` - Claude assistant representation
  - `AssistantConfig` - Local assistant configuration
  - `AssistantVersion` - Version tracking with metadata
  - `AssistantOperation` - Create/Update/Get operations enum
  
- [ ] Create `lib/types/prompt.types.ts`
  - `PromptTemplate` - PRISMA-based template structure
  - `PromptVariables` - Template variable mapping
  - `GeneratedPrompt` - Output prompt with metadata
  - `InjectionFile` - Injection file structure
  - `PromptIteration` - Analysis iteration tracking
  
- [ ] Create `lib/types/account.types.ts`
  - `Account` - Account metadata
  - `AccountConfig` - Full account configuration
  - `AccountCredentials` - API keys (server-only)
  
- [ ] Create `lib/types/api.types.ts`
  - `APIResponse<T>` - Generic API response
  - `APIError` - Error class with codes
  - `WebhookValidationResult`
  
- [ ] Create `lib/types/cost.types.ts`
  - `TokenUsage` - Input/output token counts
  - `CostEntry` - Single cost log entry
  - `CostSummary` - Aggregated cost data
  - `SheetRow` - Google Sheets row structure

- [ ] Create `lib/types/prisma-system.types.ts`
  - `PRISMAPhase` - Perception/Context/Permission phases
  - `PRISMAPattern` - Language pattern definitions
  - `PRISMAOutput` - Generated PRISMA content

- [ ] Create `lib/types/index.ts` barrel export

---

## Phase 3: Core Services

**Goal**: Implement service layer with strict separation of concerns.

### 3.1 Webhook Service

**Checklist:**

- [ ] Create `lib/services/webhook/index.ts`
- [ ] Create `lib/services/webhook/validation.ts`
  - `validateSignature(headers, body)` - Verify webhook authenticity
  - `parsePayload(body)` - Parse and validate with Zod
- [ ] Create `lib/services/webhook/schemas.ts` - Zod schemas

### 3.2 Anthropic Service

**Checklist:**

- [ ] Create `lib/services/anthropic/index.ts`
- [ ] Create `lib/services/anthropic/client.ts`
  - `createClient(accountId)` - Create Anthropic client with account credentials
  - Model: `claude-opus-4-5-20251101`
- [ ] Create `lib/services/anthropic/messages.ts`
  - `sendMessage(prompt, options)` - Send message to Claude
  - `sendMessageWithThinking(prompt, options)` - Extended thinking mode
- [ ] Create `lib/services/anthropic/usage.ts`
  - `extractTokenUsage(response)` - Parse token usage from response
  - `calculateCost(usage)` - Calculate USD cost

### 3.3 Prompt Builder Service (PRISMA Integration)

**Checklist:**

- [ ] Create `lib/services/prompt-builder/index.ts`
- [ ] Create `lib/services/prompt-builder/prisma-system.ts`
  - `loadPRISMASystem()` - Load PRISMA XML configuration
  - `applyPRISMAToContext(briefing)` - Generate PRISMA context
- [ ] Create `lib/services/prompt-builder/generator.ts`
  - `generatePromptFromBriefing(briefing)` - Initial prompt generation
  - `analyzePrompt(prompt)` - Analysis step
  - `improvePrompt(prompt, analysis)` - Improvement iteration
  - `createFinalPrompt(prompt)` - Finalize for injection
- [ ] Create `lib/services/prompt-builder/injection.ts`
  - `createInjectionFile(prompt, config)` - Generate injection.ts
  - `formatForClaude(prompt)` - Format for API consumption
- [ ] Create `lib/services/prompt-builder/versioning.ts`
  - `getNextVersion(accountId, assistantId)`
  - `saveVersion(accountId, assistantId, version, content)`
  - `listVersions(accountId, assistantId)`

### 3.4 Google Services

**Checklist:**

- [ ] Create `lib/services/google/index.ts`
- [ ] Create `lib/services/google/auth.ts`
  - `getAuthClient()` - Service account authentication
  - `getDriveClient()` - Google Drive API client
  - `getSheetsClient()` - Google Sheets API client
- [ ] Create `lib/services/google/drive.ts`
  - `ensureFolder(name, parentId)` - Create folder if not exists
  - `uploadFile(name, content, folderId)` - Upload file
  - `listFiles(folderId)` - List folder contents
  - Shared Drive: IARA-ADMIN
- [ ] Create `lib/services/google/sheets.ts`
  - `appendCostEntry(entry)` - Log cost to tracking sheet
  - `appendVersionEntry(entry)` - Log version to tracking sheet
  - `getCostSummary(dateRange)` - Aggregate cost data
  - `getVersionHistory(accountId, assistantId)` - Get version list

### 3.5 Accounts Service

**Checklist:**

- [ ] Create `lib/services/accounts/index.ts`
- [ ] Create `lib/services/accounts/registry.ts`
  - `getAccount(accountId)`
  - `listAccounts()`
  - `validateAccountExists(accountId)`
- [ ] Create `lib/services/accounts/config.ts`
  - `loadAccountConfig(accountId)` - Server-only
  - `getAccountCredentials(accountId)` - Server-only, never expose

---

## Phase 4: PRISMA System Configuration

**Goal**: Load and manage PRISMA system for prompt generation.

### Checklist:

- [ ] Create `lib/config/prisma-system.ts`
  - Load PRISMA XML from `docs/prisma-system.xml`
  - Parse into typed structure
  - Expose utility functions for each phase
- [ ] Create PRISMA prompt template
  - System message structure
  - Briefing → prompt transformation rules
  - Analysis criteria
  - Improvement guidelines

### PRISMA Phases:

1. **Perception Mirror (Fase 1)** - Identity/history/capability signals
2. **Context Reframe (Fase 2)** - Industry/cultural/temporal/economic shifts
3. **Permission Grant (Fase 3)** - Deservedness/fear/validation/perfectionism

---

## Phase 5: Cost Tracking System

**Goal**: Track all AI operations with Google Sheets integration.

### Checklist:

- [ ] Create cost tracking utility `lib/utils/cost-tracker.ts`
  - `logCost(operation, usage, metadata)` - Log to Sheets
  - `calculateAnthropicCost(inputTokens, outputTokens, model)` - USD calculation

- [ ] Set up Google Sheets structure in IARA-ADMIN:
  ```
  IARA-ADMIN/
    mermaid-prompt-builder/
      cost-tracking.xlsx
        Sheet: "API Costs"
          - timestamp
          - account_id
          - assistant_id
          - operation (generate|analyze|improve)
          - model
          - input_tokens
          - output_tokens
          - cost_usd
          - version
        Sheet: "Version History"
          - timestamp
          - account_id
          - assistant_id
          - version
          - briefing_hash
          - prompt_hash
          - file_path
          - status (draft|final)
        Sheet: "Summary"
          - Pivot tables and aggregations
  ```

- [ ] Create version tracking `lib/utils/version-tracker.ts`
  - `logVersion(accountId, assistantId, version, metadata)`
  - `getLatestVersion(accountId, assistantId)`

---

## Phase 6: Account Structure

**Goal**: Create account folder structure and configuration pattern.

### Checklist:

- [ ] Create `lib/accounts/_template/` as reference
  ```
  _template/
    config.ts.example
    assistants/
      _template/
        metadata.ts.example
        v1/
          prompt.md.example
          injection.ts.example
  ```
- [ ] Document account setup in `docs/ARCHITECTURE.md`
- [ ] Create account registration utility

### Account Config Pattern:

```typescript
// lib/accounts/[name-id]/config.ts
import type { AccountConfig } from "@/lib/types";

export const config: AccountConfig = {
  id: "account-name-123",
  name: "Account Display Name",
  anthropic: {
    apiKeyEnvVar: "ACCOUNT_NAME_ANTHROPIC_KEY",
  },
  assistants: ["asst_xxx", "asst_yyy"],
  createdAt: "2026-01-15",
};
```

---

## Phase 7: API Routes

**Goal**: Implement webhook and assistant management endpoints.

### 7.1 Webhook Endpoint

**Checklist:**

- [ ] Create `app/api/webhook/briefing/route.ts`
  - POST handler for briefing ingestion
  - Signature validation
  - Payload parsing
  - Trigger prompt generation pipeline
  - Return success/error response

### 7.2 Assistant Endpoints

**Checklist:**

- [ ] Create `app/api/assistants/[accountId]/route.ts`
  - GET: List assistants for account
  - POST: Create new assistant
  
- [ ] Create `app/api/assistants/[accountId]/[assistantId]/route.ts`
  - GET: Get assistant details
  - PUT: Update assistant
  - DELETE: Delete assistant (optional)

### 7.3 Injection Endpoints

**Checklist:**

- [ ] Create `app/api/injection/[accountId]/[assistantId]/[version]/route.ts`
  - POST: Execute injection file
  - GET: Get injection file preview

### 7.4 Cost Endpoints

**Checklist:**

- [ ] Create `app/api/cost/route.ts`
  - GET: Get cost summary
- [ ] Create `app/api/cost/[accountId]/route.ts`
  - GET: Get account-specific costs

---

## Phase 8: Prompt Generation Pipeline

**Goal**: Implement the full briefing → prompt pipeline with analysis iteration.

### Pipeline Flow:

```
1. Briefing Received (webhook)
   ↓
2. Parse & Validate Briefing
   ↓
3. Load PRISMA System
   ↓
4. Generate Initial Prompt (Claude Opus 4.5)
   → Log cost to Sheets
   ↓
5. Analyze Prompt Quality (Claude Opus 4.5)
   → Log cost to Sheets
   ↓
6. Improve Prompt Based on Analysis (Claude Opus 4.5)
   → Log cost to Sheets
   ↓
7. Generate Final Prompt
   ↓
8. Create Injection File
   ↓
9. Save Version to Account Folder
   ↓
10. Log Version to Google Sheets
   ↓
11. Return Success Response
```

### Checklist:

- [ ] Create `lib/services/pipeline/index.ts`
  - `processBriefing(briefing, accountId, assistantId)` - Full pipeline
- [ ] Create `lib/services/pipeline/steps/parse.ts`
- [ ] Create `lib/services/pipeline/steps/generate.ts`
- [ ] Create `lib/services/pipeline/steps/analyze.ts`
- [ ] Create `lib/services/pipeline/steps/improve.ts`
- [ ] Create `lib/services/pipeline/steps/finalize.ts`

### Analysis Criteria:

- PRISMA phase coverage
- Tone/voice consistency with briefing
- Persuasion pattern effectiveness
- Platform optimization (if specified)
- Ethical guardrails compliance

---

## Phase 9: UI Components

**Goal**: Build preview and management interface.

### 9.1 Core Components

**Checklist:**

- [ ] Create `components/AssistantPreview.tsx`
  - Display assistant configuration
  - Show current prompt
  - Display version history
  
- [ ] Create `components/PromptPreview.tsx`
  - Render generated prompt
  - Syntax highlighting
  - Copy to clipboard
  - Diff view between versions
  
- [ ] Create `components/InjectionRunner.tsx`
  - Manual execution trigger
  - Status display
  - Confirmation dialog
  - Cost estimate before execution

- [ ] Create `components/CostDashboard.tsx`
  - Total cost display
  - Cost by account/assistant
  - Time-based charts
  - Token usage breakdown

- [ ] Create `components/VersionHistory.tsx`
  - Version timeline
  - Compare versions
  - Rollback option

- [ ] Create `components/AccountSelector.tsx`
  - Account dropdown/list
  - Assistant navigation

### 9.2 Pages

**Checklist:**

- [ ] Create `app/page.tsx` - Dashboard/home
- [ ] Create `app/layout.tsx` - Root layout
- [ ] Create `app/preview/[accountId]/page.tsx` - Account overview
- [ ] Create `app/preview/[accountId]/[assistantId]/page.tsx` - Assistant detail
- [ ] Create `app/preview/[accountId]/[assistantId]/[version]/page.tsx` - Version detail
- [ ] Create `app/costs/page.tsx` - Cost dashboard

---

## Phase 10: Pipeline Integration

**Goal**: Connect all components into working pipeline.

### Checklist:

- [ ] Implement full webhook → prompt generation flow
- [ ] Implement injection file execution flow
- [ ] Add logging throughout pipeline
- [ ] Add error handling and recovery
- [ ] Test end-to-end with sample briefing
- [ ] Verify Google Sheets logging works

---

## Phase 11: Test Pipeline

**Goal**: Create comprehensive test suite.

### Checklist:

- [ ] Create test plan document
- [ ] Create `lib/testing/fixtures/` with sample briefings
- [ ] Create `lib/testing/mocks/` for external services
- [ ] Implement unit tests for each service
- [ ] Implement integration tests for pipeline
- [ ] Create E2E test script

### Test Categories:

1. **Unit Tests**
   - Type validation
   - PRISMA parser
   - Cost calculations
   - Version management

2. **Integration Tests**
   - Webhook → Pipeline flow
   - Google Sheets integration
   - Anthropic API calls (with mocks)

3. **E2E Tests**
   - Full briefing submission
   - Prompt generation and storage
   - UI preview functionality

---

## Phase 12: Documentation & Polish

**Goal**: Complete documentation and finalize project.

### Checklist:

- [ ] Create `docs/ARCHITECTURE.md`
- [ ] Create `docs/MEMENTO.md` (session tracking)
- [ ] Update `README.md` with setup instructions
- [ ] Add example account setup
- [ ] Document API endpoints
- [ ] Add inline code documentation
- [ ] Create Google Sheets setup guide

---

## Progress Tracking

| Phase | Description              | Status      | Notes |
| ----- | ------------------------ | ----------- | ----- |
| 1     | Project Setup            | Not Started |       |
| 2     | Type Definitions         | Not Started |       |
| 3     | Core Services            | Not Started |       |
| 4     | PRISMA Configuration     | Not Started |       |
| 5     | Cost Tracking System     | Not Started |       |
| 6     | Account Structure        | Not Started |       |
| 7     | API Routes               | Not Started |       |
| 8     | Prompt Pipeline          | Not Started |       |
| 9     | UI Components            | Not Started |       |
| 10    | Pipeline Integration     | Not Started |       |
| 11    | Test Pipeline            | Not Started |       |
| 12    | Documentation & Polish   | Not Started |       |

---

## File Structure (Final)

```
mermaid-prompt-builder/
├── app/
│   ├── api/
│   │   ├── webhook/
│   │   │   └── briefing/route.ts
│   │   ├── assistants/
│   │   │   └── [accountId]/
│   │   │       ├── route.ts
│   │   │       └── [assistantId]/route.ts
│   │   ├── injection/
│   │   │   └── [accountId]/
│   │   │       └── [assistantId]/
│   │   │           └── [version]/route.ts
│   │   └── cost/
│   │       ├── route.ts
│   │       └── [accountId]/route.ts
│   ├── preview/
│   │   └── [accountId]/
│   │       ├── page.tsx
│   │       └── [assistantId]/
│   │           ├── page.tsx
│   │           └── [version]/page.tsx
│   ├── costs/
│   │   └── page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── AssistantPreview.tsx
│   ├── PromptPreview.tsx
│   ├── InjectionRunner.tsx
│   ├── CostDashboard.tsx
│   ├── VersionHistory.tsx
│   └── AccountSelector.tsx
├── lib/
│   ├── types/
│   │   ├── index.ts
│   │   ├── briefing.types.ts
│   │   ├── assistant.types.ts
│   │   ├── prompt.types.ts
│   │   ├── account.types.ts
│   │   ├── api.types.ts
│   │   ├── cost.types.ts
│   │   └── prisma-system.types.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── webhook/
│   │   │   ├── index.ts
│   │   │   ├── validation.ts
│   │   │   └── schemas.ts
│   │   ├── anthropic/
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   ├── messages.ts
│   │   │   └── usage.ts
│   │   ├── prompt-builder/
│   │   │   ├── index.ts
│   │   │   ├── prisma-system.ts
│   │   │   ├── generator.ts
│   │   │   ├── injection.ts
│   │   │   └── versioning.ts
│   │   ├── pipeline/
│   │   │   ├── index.ts
│   │   │   └── steps/
│   │   │       ├── parse.ts
│   │   │       ├── generate.ts
│   │   │       ├── analyze.ts
│   │   │       ├── improve.ts
│   │   │       └── finalize.ts
│   │   ├── google/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── drive.ts
│   │   │   └── sheets.ts
│   │   └── accounts/
│   │       ├── index.ts
│   │       ├── registry.ts
│   │       └── config.ts
│   ├── accounts/
│   │   ├── _template/
│   │   │   ├── config.ts.example
│   │   │   └── assistants/
│   │   │       └── _template/
│   │   │           ├── metadata.ts.example
│   │   │           └── v1/
│   │   │               ├── prompt.md.example
│   │   │               └── injection.ts.example
│   │   └── [actual-accounts]/
│   ├── config/
│   │   └── prisma-system.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   ├── cost-tracker.ts
│   │   └── version-tracker.ts
│   └── testing/
│       ├── fixtures/
│       └── mocks/
├── contrib/
│   └── anthropic-api-reference.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── MEMENTO.md
│   ├── prisma-system.xml
│   └── anthropic-prompt-example.ts
├── public/
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.local.example
├── .eslintrc.json
└── .gitignore
```

---

## Claude Opus 4.5 Configuration

All AI operations use:
- **Model**: `claude-opus-4-5-20251101`
- **Max Tokens**: 20000 (adjustable per operation)
- **Temperature**: 1 (for creative prompt generation)
- **Extended Thinking**: Enabled for analysis/improvement steps

### Cost Estimation (per 1M tokens):
- Input: ~$15.00
- Output: ~$75.00

---

## Google Sheets Structure (IARA-ADMIN)

```
IARA-ADMIN (Shared Drive)
└── mermaid-prompt-builder/
    └── tracking.gsheet
        ├── Sheet: "API Costs"
        │   Columns: timestamp, account_id, assistant_id, operation,
        │            model, input_tokens, output_tokens, cost_usd, version
        │
        ├── Sheet: "Version History"
        │   Columns: timestamp, account_id, assistant_id, version,
        │            briefing_hash, prompt_hash, file_path, status
        │
        └── Sheet: "Summary"
            - Daily/weekly/monthly aggregations
            - Per-account breakdowns
            - Trend charts
```

---

## Security Considerations

1. **Environment Variables**: All API keys stored in `.env.local`
2. **Server-Only**: Account configs only accessible in Server Components and API Routes
3. **Webhook Auth**: All webhooks validated with signature verification
4. **No Exposure**: API keys never returned in responses or accessible to client components
5. **Audit Trail**: All operations logged to Google Sheets with timestamps
6. **Google Service Account**: Credentials stored as JSON in env var, parsed at runtime

---

## Next Steps

After approval of this plan:

1. Begin Phase 1: Initialize Next.js project
2. Execute phases sequentially, marking checkboxes as completed
3. Update `docs/MEMENTO.md` after each session
4. Run verification (`npx tsc --noEmit`) after each phase
