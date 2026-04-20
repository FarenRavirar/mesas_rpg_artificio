#!/usr/bin/env python3
# -*- coding: utf-8 -*-

input_file = r"c:\projetos\mesas_rpg_artificio\sessoes\26-04-18_1_auditoria-sistemas-etapa-1.md"
output_file = r"c:\projetos\mesas_rpg_artificio\sessoes\26-04-18_1_auditoria-sistemas-etapa-1_clean.md"

# Ler arquivo preservando encoding UTF-8
with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Manter apenas as primeiras 1747 linhas (onde termina o checklist consolidado)
clean_lines = lines[:1747]

# Escrever arquivo limpo com UTF-8 sem BOM, preservando line endings originais
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    f.writelines(clean_lines)

print(f"Arquivo limpo criado: {output_file}")
print(f"Linhas originais: {len(lines)}")
print(f"Linhas mantidas: {len(clean_lines)}")
print(f"Linhas removidas: {len(lines) - len(clean_lines)}")
