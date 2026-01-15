#!/usr/bin/env python3
"""
MermAId Prompt Builder - Middleware Script

Reads a Prompt.md file and generates an update_assistant.sh script
with the proper JSON payload for the MermAId API.

Usage:
    python3 build_assistant.py

The script expects:
    - Prompt.md in the same directory (or configure PROMPT_MD_PATH)
    - .env file with MERMAID_TOKEN, MERMAID_ASSISTANT_ID, MERMAID_ACCOUNT_ID

Output:
    - update_assistant.sh - Executable script to update the assistant via API
"""

import re
import json
import os
from pathlib import Path

# =============================================================================
# CONFIGURATION - Edit these values for your assistant
# =============================================================================

# Paths
SCRIPT_DIR = Path(__file__).parent
PROMPT_MD_PATH = SCRIPT_DIR / "Prompt.md"
OUTPUT_SCRIPT_PATH = SCRIPT_DIR / "update_assistant.sh"

# Fixed values that don't come from Prompt.md
# Edit these for your specific assistant
FIXED_VALUES = {
    "assistantName": "Your Assistant Name",
    "organizationName": "Your Organization",
    "organizationBusiness": "Brief description of your business.",
    "promptPrelude": "",  # Usually empty - all instructions go in promptPostlude
}

# UTM parameters for tracking (optional)
# Set to empty string to disable: UTM_PARAMS = ""
UTM_PARAMS = "utm_source=whatsapp&utm_medium=iara&utm_campaign=assistant&utm_content=link"

# Base checkout URL to apply UTMs to (optional)
CHECKOUT_BASE_URL = "https://your-checkout-url.com"

# =============================================================================
# EXTRACTION FUNCTIONS
# =============================================================================

def read_prompt_md():
    """Reads the Prompt.md file"""
    with open(PROMPT_MD_PATH, "r", encoding="utf-8") as f:
        return f.read()


def build_prompt_postlude(content: str) -> str:
    """
    Builds promptPostlude from all sections starting at ## FLUXO DE ATENDIMENTO
    This is where all the conversation guidance goes.
    """
    start_marker = "## FLUXO DE ATENDIMENTO"
    start_idx = content.find(start_marker)
    
    if start_idx == -1:
        # Fallback: try finding after a separator
        start_idx = content.find("---\n\n## FLUXO")
        if start_idx != -1:
            start_idx = content.find("## FLUXO", start_idx)
    
    if start_idx == -1:
        raise ValueError("Section '## FLUXO DE ATENDIMENTO' not found in Prompt.md")
    
    postlude_content = content[start_idx:]
    
    # Remove trailing markdown code blocks if any
    postlude_content = re.sub(r'\n```\s*$', '', postlude_content)
    
    return postlude_content.strip()


def build_assistant_role(content: str) -> str:
    """Extracts the IDENTIDADE section for assistantRole"""
    pattern = r'## IDENTIDADE\s*\n(.*?)(?=\n---|\n## )'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        role = match.group(1).strip()
        # Get just the first paragraph (main description)
        first_para = role.split('\n\n')[0]
        # Remove markdown formatting
        first_para = re.sub(r'\*\*(.+?)\*\*', r'\1', first_para)
        return first_para
    return ""


def build_assistant_personality(content: str) -> str:
    """Extracts PERSONALIDADE E TOM DE VOZ for assistantPersonality"""
    pattern = r'## PERSONALIDADE E TOM DE VOZ\s*\n(.*?)(?=\n---|\n## )'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        personality = match.group(1).strip()
        # Remove markdown bold formatting
        personality = re.sub(r'\*\*(.+?):\*\*', r'\1:', personality)
        personality = re.sub(r'\*\*(.+?)\*\*', r'\1', personality)
        return personality
    return ""


def build_organization_info(content: str) -> list:
    """Extracts product information for organizationInfo array"""
    info = []
    
    # 1. SOBRE O PRODUTO - main product info
    pattern = r'## SOBRE O PRODUTO\s*\n(.*?)(?=\n\*\*Dores que o produto resolve|\n\*\*Informações importantes)'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        produto = match.group(1).strip()
        produto = re.sub(r'\*\*(.+?):\*\*', r'\1:', produto)
        produto = re.sub(r'\*\*(.+?)\*\*', r'\1', produto)
        info.append(f"PRODUTO:\n{produto}")
    
    # 2. INFORMAÇÕES IMPORTANTES (price, access, etc)
    pattern = r'\*\*Informações importantes:\*\*\s*\n(.*?)(?=\n\*\*Link de compra|\n---|\n## )'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        preco = match.group(1).strip()
        preco = re.sub(r'\*\*(.+?):\*\*', r'\1:', preco)
        preco = re.sub(r'\*\*(.+?)\*\*', r'\1', preco)
        
        # Add link with UTM if configured
        if CHECKOUT_BASE_URL and UTM_PARAMS:
            link = f"{CHECKOUT_BASE_URL}?{UTM_PARAMS}"
            info.append(f"PREÇO E ACESSO:\n{preco}\n\nLink de compra: {link}")
        else:
            info.append(f"PREÇO E ACESSO:\n{preco}")
    
    # 3. DORES QUE O PRODUTO RESOLVE
    pattern = r'\*\*Dores que o produto resolve:\*\*\s*\n(.*?)(?=\n\*\*Informações importantes|\n---|\n## )'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        dores = match.group(1).strip()
        info.append(f"DORES QUE O PRODUTO RESOLVE:\n{dores}")
    
    # 4. PERFIL DO PÚBLICO (from IDENTIDADE section)
    pattern = r'\*\*Perfil do seu público:\*\*\s*\n(.*?)(?=\n---|\n## )'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        perfil = match.group(1).strip()
        info.append(f"PERFIL DO PÚBLICO:\n{perfil}")
    
    return info


