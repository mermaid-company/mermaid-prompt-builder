#!/bin/bash
# Script para buscar configuração atual do assistente na API MermAId

# Carrega variáveis do .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Validação
if [ -z "$MERMAID_TOKEN" ] || [ -z "$MERMAID_ASSISTANT_ID" ]; then
    echo "❌ Erro: MERMAID_TOKEN e MERMAID_ASSISTANT_ID são obrigatórios no .env"
    exit 1
fi

API_URL="https://api.mermaid.chat/api/assistants/${MERMAID_ASSISTANT_ID}"

echo "📥 Buscando assistente ${MERMAID_ASSISTANT_ID}..."

# Faz a requisição GET
RESPONSE=$(curl -s -X GET "$API_URL" \
  -H "Authorization: Bearer ${MERMAID_TOKEN}" \
  -H "Content-Type: application/json")

# Verifica se jq está disponível para formatação
if command -v jq &> /dev/null; then
    echo "$RESPONSE" | jq .
else
    echo "$RESPONSE"
fi

echo ""
echo "✅ Done!"
