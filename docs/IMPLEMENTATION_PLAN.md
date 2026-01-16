# Implementation Plan: Mermaid Prompt Builder

> Pipeline for briefing ingestion, prompt generation, and Anthropic assistant management.

## Overview

This plan outlines the conversion of the current project into a Next.js App Router application with:

- Webhook-based briefing ingestion
- Prompt generation pipeline
- Anthropic Assistant get/create/update operations
- Injection files for manual UI execution
- Secure account/assistant configuration management

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
    preview/
      [accountId]/
        [assistantId]/page.tsx
    page.tsx
    layout.tsx
  components/
    AssistantPreview.tsx
    PromptPreview.tsx
    InjectionRunner.tsx
  lib/
    types/
      index.ts
      briefing.types.ts
      assistant.types.ts
      prompt.types.ts
      account.types.ts
      api.types.ts
    services/
      index.ts
      webhook/
      Anthropic/
      prompt-builder/
      accounts/
    accounts/
      _template/
    utils/
      logger.ts
      validation.ts
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
    "Anthropic": "^4.x",
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

**Goal**: Define all TypeScript interfaces and types.

### Checklist:

- [ ] Create `lib/types/briefing.types.ts`
  - `Briefing` - Core briefing data structure
  - `BriefingPayload` - Webhook payload wrapper
  - `WebhookHeaders` - Expected webhook headers
- [ ] Create `lib/types/assistant.types.ts`
  - `Assistant` - Anthropic assistant representation
  - `AssistantConfig` - Local assistant configuration
  - `AssistantVersion` - Version tracking
  - `AssistantOperation` - Create/Update/Get operations
- [ ] Create `lib/types/prompt.types.ts`
  - `PromptTemplate` - Template structure
  - `PromptVariables` - Template variables
  - `GeneratedPrompt` - Output prompt
  - `InjectionFile` - Injection file structure
- [ ] Create `lib/types/account.types.ts`
  - `Account` - Account metadata
  - `AccountConfig` - Full account configuration
  - `AccountCredentials` - API keys (server-only)
- [ ] Create `lib/types/api.types.ts`
  - `APIResponse<T>` - Generic API response
  - `APIError` - Error class
  - `WebhookValidationResult`
- [ ] Create `lib/types/index.ts` barrel export

---

## Phase 3: Core Services

**Goal**: Implement service layer for external integrations.

### 3.1 Webhook Service

**Checklist:**

- [ ] Create `lib/services/webhook/index.ts`
- [ ] Create `lib/services/webhook/validation.ts`
  - `validateSignature(headers, body)` - Verify webhook authenticity
  - `parsePayload(body)` - Parse and validate with Zod
- [ ] Create `lib/services/webhook/types.ts` (if needed beyond main types)

### 3.2 Anthropic Service

**Checklist:**

- [ ] Create `lib/services/Anthropic/index.ts`
- [ ] Create `lib/services/Anthropic/client.ts`
  - `createClient(accountId)` - Create Anthropic client with account credentials
- [ ] Create `lib/services/Anthropic/assistants.ts`
  - `getAssistant(accountId, assistantId)`
  - `createAssistant(accountId, config)`
  - `updateAssistant(accountId, assistantId, updates)`
  - `listAssistants(accountId)`

### 3.3 Prompt Builder Service

**Checklist:**

- [ ] Create `lib/services/prompt-builder/index.ts`
- [ ] Create `lib/services/prompt-builder/templates.ts`
  - `loadTemplate(templateId)`
  - `getAvailableTemplates()`
- [ ] Create `lib/services/prompt-builder/generator.ts`
  - `generatePrompt(briefing, template)`
  - `createInjectionFile(prompt, assistantConfig)`
- [ ] Create `lib/services/prompt-builder/versioning.ts`
  - `getNextVersion(accountId, assistantId)`
  - `saveVersion(accountId, assistantId, version, content)`

### 3.4 Accounts Service

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

