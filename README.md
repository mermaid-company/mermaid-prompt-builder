# MermAId Prompt Builder

A middleware tool to sync Markdown prompt files with MermAId AI assistants via API.

## Overview

This tool allows you to maintain your AI assistant prompts in a readable Markdown format and automatically sync them to the MermAId platform. Instead of editing prompts directly in the platform UI, you can:

1. Write and maintain prompts in Markdown
2. Run the build script to generate the API payload
3. Execute the update script to push changes to MermAId

## Installation

1. Clone this repository
2. Copy `.env.example` to `.env` and fill in your credentials
3. Ensure you have Python 3.6+ installed
4. Ensure you have `curl` and `jq` (optional, for pretty output) installed

```bash
cp .env.example .env
# Edit .env with your credentials
```

## Usage

### 1. Edit your prompt

Edit the `Prompt.md` file following the template structure. The file uses standard Markdown with specific sections that map to MermAId API fields.

### 2. Build the update script

```bash
python3 build_assistant.py
```

This reads `Prompt.md` and generates `update_assistant.sh` with the proper JSON payload.

### 3. Update your assistant

```bash
./update_assistant.sh
```

This sends a PATCH request to the MermAId API to update your assistant.

### One-liner

```bash
python3 build_assistant.py && ./update_assistant.sh
```

## Prompt.md Structure

The `Prompt.md` file should follow this structure:

```markdown
## IDENTIDADE
[Maps to: assistantRole]
Description of who the assistant is and its role.

## PERSONALIDADE E TOM DE VOZ
[Maps to: assistantPersonality]
How the assistant should communicate.

## SOBRE O PRODUTO
[Maps to: organizationInfo array]
Product information, pricing, benefits, etc.

## FLUXO DE ATENDIMENTO
[Maps to: promptPostlude - this and all following sections]
The conversation flow, objection handling, follow-ups, etc.
```

### Field Mapping

| Prompt.md Section | API Field |
|---|---|
| `## IDENTIDADE` | `assistantRole` |
| `## PERSONALIDADE E TOM DE VOZ` | `assistantPersonality` |
| `## SOBRE O PRODUTO` | `organizationInfo[]` |
| `## FLUXO DE ATENDIMENTO` onwards | `promptPostlude` |
| *(empty by default)* | `promptPrelude` |

### Fixed Values

These values are configured in `build_assistant.py`:

- `assistantName` - The assistant's display name
- `organizationName` - Your organization name
- `organizationBusiness` - Brief business description
- `promptPrelude` - Pre-prompt instructions (usually empty)

## Environment Variables

| Variable | Description |
|---|---|
| `MERMAID_TOKEN` | Your MermAId API token (starts with `ak_`) |
| `MERMAID_ASSISTANT_ID` | The UUID of your assistant |
| `MERMAID_ACCOUNT_ID` | Your account UUID |

## API Reference

This tool uses the MermAId Assistants API:

- **Endpoint**: `PATCH /api/assistants/{id}`
- **Auth**: Bearer token in Authorization header
- **Docs**: https://api.mermaid.chat/docs

## Features

- ✅ Markdown-based prompt editing
- ✅ Automatic JSON escaping
- ✅ UTM parameter injection for links
- ✅ Section-based field mapping
- ✅ One-command sync

## File Structure

```
mermaid-prompt-builder/
├── .env.example          # Environment variables template
├── .env                  # Your credentials (git-ignored)
├── .gitignore
├── README.md
├── Prompt.md             # Your assistant prompt (template)
├── build_assistant.py    # Middleware script
└── update_assistant.sh   # Generated script (git-ignored)
```

## License

MIT
