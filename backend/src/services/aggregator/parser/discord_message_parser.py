#!/usr/bin/env python3
"""
Discord Message Parser

Parser inteligente de mensagens do Discord usando NLP (spaCy).
Extrai campos estruturados de anúncios de mesas de RPG.

Uso:
    python discord_message_parser.py <content> [--metadata <json>]
    
Exemplo:
    python discord_message_parser.py "# Dungeons & Dragons\n▬ Sistema: D&D 5e\n▬ Vagas: 4"
"""

import sys
import json
import re
from typing import Dict, Any, Optional
from schemas import ParsedMessage, ParserMetadata, Contact


def parse_message(content: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Parse uma mensagem do Discord e extrai campos estruturados.
    
    Args:
        content: Texto bruto da mensagem
        metadata: Metadados opcionais (author, timestamp, etc.)
    
    Returns:
        Dict com campos extraídos e validados
    """
    
    if not content or not isinstance(content, str):
        return {"error": "Content inválido"}
    
    # Normalizar quebras de linha
    content = content.replace('\r\n', '\n').replace('\r', '\n')
    
    # Extrair campos
    extracted = {}
    
    # 1. Título (primeira linha com # ou primeira linha não vazia)
    extracted['title'] = extract_title(content)
    
    # 2. Sistema
    extracted['system'] = extract_system(content)
    
    # 3. Tipo (campanha/oneshot)
    extracted['type'] = extract_type(content)
    
    # 4. Modalidade (online/presencial/híbrida)
    extracted['modality'] = extract_modality(content)
    
    # 5. Vagas
    extracted['slots'] = extract_slots(content)
    
    # 6. Idioma
    extracted['language'] = extract_language(content)
    
    # 7. Data de início
    extracted['starts_at'] = extract_start_date(content)
    
    # 8. Horário/Schedule
    extracted['schedule'] = extract_schedule(content)
    
    # 9. Frequência
    extracted['frequency'] = extract_frequency(content)
    
    # 10. Preço
    price_info = extract_price(content)
    extracted['price_type'] = price_info.get('type')
    extracted['price_amount'] = price_info.get('amount')
    
    # 11. Descrição (texto longo)
    extracted['description'] = extract_description(content)
    
    # 12. Regras/Observações
    extracted['rules_notes'] = extract_rules(content)
    
    # 13. Nome do mestre
    extracted['actual_gm_name'] = extract_gm_name(content, metadata)
    
    # 14. Contatos
    extracted['contacts'] = extract_contacts(content, metadata)
    
    # 15. Banner URL (primeira imagem dos attachments)
    extracted['banner_url'] = extract_banner_url(metadata)
    
    # 16. Avatar URL (avatar do autor)
    extracted['avatar_url'] = extract_avatar_url(metadata)
    
    # 17. Confiança (score baseado em quantos campos foram extraídos)
    extracted['confidence'] = calculate_confidence(extracted)
    
    # Validar com Pydantic
    try:
        parsed = ParsedMessage(**extracted)
        return parsed.model_dump(exclude_none=True)
    except Exception as e:
        # Se validação falhar, retornar dados brutos com aviso
        return {
            **extracted,
            "validation_error": str(e)
        }


def extract_title(content: str) -> Optional[str]:
    """Extrai título da mensagem."""
    lines = content.strip().split('\n')
    
    # Tentar primeira linha com #
    for line in lines:
        line = line.strip()
        if line.startswith('#'):
            title = re.sub(r'^#+\s*', '', line)
            title = re.sub(r'\*\*|\*|__', '', title)  # Remover markdown
            return title.strip() if title else None
    
    # Fallback: primeira linha não vazia
    for line in lines:
        line = line.strip()
        if line and not line.startswith('▬') and not line.startswith('-'):
            return line[:100]  # Limitar a 100 chars
    
    return None


def extract_system(content: str) -> Optional[str]:
    """Extrai sistema de RPG."""
    patterns = [
        r'▬\s*\*\*sistema\*\*:\s*(.+?)(?:\n|$)',
        r'(?:sistema|system):\s*(.+?)(?:\n|$)',
        r'🎲\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            system = match.group(1).strip()
            system = re.sub(r'\*\*|\*|__', '', system)
            return system if system else None
    
    return None


def extract_type(content: str) -> Optional[str]:
    """Extrai tipo de mesa (campanha/oneshot)."""
    content_lower = content.lower()
    
    if any(word in content_lower for word in ['oneshot', 'one-shot', 'aventura única', 'sessão única']):
        return 'oneshot'
    
    if any(word in content_lower for word in ['campanha', 'campaign', 'longa duração']):
        return 'campanha'
    
    return None


def extract_modality(content: str) -> Optional[str]:
    """Extrai modalidade (online/presencial/híbrida)."""
    content_lower = content.lower()
    
    has_online = any(word in content_lower for word in ['online', 'remoto', 'virtual', 'discord', 'roll20', 'foundry'])
    has_presencial = any(word in content_lower for word in ['presencial', 'físico', 'local', 'cidade'])
    
    if has_online and has_presencial:
        return 'hibrida'
    elif has_online:
        return 'online'
    elif has_presencial:
        return 'presencial'
    
    return None


def extract_slots(content: str) -> Optional[int]:
    """Extrai número de vagas."""
    patterns = [
        r'▬\s*\*\*vagas?\*\*:\s*(\d+)',
        r'(?:vagas?|slots?|jogadores?):\s*(\d+)',
        r'(\d+)\s+vagas?',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
    
    return None


def extract_language(content: str) -> Optional[str]:
    """Extrai idioma."""
    content_lower = content.lower()
    
    # Detectar inglês explicitamente
    if any(word in content_lower for word in ['inglês', 'english', 'en-us', 'in english']):
        return 'en-US'
    
    # Detectar espanhol explicitamente
    if any(word in content_lower for word in ['espanhol', 'español', 'en español']):
        return 'es'
    
    # Padrão: português (contexto brasileiro)
    return 'pt-BR'


def extract_start_date(content: str) -> Optional[str]:
    """Extrai data de início (retorna string ISO 8601)."""
    # TODO: Implementar com dateparser
    # Por enquanto, retorna None
    return None


def extract_schedule(content: str) -> Optional[str]:
    """Extrai horário e dia da semana."""
    patterns = [
        r'((?:segunda|terça|quarta|quinta|sexta|sábado|domingo)s?(?:-feiras?)?)\s+(?:das?|às?)\s+(\d{1,2}h?\d{0,2})',
        r'(?:horário|schedule):\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    
    return None


def extract_frequency(content: str) -> Optional[str]:
    """Extrai frequência (semanal/quinzenal/mensal)."""
    content_lower = content.lower()
    
    if any(word in content_lower for word in ['semanal', 'toda semana', 'semanalmente']):
        return 'semanal'
    
    if any(word in content_lower for word in ['quinzenal', 'a cada 15 dias', 'quinzenalmente']):
        return 'quinzenal'
    
    if any(word in content_lower for word in ['mensal', 'todo mês', 'mensalmente']):
        return 'mensal'
    
    if any(word in content_lower for word in ['única', 'oneshot', 'one-shot']):
        return 'unica'
    
    return None


def extract_price(content: str) -> Dict[str, Any]:
    """Extrai informações de preço."""
    content_lower = content.lower()
    
    # Primeiro, tentar extrair valor monetário
    price_patterns = [
        r'r\$\s*(\d+(?:[,\.]\d{2})?)',
        r'(\d+(?:[,\.]\d{2})?)\s*reais',
        r'valor:\s*r?\$?\s*(\d+(?:[,\.]\d{2})?)',
    ]
    
    for pattern in price_patterns:
        match = re.search(pattern, content_lower)
        if match:
            try:
                amount_str = match.group(1).replace(',', '.')
                amount = float(amount_str)
                return {'type': 'paga', 'amount': amount}
            except ValueError:
                pass
    
    # Se encontrou "paga" ou "pago" sem valor específico
    if any(word in content_lower for word in ['paga', 'pago', 'mesa paga']):
        return {'type': 'paga', 'amount': None}
    
    # Detectar gratuita explicitamente mencionada
    if any(word in content_lower for word in ['gratuita', 'grátis', 'free', 'sem custo']):
        return {'type': 'gratuita', 'amount': None}
    
    # Fallback: se não mencionar preço, assume gratuita
    return {'type': 'gratuita', 'amount': None}


def extract_description(content: str) -> Optional[str]:
    """Extrai descrição longa (texto após campos estruturados)."""
    # TODO: Implementar lógica mais sofisticada
    # Por enquanto, retorna None
    return None


def extract_rules(content: str) -> Optional[str]:
    """Extrai regras e observações."""
    patterns = [
        r'(?:regras?|rules?|observações?):\s*(.+?)(?:\n\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            return match.group(1).strip()
    
    return None


def extract_gm_name(content: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Extrai nome do mestre."""
    # Tentar extrair do conteúdo
    patterns = [
        r'(?:mestre|gm|dm):\s*(.+?)(?:\n|$)',
        r'narrado por:\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    # Fallback: usar author do metadata
    if metadata and 'author_username' in metadata:
        return metadata['author_username']
    
    return None


def extract_contacts(content: str, metadata: Optional[Dict[str, Any]] = None) -> list:
    """Extrai contatos de recrutamento."""
    contacts = []
    
    # Discord (do metadata)
    if metadata:
        if 'author_username' in metadata:
            contacts.append({
                'channel': 'discord',
                'value': metadata['author_username'],
                'extra_url': None
            })
        elif 'author_handle' in metadata:
            contacts.append({
                'channel': 'discord',
                'value': metadata['author_handle'],
                'extra_url': None
            })
    
    # WhatsApp (regex)
    whatsapp_match = re.search(r'(?:whatsapp|wpp|zap):\s*(\+?\d[\d\s\-\(\)]+)', content, re.IGNORECASE)
    if whatsapp_match:
        contacts.append({
            'channel': 'whatsapp',
            'value': whatsapp_match.group(1).strip(),
            'extra_url': None
        })
    
    # Email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', content)
    if email_match:
        contacts.append({
            'channel': 'email',
            'value': email_match.group(0),
            'extra_url': None
        })
    
    return contacts


def extract_banner_url(metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Extrai URL da primeira imagem dos attachments."""
    if not metadata:
        return None
    
    attachments = metadata.get('attachments', [])
    if not attachments or not isinstance(attachments, list):
        return None
    
    # Pegar primeira imagem
    for attachment in attachments:
        if not isinstance(attachment, dict):
            continue
        
        url = attachment.get('url', '')
        if url and any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp']):
            return url
    
    return None


def extract_avatar_url(metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Extrai URL do avatar do autor."""
    if not metadata:
        return None
    
    # Tentar pegar do author
    author = metadata.get('author', {})
    if isinstance(author, dict):
        avatar_url = author.get('avatarUrl') or author.get('avatar_url')
        if avatar_url:
            return avatar_url
    
    # Fallback: tentar direto no metadata
    return metadata.get('author_avatar_url') or metadata.get('avatarUrl')


def calculate_confidence(extracted: Dict[str, Any]) -> float:
    """Calcula score de confiança baseado em campos extraídos."""
    total_fields = 14  # Número de campos principais
    filled_fields = sum(1 for v in extracted.values() if v is not None and v != [] and v != {})
    
    return round(filled_fields / total_fields, 2)


def main():
    """CLI para testar o parser."""
    if len(sys.argv) < 2:
        print("Uso: python discord_message_parser.py <content> [--metadata <json>]")
        sys.exit(1)
    
    content = sys.argv[1]
    metadata = None
    
    if len(sys.argv) >= 4 and sys.argv[2] == '--metadata':
        try:
            metadata = json.loads(sys.argv[3])
        except json.JSONDecodeError:
            print("Erro: metadata deve ser JSON válido")
            sys.exit(1)
    
    result = parse_message(content, metadata)
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()
