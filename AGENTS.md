# Agent Instructions

Guidelines for AI agents working on this codebase.

> ⚠️ **STRICT COMPLIANCE REQUIRED**: These are not suggestions. Every rule must be followed exactly. No exceptions, no shortcuts, no "it's just a small helper function." If a rule exists, enforce it.

---

## ⛔ CRITICAL: Node.js & npm Rules

**NEVER access `node_modules/` directly.** Do not:

- Read files from `node_modules/`
- Try to execute binaries from `node_modules/.bin/`
- Inspect `node_modules/` contents
- Reference paths inside `node_modules/`

**To build or run the project:**

```bash
# If having issues, always start fresh:
rm -rf node_modules && npm install

# Then run commands via npm scripts:
npm run build
npm run dev
npm run typecheck
```

**ALWAYS use npm scripts**, never direct binary execution.

## Quick Reference

| Need to...                   | Look at...                                    |
| ---------------------------- | --------------------------------------------- |
| Understand architecture      | `docs/ARCHITECTURE.md`                        |
| Track session changes        | `docs/MEMENTO.md`                             |
| Add a new type               | `lib/types/` (never inline)                   |
| Add webhook functionality    | `lib/services/webhook/`                       |
| Add Anthropic functionality  | `lib/services/Anthropic/`                     |
| Add prompt generation        | `lib/services/prompt-builder/`                |
| Access account configs       | `lib/accounts/[name-id]/config.ts`            |
| Access assistant definitions | `lib/accounts/[name-id]/assistants/[id]/`     |
| Access injection files       | `lib/accounts/.../assistants/[id]/[version]/` |
| Modify API routes            | `app/api/`                                    |
| Modify UI components         | `app/` (pages) or `components/`               |

---

## Environment & Credentials

### Global `.env.local` (root level)

