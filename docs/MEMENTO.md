# Memento: MermAId Prompt Builder

Session tracking and development notes for the MermAId Prompt Builder project.

---

## Session: 2026-01-20

### Objective
Complete the end-to-end flow: after generating a prompt from a briefing, allow updating the MermAId Chat assistant directly from the UI with a button.

### Changes Made

#### 1. MermAId API Service (`lib/services/mermaid/`)
Created new service for MermAId Chat API integration:

- **`client.ts`** - API client with:
  - `getAssistant(assistantId)` - Fetch assistant configuration
  - `updateAssistant(assistantId, options)` - Update assistant via PATCH
  - `parsePromptToMermaidOptions()` - Convert prompt to MermAId format
  - `MermaidAssistantOptions` interface matching API payload structure

- **`index.ts`** - Barrel export for the service

#### 2. API Route (`app/api/assistants/update/route.ts`)
Created POST endpoint for updating assistants:

- Accepts `assistantId`, `promptContent`, and `metadata`
- Can receive pre-formatted `options` directly
- Calls MermAId API with proper authentication
- Returns success/error status

#### 3. Injection File Generator (`lib/services/prompt-builder/injection.ts`)
Enhanced to support MermAId API:

- Added `MERMAID_OPTIONS` export with proper payload structure
- Added `updateMermaidAssistant()` function for direct API updates
- Added metadata fields: `assistantName`, `organizationName`, `organizationBusiness`
- Replaced Anthropic SDK dependency with direct fetch calls
- Injection files now self-contained and executable

#### 4. Test Page UI (`app/test/page.tsx`)
Added Update Agent functionality:

- New state: `updating`, `updateSuccess`, `updateError`
- `handleUpdateAgent()` function to call the update API
- **"Update Agent" button** in the generated prompt section
- Success/error feedback display with styled badges

#### 5. Documentation
- Created `docs/ARCHITECTURE.md` - Full system architecture documentation
- Created `docs/MEMENTO.md` - This session tracking file

### API Flow (New)

```
User fills briefing form
        │
        ▼
POST /api/webhook/briefing (test mode)
        │
        ▼
Pipeline generates prompt
        │
        ▼
UI displays prompt + "Update Agent" button
        │
        ▼ (user clicks button)
        │
POST /api/assistants/update
        │
        ▼
PATCH https://api.mermaid.chat/api/assistants/{id}
        │
        ▼
Success/Error feedback in UI
```

### MermAId API Payload Structure

```typescript
{
  options: {
    assistantName: string;
    organizationName: string;
    organizationBusiness: string;
    promptPrelude: string;
    assistantRole: string;
    assistantPersonality: string;
    organizationInfo: string[];
    promptPostlude: string;  // ← Full generated prompt goes here
  }
}
```

### Files Modified/Created

| File | Action | Description |
|------|--------|-------------|
| `lib/services/mermaid/index.ts` | Created | Service barrel export |
| `lib/services/mermaid/client.ts` | Created | MermAId API client |
| `app/api/assistants/update/route.ts` | Created | Update endpoint |
| `lib/services/prompt-builder/injection.ts` | Modified | Added MermAId support |
| `app/test/page.tsx` | Modified | Added Update Agent button |
| `docs/ARCHITECTURE.md` | Created | Architecture documentation |
| `docs/MEMENTO.md` | Created | Session tracking |

### Environment Variables Required

```bash
MERMAID_TOKEN=ak_...           # Required for API calls
MERMAID_ASSISTANT_ID=...       # Default assistant (optional)
```

### Testing Notes

1. The test page now has a complete flow:
   - Fill briefing form (or use JSON mode)
   - Click "Gerar Prompt" to generate
   - Review the generated prompt
   - Click "Update Agent" to push to MermAId API

2. Test mode (`X-Test-Mode: true`) skips webhook signature validation

3. The injection files generated in `lib/accounts/[accountId]/assistants/[assistantId]/[version]/` are now fully executable and include the `updateMermaidAssistant()` function.

### Next Steps (Potential)

- [ ] Add confirmation dialog before updating agent
- [ ] Show diff between current and new prompt
- [ ] Add rollback capability
- [ ] Implement version history UI
- [ ] Add cost estimation before update
- [ ] Real-time pipeline status via WebSocket/SSE

---

## Previous Sessions

*(No previous sessions documented)*
