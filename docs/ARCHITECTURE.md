# Architecture: MermAId Prompt Builder

## Overview

The MermAId Prompt Builder is a Next.js application that transforms business briefings into AI assistant prompts using the PRISMA persuasion system. It generates prompts, creates injection files, and can directly update assistants via the MermAId Chat API.

## System Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Briefing  │ ──▶ │   PRISMA    │ ──▶ │   Prompt    │ ──▶ │  Injection  │
│   (Input)   │     │   System    │     │ Generation  │     │    File     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │  MermAId    │
                                                            │  API Update │
                                                            └─────────────┘
```

## Directory Structure

```
mermaid-prompt-builder/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── webhook/briefing/     # Webhook endpoint for briefings
│   │   ├── assistants/           # Assistant management endpoints
│   │   │   └── update/           # Update assistant via MermAId API
│   │   ├── accounts/             # Account management
│   │   └── pipeline/             # Pipeline status endpoints
│   ├── test/                     # Test pipeline UI
│   ├── accounts/                 # Account listing page
│   ├── page.tsx                  # Dashboard
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── ui/                       # Base UI components (Button, Card, Badge)
│   ├── prompt/                   # Prompt-related components
│   ├── pipeline/                 # Pipeline status components
│   └── accounts/                 # Account management components
├── lib/                          # Core library code
│   ├── types/                    # TypeScript type definitions
│   ├── services/                 # Business logic services
│   │   ├── anthropic/            # Anthropic Claude API integration
│   │   ├── mermaid/              # MermAId Chat API integration
│   │   ├── prompt-builder/       # Prompt generation (PRISMA)
│   │   ├── pipeline/             # Pipeline orchestration
│   │   ├── webhook/              # Webhook handling
│   │   ├── google/               # Google Sheets/Drive integration
│   │   └── accounts/             # Account registry
│   ├── accounts/                 # Account configurations
│   ├── config/                   # Application configuration
│   └── utils/                    # Utility functions
└── docs/                         # Documentation
```

## Core Services

### 1. Pipeline Service (`lib/services/pipeline/`)

Orchestrates the full prompt generation flow:

1. **Load Account Config** - Validates account exists and API keys are configured
2. **Generate Prompt** - Uses PRISMA system to transform briefing into prompt
3. **Determine Version** - Assigns version number to the generated prompt
4. **Create Injection File** - Generates TypeScript file with prompt and utilities
5. **Log Costs** - Records token usage and costs to Google Sheets

### 2. Anthropic Service (`lib/services/anthropic/`)

Handles all communication with Claude API:

- **client.ts** - Client factory with caching
- **messages.ts** - Message sending with extended thinking support
- **usage.ts** - Token usage extraction and cost calculation

Model: `claude-opus-4-5-20251101`

### 3. MermAId Service (`lib/services/mermaid/`)

Integrates with MermAId Chat API for assistant management:

- **client.ts** - API client for GET/PATCH operations
- Endpoint: `https://api.mermaid.chat/api/assistants/{assistantId}`

### 4. Prompt Builder Service (`lib/services/prompt-builder/`)

- **generator.ts** - Prompt generation with iteration support
- **prisma-system.ts** - PRISMA persuasion framework integration
- **injection.ts** - Injection file generation with MermAId support

### 5. Webhook Service (`lib/services/webhook/`)

- **validation.ts** - Signature verification
- **parser.ts** - Payload parsing and validation

## API Endpoints

### Webhook

- `POST /api/webhook/briefing` - Receive briefings and trigger pipeline

### Assistants

- `POST /api/assistants/update` - Update assistant via MermAId API
- `GET /api/assistants/[accountId]` - List assistants for account
- `GET /api/assistants/[accountId]/[assistantId]` - Get assistant details

### Pipeline

- `GET /api/pipeline/[id]` - Get pipeline status

### Accounts

- `GET /api/accounts` - List all accounts
- `GET /api/accounts/[accountId]` - Get account details

## Data Types

### Briefing (`lib/types/briefing.types.ts`)

Input data structure containing:
- Business information (name, product, differentials)
- Target audience (ideal client, desires, fears, objections)
- Service guidelines (tone, required/forbidden phrases)
- Automation rules (schedule, qualification criteria)
- Objectives (main goal, minimum result)

### Generated Prompt (`lib/types/prompt.types.ts`)

Output containing:
- Final prompt content
- Iteration history
- Token usage and costs
- Metadata (account, assistant, version)

### Injection File

TypeScript file containing:
- `PROMPT_CONTENT` - The full system prompt
- `METADATA` - Version and generation info
- `MERMAID_OPTIONS` - MermAId API payload format
- `updateMermaidAssistant()` - Function to update via API
- `sendMessageWithPrompt()` - Function for direct testing

## PRISMA System

The PRISMA system transforms briefings into persuasive prompts through three phases:

1. **Perception Mirror** - Identity, history, and capability signals
2. **Context Reframe** - Industry, cultural, and economic context
3. **Permission Grant** - Validation, deservedness, and fear handling

Configuration: `docs/prisma-system.xml`

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...        # Claude API key
WEBHOOK_SECRET=...                   # Webhook signature validation

# MermAId Integration
MERMAID_TOKEN=ak_...                 # MermAId API token
MERMAID_ASSISTANT_ID=...             # Default assistant ID
MERMAID_ACCOUNT_ID=...               # Default account ID

# Optional - Cost Tracking
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON=...
GOOGLE_SHARED_DRIVE_ID=...
ANTHROPIC_ADMIN_API_KEY=...
```

## Cost Tracking

All AI operations are logged to Google Sheets (when configured):

- **API Costs** sheet: timestamp, account, operation, tokens, cost
- **Version History** sheet: version tracking with content hashes
- **Summary** sheet: aggregated metrics

## Security Considerations

1. **API Keys** - Stored in environment variables, never exposed to client
2. **Webhook Validation** - HMAC signature verification (skippable in test mode)
3. **Server-Only Services** - Account configs and credentials only accessible server-side
4. **Audit Trail** - All operations logged with timestamps

## UI Components

### Dashboard (`app/page.tsx`)
- Quick actions: Test Pipeline, Accounts, Cost Tracking
- System status display
- Recent accounts list

### Test Pipeline (`app/test/page.tsx`)
- Briefing form (form mode or JSON mode)
- Pipeline status display
- Generated prompt preview
- **Update Agent button** - Directly updates MermAId assistant

### Accounts (`app/accounts/page.tsx`)
- Account listing and navigation
- Assistant management per account
