#!/usr/bin/env python3
"""
Teste com mensagem real do exemplo_mesa_1.json
"""

import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))

from discord_message_parser import parse_message


def test_real_message():
    """Teste com mensagem real do Discord."""
    
    # Primeira mensagem do exemplo_mesa_1.json (Forgotten Realms)
    content = """# Forgotten Realms™: Uma Campanha Sandbox
▬ **Sistema:** *Dungeons & Dragons 2024®*
▬ **Nível:** 1 ao 20.
▬ **Estilo/Temática:** Sandbox, aventura, sobrevivência, diplomacia, exploração e alta fantasia.
▬ **Local:** Discord + Foundry VTT (**Necessário ter PC**).
▬ **Data & Horários:**
- Sábado das 12h às 16h - 5 VAGAS
-Sábado das 16h às 20h -  1 VAGA - **Em andamento**

▬ **Classificação:** +18 anos.
▬ **Mesa Paga:** R$ 30,00 por sessão (Sessão Zero gratuita).
▬ **Público:** <@&1012065638598049921> <@&1012065638556119056>"""
    
    metadata = {
        'author_username': 'ladrahas',
        'author_handle': 'Ladrahas',
        'timestamp': '2026-04-03T23:40:30.867-03:00'
    }
    
    print("=== Teste com Mensagem Real do Discord ===\n")
    print("Autor:", metadata['author_username'])
    print("Timestamp:", metadata['timestamp'])
    print("\n" + "="*60 + "\n")
    
    result = parse_message(content, metadata)
    
    print("📊 Campos Extraídos:\n")
    
    fields_to_show = [
        'title', 'system', 'type', 'modality', 'slots', 
        'language', 'price_type', 'price_amount', 'actual_gm_name',
        'contacts', 'confidence'
    ]
    
    for field in fields_to_show:
        value = result.get(field)
        if value is not None and value != [] and value != {}:
            if field == 'contacts':
                print(f"✓ {field}:")
                for contact in value:
                    print(f"  - {contact['channel']}: {contact['value']}")
            else:
                print(f"✓ {field}: {value}")
        else:
            print(f"✗ {field}: (não extraído)")
    
    print(f"\n📈 Confiança: {result.get('confidence', 0.0) * 100:.0f}%")
    
    # Validações esperadas
    expected_extractions = {
        'title': 'Forgotten Realms™: Uma Campanha Sandbox',
        'system': 'Dungeons & Dragons 2024®',
        'modality': 'online',
        'price_type': 'paga',
        'actual_gm_name': 'ladrahas'
    }
    
    print("\n=== Validação ===\n")
    passed = 0
    failed = 0
    
    for key, expected_value in expected_extractions.items():
        actual_value = result.get(key)
        # Normalizar para comparação
        if isinstance(actual_value, str):
            actual_value = actual_value.strip()
        if isinstance(expected_value, str):
            expected_value = expected_value.strip()
            
        if actual_value and expected_value.lower() in str(actual_value).lower():
            print(f"✓ {key}: OK")
            passed += 1
        else:
            print(f"✗ {key}: esperado '{expected_value}', obtido '{actual_value}'")
            failed += 1
    
    print(f"\n📊 Resultado: {passed}/{passed + failed} validações passaram")
    
    return failed == 0


if __name__ == '__main__':
    success = test_real_message()
    sys.exit(0 if success else 1)
