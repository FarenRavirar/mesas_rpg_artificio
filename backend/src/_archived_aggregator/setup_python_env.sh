#!/bin/bash
# Setup Python Environment for Discord Message Parser
# Linux/Mac Bash Script
# Uso: bash setup_python_env.sh

set -e

echo "=== Setup Python Environment ==="
echo ""

# Verificar se Python está instalado
echo "Verificando instalação do Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python encontrado: $PYTHON_VERSION"
else
    echo "✗ Python não encontrado. Instale Python 3.8+ antes de continuar."
    exit 1
fi

# Verificar versão mínima (3.8+)
PYTHON_MAJOR=$(python3 -c 'import sys; print(sys.version_info.major)')
PYTHON_MINOR=$(python3 -c 'import sys; print(sys.version_info.minor)')
if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
    echo "✗ Python 3.8+ é necessário. Versão atual: $PYTHON_VERSION"
    exit 1
fi

echo ""

# Atualizar pip
echo "Atualizando pip..."
python3 -m pip install --upgrade pip --quiet
echo "✓ pip atualizado com sucesso"

echo ""

# Instalar dependências do requirements.txt
echo "Instalando dependências do requirements.txt..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQUIREMENTS_PATH="$SCRIPT_DIR/../requirements.txt"

if [ -f "$REQUIREMENTS_PATH" ]; then
    pip3 install -r "$REQUIREMENTS_PATH"
    echo "✓ Dependências instaladas com sucesso"
else
    echo "✗ Arquivo requirements.txt não encontrado em: $REQUIREMENTS_PATH"
    exit 1
fi

echo ""

# Baixar modelo spaCy pt_core_news_lg
echo "Baixando modelo spaCy pt_core_news_lg..."
echo "(Isso pode levar alguns minutos na primeira vez)"
python3 -m spacy download pt_core_news_lg
echo "✓ Modelo spaCy baixado com sucesso"

echo ""

# Validar instalação do modelo
echo "Validando instalação do modelo spaCy..."
python3 -m spacy info pt_core_news_lg > /dev/null 2>&1
echo "✓ Modelo pt_core_news_lg validado com sucesso"

echo ""
echo "=== Setup concluído com sucesso! ==="
echo ""
echo "Próximos passos:"
echo "1. Implementar parser core em src/services/aggregator/parser/"
echo "2. Criar extractors modulares"
echo "3. Integrar com backend Node.js"
echo ""
