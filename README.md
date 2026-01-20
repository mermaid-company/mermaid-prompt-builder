# Mermaid Prompt Builder

A Next.js pipeline for **briefing ingestion**, **AI-powered prompt generation** using the PRISMA system, and **assistant management** with Claude Opus 4.5.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required: Anthropic API Key for Claude operations
ANTHROPIC_API_KEY=sk-ant-...

# Optional: Admin API for usage tracking
ANTHROPIC_ADMIN_API_KEY=sk-ant-admin-...

# Optional: Webhook signature validation (for production)
WEBHOOK_SECRET=your-webhook-secret

# Optional: Google Sheets cost tracking
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON={"type":"service_account",...}
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## 📖 How Everything Works

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BRIEFING SOURCES                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. External Webhook (POST /api/webhook/briefing)                  │
│  2. Test Page UI (http://localhost:3000/test)                      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Step 1: Validate & Parse Briefing                                 │
│  Step 2: Load Account Configuration                                 │
│  Step 3: Apply PRISMA System Prompt                                 │
│  Step 4: Generate Initial Prompt (Claude Opus 4.5)                 │
│  Step 5: Analyze & Improve Prompt (iteration)                      │
│  Step 6: Create Injection File                                     │
│  Step 7: Log Costs to Google Sheets (optional)                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          OUTPUT FILES                               │
├─────────────────────────────────────────────────────────────────────┤
│  lib/accounts/{accountId}/assistants/{assistantId}/{version}/      │
│    ├── injection.ts    # Runnable file to use the prompt           │
│    └── prompt.md       # Generated prompt in markdown               │
└─────────────────────────────────────────────────────────────────────┘
```

### The PRISMA System

The pipeline uses the **PRISMA** methodology for prompt generation:

- **P**erception: Understanding the briefing context
- **R**easoning: Analyzing requirements and constraints
- **I**nstruction: Generating clear directives
- **S**elf-refinement: Iterative improvement
- **M**eta-cognition: Evaluating effectiveness
- **A**daptation: Adjusting to specific needs

---

## 🔌 API Endpoints

### POST `/api/webhook/briefing`

Main webhook endpoint for briefing ingestion.

**Headers:**

```
Content-Type: application/json
X-Webhook-Signature: sha256=<signature>  (optional in test mode)
X-Test-Mode: true                         (skip signature validation)
```

**Request Body (from external system like n8n):**

```json
{
  "event": "briefing.created",
  "timestamp": "2025-01-16T12:00:00Z",
  "data": {
    "id": "briefing-123",
    "accountId": "example-account",
    "assistantId": "asst-456",
    "formData": {
      "businessName": "Acme Corp",
      "productService": "SaaS Platform",
      "differentials": "AI-powered analytics",
      "salesProcess": "Inbound leads from website",
      "tools": "HubSpot CRM",
      "idealClient": ["Tech startups", "Series A-B companies"],
      "mainDesires": ["Increase revenue", "Reduce churn"],
      "fears": ["Losing customers", "Competitor pressure"],
      "objections": ["Too expensive", "Integration complexity"],
      "journeyMoment": ["Problem-aware", "Solution-seeking"],
      "brandPerception": "Innovative and trustworthy",
      "toneOfVoice": "Professional but friendly",
      "mustSayMessages": "Always mention free trial",
      "internalActions": "Notify sales team for hot leads",
      "neverUse": "Never say 'I am an AI'",
      "scheduleAdaptation": "24/7 support with slower responses at night",
      "specialConditions": "VIP treatment for enterprise leads",
      "mandatorySteps": "Qualify budget before transfer",
      "qualificationCriteria": "Company size > 50 employees",
      "documentsFlow": "Send NDA before proposal",
      "mainObjective": "Book demo calls",
      "minimumResult": "At least capture contact info"
    },
    "createdAt": "2025-01-16T12:00:00Z"
  }
}
```

**Test Mode Body (simplified):**

```json
{
  "accountId": "example-account",
  "assistantId": "asst-456",
  "formData": { ... }
}
```

**Response:**

```json
{
  "success": true,
  "pipelineId": "pipeline-abc123",
  "status": "completed",
  "injectionFile": "lib/accounts/example-account/assistants/asst-456/v1/injection.ts",
  "version": "v1",
  "prompt": {
    "content": "# System Prompt\n\nYou are...",
    "version": "v1",
    "accountId": "example-account",
    "assistantId": "asst-456",
    "iterations": 1
  },
  "costSummary": {
    "operations": 2,
    "totalCost": 0.05
  }
}
```

### GET `/api/webhook/briefing`

Health check for the webhook endpoint.

### GET `/api/accounts`

List all configured accounts.

### GET `/api/accounts/[accountId]`

Get details for a specific account.

---

## 💻 Using the Test UI

The easiest way to test the pipeline:

1. Go to [http://localhost:3000/test](http://localhost:3000/test)
2. Fill out the briefing form
3. Click "Submit" to run the pipeline
4. View the generated prompt and pipeline status

---

## 📁 Using the Injection File

After the pipeline runs, an injection file is created at:

```
lib/accounts/{accountId}/assistants/{assistantId}/{version}/injection.ts
```

### How to Use the Injection File

```typescript
import Anthropic from "@anthropic-ai/sdk";
import {
  PROMPT_CONTENT,
  sendMessageWithPrompt,
} from "./lib/accounts/example-account/assistants/asst-456/v1/injection";

const client = new Anthropic();

// Option 1: Use the helper function
const response = await sendMessageWithPrompt(
  client,
  "Hello, how can you help me?"
);

// Option 2: Use PROMPT_CONTENT directly
const response = await client.messages.create({
  model: "claude-opus-4-5-20251101",
  max_tokens: 8192,
  system: PROMPT_CONTENT, // The generated prompt
  messages: [{ role: "user", content: "Hello, how can you help me?" }],
});
```

### Injection File Structure

```typescript
// PROMPT_CONTENT - The generated system prompt
export const PROMPT_CONTENT = `...`;

// METADATA - Information about the generation
export const METADATA = {
  accountId: "example-account",
  assistantId: "asst-456",
  version: "v1",
  generatedAt: "2025-01-16T12:00:00Z",
  contentHash: "abc123...",
};

// Helper functions
export async function sendMessageWithPrompt(
  client,
  userMessage
): Promise<string>;
```

---

## ⚙️ Configuration

### Environment Variables

| Variable                                  | Required | Description                                     |
| ----------------------------------------- | -------- | ----------------------------------------------- |
| `ANTHROPIC_API_KEY`                       | ✅ Yes   | API key for Claude operations                   |
| `ANTHROPIC_ADMIN_API_KEY`                 | ❌ No    | Admin API for usage/billing data                |
| `WEBHOOK_SECRET`                          | ❌ No    | Secret for validating webhook signatures        |
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON` | ❌ No    | Google service account for Sheets cost tracking |

### Account Configuration

Accounts are configured in `lib/accounts/{account-id}/config.ts`:

```typescript
import type { AccountConfig } from "@/lib/types";

export const config: AccountConfig = {
  id: "my-account",
  name: "My Company",
  description: "Main production account",
  assistants: ["asst-main", "asst-support"],
  createdAt: new Date().toISOString(),
};
```

### Creating a New Account

1. Create folder: `lib/accounts/{account-id}/`
2. Add `config.ts` with account metadata
3. The system will auto-discover the account

---

## 🔗 Integrating with External Systems

### n8n Integration

1. Set up a webhook trigger in n8n
2. Configure it to POST to `https://your-domain.com/api/webhook/briefing`
3. Add the `X-Webhook-Signature` header for production
4. Map your form fields to the briefing structure

### Webhook Signature Validation

For production, validate webhooks using HMAC-SHA256:

```bash
# Set your webhook secret
WEBHOOK_SECRET=your-secret-key
```

The signature should be sent as:

```
X-Webhook-Signature: sha256=<hmac-hex-digest>
```

---

## 🏗️ Project Structure

```
mermaid-prompt-builder/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── webhook/briefing/     # Main webhook endpoint
│   │   ├── accounts/             # Account management APIs
│   │   └── pipeline/             # Pipeline status APIs
│   ├── test/                     # Test UI page
│   └── page.tsx                  # Dashboard
├── components/                   # React components
│   ├── ui/                       # Buttons, Cards, etc.
│   ├── prompt/                   # Briefing form, preview
│   └── pipeline/                 # Status display
├── lib/
│   ├── accounts/                 # Account configurations
│   │   └── {account-id}/
│   │       ├── config.ts
│   │       └── assistants/{id}/{version}/
│   │           ├── injection.ts
│   │           └── prompt.md
│   ├── services/
│   │   ├── anthropic/            # Claude API client
│   │   ├── google/               # Google Sheets integration
│   │   ├── pipeline/             # Pipeline orchestration
│   │   ├── prompt-builder/       # PRISMA system, generation
│   │   └── webhook/              # Validation, parsing
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Logging, validation
├── docs/                         # Architecture docs
└── contrib/                      # Reference implementations
```

---

## 🚢 Deployment

### Vercel

This project is Vercel-ready:

```bash
npm run build  # Verify build works
vercel         # Deploy to Vercel
```

Set environment variables in Vercel dashboard:

- `ANTHROPIC_API_KEY`
- `WEBHOOK_SECRET` (for production)
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON` (optional)

### Self-Hosted

```bash
npm run build
npm start
```

---

## 🛠️ Development

### Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run typecheck  # Run TypeScript type checking
npm start          # Start production server
```

### Adding Features

See [AGENTS.md](./AGENTS.md) for development guidelines.

---

## 📊 Cost Tracking

When `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS_JSON` is configured, the pipeline logs:

- Token usage per operation
- Cost estimates
- Version history
- Operation timestamps

Data is stored in a Google Sheet named "Mermaid Prompt Builder - Costs" in a "Mermaid Prompt Builder" folder.

---

## 🔧 Troubleshooting

### "ANTHROPIC_API_KEY environment variable is not set"

Add your API key to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### "Invalid webhook signature"

Either:

1. Add `X-Test-Mode: true` header for testing
2. Configure `WEBHOOK_SECRET` and send correct signature

### Pipeline fails at "Load Account Config"

Make sure the account exists in `lib/accounts/{accountId}/config.ts`

### TypeScript errors

```bash
rm -rf node_modules && npm install
npm run typecheck
```

---

## 📜 Legacy Scripts

The repository also contains legacy Python/Bash scripts from before the Next.js migration:

- `build_assistant.py` - Old Markdown-to-JSON converter
- `update_assistant.sh` - Old curl-based API updater
- `get_assistant.sh` - Old assistant fetcher

These are kept for reference but are **not used** by the new pipeline.

---

## 📝 License

Proprietary - Mermaid Company
