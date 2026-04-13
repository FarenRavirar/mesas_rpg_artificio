#!/bin/bash
# Hook executado antes de cada tarefa
# Força o agente a re-ler só o essencial

echo "=== CONTEXTO LIMPO ==="
echo "Leia apenas:"
echo "1. RESUMO_EXECUCAO.md"
echo "2. O item atual da FILA (use grep para encontrar)"
echo "3. Nada mais até precisar"
echo "======================"