## Phase 4: Account Structure

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
  Anthropic: {
    apiKeyEnvVar: "ACCOUNT_NAME_Anthropic_KEY", // Reference, not value
    organizationEnvVar: "ACCOUNT_NAME_Anthropic_ORG",
  },
  assistants: ["asst_xxx", "asst_yyy"],
  createdAt: "2026-01-15",
};
```

---

## Phase 5: API Routes

**Goal**: Implement webhook and assistant management endpoints.

### 5.1 Webhook Endpoint

**Checklist:**

- [ ] Create `app/api/webhook/briefing/route.ts`
  - POST handler for briefing ingestion
  - Signature validation
  - Payload parsing
  - Trigger prompt generation
  - Return success/error response

### 5.2 Assistant Endpoints

**Checklist:**

- [ ] Create `app/api/assistants/[accountId]/route.ts`
  - GET: List assistants for account
  - POST: Create new assistant
- [ ] Create `app/api/assistants/[accountId]/[assistantId]/route.ts`
  - GET: Get assistant details
  - PUT: Update assistant
  - DELETE: Delete assistant (optional)

### 5.3 Injection Endpoints

**Checklist:**

- [ ] Create `app/api/injection/[accountId]/[assistantId]/[version]/route.ts`
  - POST: Execute injection file
  - GET: Get injection file preview

---

## Phase 6: UI Components

**Goal**: Build preview and management interface.

### 6.1 Core Components

**Checklist:**

- [ ] Create `components/AssistantPreview.tsx`
  - Display assistant configuration
  - Show current prompt
  - Display version history
- [ ] Create `components/PromptPreview.tsx`
  - Render generated prompt
  - Syntax highlighting (optional)
  - Copy to clipboard
- [ ] Create `components/InjectionRunner.tsx`

  - Manual execution trigger
  - Status display
  - Confirmation dialog

- [ ] Create `components/AccountSelector.tsx`
  - Account dropdown/list
  - Assistant navigation

### 6.2 Pages

**Checklist:**

- [ ] Create `app/page.tsx` - Dashboard/home
- [ ] Create `app/layout.tsx` - Root layout
- [ ] Create `app/preview/[accountId]/page.tsx` - Account overview
- [ ] Create `app/preview/[accountId]/[assistantId]/page.tsx` - Assistant detail
- [ ] Create `app/preview/[accountId]/[assistantId]/[version]/page.tsx` - Version detail

---

## Phase 7: Pipeline Integration

**Goal**: Connect all components into working pipeline.

### Checklist:

- [ ] Implement full webhook → prompt generation flow
- [ ] Implement injection file execution flow
- [ ] Add logging throughout pipeline
- [ ] Add error handling and recovery
- [ ] Test end-to-end with sample briefing

---

## Phase 8: Documentation & Polish

**Goal**: Complete documentation and finalize project.

### Checklist:

- [ ] Create `docs/ARCHITECTURE.md`
- [ ] Create `docs/MEMENTO.md` (session tracking)
- [ ] Update `README.md` with setup instructions
- [ ] Add example account setup
- [ ] Document API endpoints
- [ ] Add inline code documentation

---

## Progress Tracking

| Phase | Description            | Status      | Notes |
| ----- | ---------------------- | ----------- | ----- |
| 1     | Project Setup          | Not Started |       |
| 2     | Type Definitions       | Not Started |       |
| 3     | Core Services          | Not Started |       |
| 4     | Account Structure      | Not Started |       |
| 5     | API Routes             | Not Started |       |
| 6     | UI Components          | Not Started |       |
| 7     | Pipeline Integration   | Not Started |       |
| 8     | Documentation & Polish | Not Started |       |

---

## File Structure (Final)

```
mermaid-prompt-builder/
├── app/
│   ├── api/
│   │   ├── webhook/
│   │   │   └── briefing/
│   │   │       └── route.ts
│   │   ├── assistants/
│   │   │   └── [accountId]/
│   │   │       ├── route.ts
│   │   │       └── [assistantId]/
│   │   │           └── route.ts
│   │   └── injection/
│   │       └── [accountId]/
│   │           └── [assistantId]/
│   │               └── [version]/
│   │                   └── route.ts
│   ├── preview/
│   │   └── [accountId]/
│   │       ├── page.tsx
│   │       └── [assistantId]/
│   │           ├── page.tsx
│   │           └── [version]/
│   │               └── page.tsx
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AssistantPreview.tsx
│   ├── PromptPreview.tsx
│   ├── InjectionRunner.tsx
│   └── AccountSelector.tsx
├── lib/
│   ├── types/
│   │   ├── index.ts
│   │   ├── briefing.types.ts
│   │   ├── assistant.types.ts
│   │   ├── prompt.types.ts
│   │   ├── account.types.ts
│   │   └── api.types.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── webhook/
│   │   │   ├── index.ts
│   │   │   └── validation.ts
│   │   ├── Anthropic/
│   │   │   ├── index.ts
│   │   │   ├── client.ts
│   │   │   └── assistants.ts
│   │   ├── prompt-builder/
│   │   │   ├── index.ts
│   │   │   ├── templates.ts
│   │   │   ├── generator.ts
│   │   │   └── versioning.ts
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
│   └── utils/
│       ├── logger.ts
│       └── validation.ts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── MEMENTO.md
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

## Security Considerations

1. **Environment Variables**: All API keys stored in `.env.local`, referenced by env var names in configs
2. **Server-Only**: Account configs only accessible in Server Components and API Routes
3. **Webhook Auth**: All webhooks validated with signature verification
4. **No Exposure**: API keys never returned in responses or accessible to client components
5. **Audit Trail**: All assistant operations logged with timestamps

---

## Next Steps

After approval of this plan:

1. Begin Phase 1: Initialize Next.js project
2. Execute phases sequentially, marking checkboxes as completed
3. Update `docs/MEMENTO.md` after each session
4. Run verification (`npx tsc --noEmit`) after each phase