def add_utm_to_links(content: str) -> str:
    """Adds UTM params to checkout links in the content"""
    if not CHECKOUT_BASE_URL or not UTM_PARAMS:
        return content
    
    url_with_utm = f"{CHECKOUT_BASE_URL}?{UTM_PARAMS}"
    
    # Replace base URL with UTM version
    content = content.replace(CHECKOUT_BASE_URL + "\n", url_with_utm + "\n")
    content = content.replace(CHECKOUT_BASE_URL + " ", url_with_utm + " ")
    content = content.replace(CHECKOUT_BASE_URL + ")", url_with_utm + ")")
    
    # Don't duplicate UTMs if already present
    content = re.sub(rf'{re.escape(CHECKOUT_BASE_URL)}\?[^\s\n]+', url_with_utm, content)
    
    return content


# =============================================================================
# SCRIPT GENERATION
# =============================================================================

def generate_update_script(payload: dict) -> str:
    """Generates the bash update script"""
    
    json_payload = json.dumps({"options": payload}, indent=2, ensure_ascii=False)
    
    script = f'''#!/bin/bash

# =============================================================================
# MermAId Assistant Update Script
# Generated automatically by build_assistant.py
# DO NOT EDIT THIS FILE DIRECTLY - edit Prompt.md and run the build script
# =============================================================================

# Load environment variables
source "$(dirname "$0")/.env"

# API endpoint
API_URL="https://api.mermaid.chat/api/assistants/${{MERMAID_ASSISTANT_ID}}"

# JSON payload
read -r -d '' PAYLOAD << 'EOF'
{json_payload}
EOF

# Make the API call
echo "Updating assistant ${{MERMAID_ASSISTANT_ID}}..."
response=$(curl -s -X PATCH "$API_URL" \\
  -H "Authorization: Bearer ${{MERMAID_TOKEN}}" \\
  -H "Content-Type: application/json" \\
  -d "$PAYLOAD")

# Check if jq is available for pretty printing
if command -v jq &> /dev/null; then
  echo "$response" | jq .
else
  echo "$response"
fi

echo ""
echo "Done!"
'''
    
    return script


# =============================================================================
# MAIN
# =============================================================================

def main():
    print(f"📖 Reading Prompt.md from: {PROMPT_MD_PATH}")
    
    if not PROMPT_MD_PATH.exists():
        print(f"❌ File not found: {PROMPT_MD_PATH}")
        return 1
    
    content = read_prompt_md()
    
    # Add UTMs to links
    content = add_utm_to_links(content)
    
    print("🔍 Extracting sections...")
    
    # Build the payload
    payload = {
        "assistantName": FIXED_VALUES["assistantName"],
        "organizationName": FIXED_VALUES["organizationName"],
        "organizationBusiness": FIXED_VALUES["organizationBusiness"],
        "promptPrelude": FIXED_VALUES["promptPrelude"],
    }
    
    # Extract sections from Prompt.md
    payload["assistantRole"] = build_assistant_role(content)
    payload["assistantPersonality"] = build_assistant_personality(content)
    payload["organizationInfo"] = build_organization_info(content)
    payload["promptPostlude"] = build_prompt_postlude(content)
    
    # Validate
    if not payload["assistantRole"]:
        print("⚠️  assistantRole is empty!")
    if not payload["assistantPersonality"]:
        print("⚠️  assistantPersonality is empty!")
    if not payload["organizationInfo"]:
        print("⚠️  organizationInfo is empty!")
    if not payload["promptPostlude"]:
        print("⚠️  promptPostlude is empty!")
    
    print(f"✅ assistantRole: {len(payload['assistantRole'])} chars")
    print(f"✅ assistantPersonality: {len(payload['assistantPersonality'])} chars")
    print(f"✅ organizationInfo: {len(payload['organizationInfo'])} items")
    print(f"✅ promptPostlude: {len(payload['promptPostlude'])} chars")
    
    # Generate the script
    print(f"\n📝 Generating script: {OUTPUT_SCRIPT_PATH}")
    script = generate_update_script(payload)
    
    with open(OUTPUT_SCRIPT_PATH, "w", encoding="utf-8") as f:
        f.write(script)
    
    # Make executable
    os.chmod(OUTPUT_SCRIPT_PATH, 0o755)
    
    print("✅ Script generated successfully!")
    print(f"\n🚀 To update your assistant, run:")
    print(f"   ./update_assistant.sh")
    
    return 0


if __name__ == "__main__":
    exit(main())