| Variable                                  | Service        | Purpose                             |
| ----------------------------------------- | -------------- | ----------------------------------- |
| `WEBHOOK_SECRET`                          | Webhook Auth   | Validates incoming webhook requests |
| `MERMAID_TOKEN`                           | AI Provider    | API token for assistant operations  |
| `MERMAID_ASSISTANT_ID`                    | AI Provider    | Default assistant identifier        |
| `MERMAID_ACCOUNT_ID`                      | Account System | Primary account identifier          |
| `ANTHROPIC_API_KEY`                       | Anthropic      | Claude API key for AI operations    |
| `ANTHROPIC_ADMIN_API_KEY`                 | Anthropic      | Admin API for usage/billing data    |
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON` | Google         | Service account for Drive/Sheets    |

### Account-Level Configs (`lib/accounts/[name-id]/config.ts`)

Each account has its own protected configuration:

```typescript
// lib/accounts/acme-corp-123/config.ts
export const config = {
  accountId: "acme-corp-123",
  name: "Acme Corporation",
  anthropic: {
    apiKeyEnvVar: "ACME_CORP_ANTHROPIC_KEY", // Reference, not value
  },
  assistants: ["asst_abc123", "asst_def456"],
};
```

**CRITICAL**: Account API keys are stored in `.env.local` with account-prefixed names and NEVER exposed to the frontend.

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

### 3. Keep Concerns Separate

| Layer           | Purpose                  | Example                           |
| --------------- | ------------------------ | --------------------------------- |
| **types/**      | ALL type definitions     | `Briefing`, `Assistant`, `Prompt` |
| **services/**   | External integrations    | Anthropic, webhook validation     |
| **accounts/**   | Account-specific configs | API keys, assistant IDs           |
| **utils/**      | Utilities & helpers      | Logging, validation, encryption   |
| **app/api/**    | API Routes (Server only) | Webhook endpoints, assistant ops  |
| **app/**        | UI Pages (App Router)    | React components, previews        |
| **components/** | Reusable UI components   | Forms, displays, buttons          |

### 4. Security First

**CRITICAL**: This application handles sensitive API keys and credentials.

#### ❌ NEVER do this:

- Expose API keys in client components
- Return credentials in API responses
- Log API keys or secrets
- Store secrets in account folders without encryption references
- Use `"use client"` on components that access secrets

#### ✅ ALWAYS do this:

- Access secrets only in Server Components or API Routes
- Use environment variables with account prefixes
- Validate webhook signatures before processing
- Keep account configs in `lib/accounts/` (server-side only)

### 5. Next.js App Router Rules

**CRITICAL**: The `app/` folder follows strict patterns.

#### ❌ NEVER do this in `app/*.tsx` files:

- Define interfaces/types (use `lib/types/`)
- Define utility functions (use `lib/utils/`)
- Import account configs directly in client components
- Access `process.env` in client components (except `NEXT_PUBLIC_*`)
- Define business logic or data transformations

#### ✅ ALWAYS do this for pages:

- Import data functions from `lib/`
- Import types from `lib/types`
- Keep components focused on rendering
- Use Server Components for data fetching
- Use Server Actions or API routes for mutations

### 6. Icons - Use Lucide React

**CRITICAL**: Never use inline SVG for icons.

#### ❌ NEVER do this:

```tsx
<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
  <path ... />
</svg>
```

#### ✅ ALWAYS do this:

```tsx
import { Lightbulb, Building2, BarChart3 } from "lucide-react";

<Lightbulb className="w-6 h-6 text-blue-600" />;
```

**Why:** Inline SVGs bloat code, are hard to maintain, and reduce readability.

Find icons at: https://lucide.dev/icons

#### Example - Correct Page Pattern:

```tsx
// app/accounts/[accountId]/assistants/page.tsx
import { getAccountAssistants } from "@/lib/services/Anthropic";
import type { Assistant } from "@/lib/types";
import { AssistantList } from "@/components/AssistantList";

export default async function AssistantsPage({
  params,
}: {
  params: { accountId: string };
}) {
  const assistants = await getAccountAssistants(params.accountId);
  return <AssistantList assistants={assistants} />;
}
```

---

## Module Guide

### Types (`lib/types/`)

**RULE**: All types live here. Never define interfaces inline in service files.

| File                 | Contains                                     |
| -------------------- | -------------------------------------------- |
| `briefing.types.ts`  | Briefing, BriefingPayload, WebhookPayload    |
| `assistant.types.ts` | Assistant, AssistantConfig, AssistantVersion |
| `prompt.types.ts`    | Prompt, PromptTemplate, InjectionFile        |
| `account.types.ts`   | Account, AccountConfig, AccountCredentials   |
| `api.types.ts`       | API response types, error types              |

**When adding a new type:**

1. Add to appropriate `.types.ts` file
2. Export from `types/index.ts` (barrel export)
3. Import in consuming files as `import type { MyType } from "@/lib/types"`

### Services (`lib/services/`)

Each service folder follows this pattern:

```
services/Anthropic/
├── index.ts          # Barrel export
├── client.ts         # Client factory (uses account config)
├── assistants.ts     # Assistant CRUD operations
└── prompts.ts        # Prompt management
```

**Available services:**

- `aiprovider/` - Assistant management, prompt updates
- `webhook/` - Webhook validation, payload parsing
- `prompt-builder/` - Template processing, injection generation
- `accounts/` - Account config loading, validation

### Accounts (`lib/accounts/`)

Each account has a dedicated folder:

```
accounts/acme-corp-123/
├── config.ts                 # Account configuration (server-only)
└── assistants/
    └── asst_abc123/
        ├── metadata.ts       # Assistant metadata
        └── v1/
            ├── prompt.md     # Generated prompt
            └── injection.ts  # Injection file for manual execution
```

### Utils (`lib/utils/`)

- `logger.ts` - Structured logging
- `validation.ts` - Zod schemas, input validation
- `encryption.ts` - Secret encryption/decryption
- `version.ts` - Version management utilities

---

## Import Rules

### For API Routes

```typescript
// ✅ CORRECT - import from lib
import { validateWebhook } from "@/lib/services/webhook";
import { getAccountConfig } from "@/lib/services/accounts";
import type { WebhookPayload } from "@/lib/types";

// ❌ WRONG - importing from internal paths
import { validateWebhook } from "@/lib/services/webhook/validation";
```

### For Components

```typescript
// ✅ CORRECT - types from lib/types, no secrets
import type { Assistant, Prompt } from "@/lib/types";

// ❌ WRONG - accessing account configs
import { config } from "@/lib/accounts/acme/config";
```

---

## Pipeline Architecture

### 1. Briefing Ingestion (Webhook)

```
POST /api/webhook/briefing
  → Validate signature
  → Parse payload
  → Store briefing
  → Trigger prompt generation
```

### 2. Prompt Generation

```
Briefing received
  → Load prompt template
  → Apply briefing data
  → Generate injection file
  → Store in account/assistant/version folder
```

### 3. Assistant Operations

```
Manual UI action
  → Load injection file
  → Call Anthropic API (create/update)
  → Log operation result
```

---

## File Naming Conventions

| Type            | Convention               | Example                            |
| --------------- | ------------------------ | ---------------------------------- |
| Types           | `*.types.ts`             | `briefing.types.ts`                |
| Services        | `*.ts` in service folder | `services/Anthropic/assistants.ts` |
| API Routes      | `route.ts` in folder     | `app/api/webhook/route.ts`         |
| Pages           | `page.tsx` in folder     | `app/preview/page.tsx`             |
| Components      | PascalCase `.tsx`        | `AssistantPreview.tsx`             |
| Utils           | camelCase `.ts`          | `validatePayload.ts`               |
| Account configs | `config.ts`              | `accounts/acme/config.ts`          |
| Injection files | `injection.ts`           | `v1/injection.ts`                  |

---

## Testing Checklist

Before completing ANY task:

1. ✅ `npx tsc --noEmit` - No TypeScript errors
2. ✅ `get_errors` on modified files - No ESLint issues
3. ✅ Verify barrel exports are updated
4. ✅ Verify no secrets exposed to client
5. ✅ Update documentation if architecture changed

### Integration Tests

```bash
# Verify webhook endpoint
curl -X POST http://localhost:3000/api/webhook/briefing \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: ..." \
  -d '{"accountId": "...", "briefing": {...}}'

# Verify build
npm run build
```

---

## Adding New Functionality

### Adding a New Account

1. Create folder: `lib/accounts/[name-id]/`
2. Create `config.ts` with account credentials reference
3. Add environment variables to `.env.local`
4. Create `assistants/` subfolder structure
5. Register account in `lib/services/accounts/registry.ts`

### Adding a New Assistant to Account

1. Create folder: `lib/accounts/[name-id]/assistants/[id]/`
2. Add `metadata.ts` with assistant configuration
3. Create version folder: `v1/`
4. Generate initial `prompt.md` and `injection.ts`

### Adding a New Service

1. Create folder: `lib/services/myservice/`
2. Create files:
   - `client.ts` - Factory function
   - `operations.ts` - Business logic
   - `index.ts` - Barrel export
3. Add types to `lib/types/`
4. Export from `services/index.ts`

---

## Error Handling

Use typed errors with proper HTTP status codes:

```typescript
// lib/types/api.types.ts
export class APIError extends Error {
  constructor(message: string, public statusCode: number, public code: string) {
    super(message);
  }
}

// Usage in API routes
import { APIError } from "@/lib/types";

if (!isValidSignature) {
  throw new APIError("Invalid webhook signature", 401, "INVALID_SIGNATURE");
}
```

---

## Security Reminders

1. **Webhook Validation**: Always validate `X-Webhook-Signature` header
2. **Account Isolation**: Each account's API keys are isolated
3. **No Client Exposure**: Account configs NEVER reach the browser
4. **Injection Files**: Execute only via authenticated UI actions
5. **Audit Logging**: Log all assistant modifications

---

## Plan Navigation & Execution

### Finding Plans

- Plans are in `docs/` folder
- Architecture overview: `docs/ARCHITECTURE.md`
- Implementation plan: `docs/IMPLEMENTATION_PLAN.md`

### Execution Workflow

1. **READ** the plan first - understand the full scope
2. **ASK** clarifying questions before starting (see below)
3. **IDENTIFY** remaining tasks (unchecked `[ ]` items)
4. **EXECUTE** one task at a time
5. **VERIFY** with `npx tsc --noEmit` after each change
6. **UPDATE** the checklist item to `[x]`
7. **COMMIT** logical chunks (don't leave work half-done)

### Clarifying Questions

**RULE**: When a request is ambiguous, incomplete, or could be interpreted multiple ways, ASK before implementing. Don't guess.

#### When to Ask:

- Requirements are vague or underspecified
- Multiple valid implementation approaches exist
- Security/architecture decisions need confirmation
- User intent is unclear
- Task scope is uncertain (do X only, or also Y?)

#### Question Structure:

Use numbered questions with context and options when applicable:

```markdown
Before I proceed, I have a few questions:

1. **[Topic]**: [Specific question]

   - Option A: [Description]
   - Option B: [Description]
   - Or: [Open-ended if no clear options]

2. **[Topic]**: [Specific question]
```

#### Examples:

**Good - Specific with options:**

```markdown
1. **API Provider**: Which AI provider should I configure?

   - Option A: Anthropic (GPT-4, Assistants API)
   - Option B: Anthropic (Claude)
   - Option C: Support both with a provider abstraction

2. **Webhook Security**: How should webhook signatures be validated?
   - Option A: HMAC-SHA256 with shared secret
   - Option B: API key in header
   - Or: Do you have an existing signature format?
```

**Good - Scope clarification:**

```markdown
1. **Scope**: Should I also update the existing shell scripts, or focus only on the new TypeScript implementation?

2. **Migration**: Should I preserve backwards compatibility with the current `build_assistant.py`, or is a clean break acceptable?
```

**Bad - Too vague:**

```markdown
- What do you want me to do?
- How should I implement this?
- Is this okay?
```

#### Response Format:

After receiving answers, summarize understanding before executing:

```markdown
Understood. I'll proceed with:

- [Decision 1]
- [Decision 2]

Starting with [first task]...
```
