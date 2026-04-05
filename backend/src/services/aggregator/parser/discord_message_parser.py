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
from typing import Dict, Any, Optional, List
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
    
    # 17. Platforms (plataformas de jogo)
    extracted['platforms'] = extract_platforms(content)
    
    # 18. Age Rating (classificação indicativa)
    extracted['ageRating'] = extract_age_rating(content)
    
    # 19. Synopsis (sinopse/descrição)
    extracted['synopsis'] = extract_synopsis(content)
    
    # 20. Style (estilo/temática - legado)
    extracted['style'] = extract_style(content)
    
    # 21. Setting name (cenário - REQ-28)
    extracted['setting_name'] = extract_setting_name(content)
    
    # 22. Setting styles (estilos como array - REQ-28)
    extracted['setting_styles'] = extract_setting_styles(content)
    
    # 23. Signup Text (texto de inscrição)
    extracted['signupText'] = extract_signup_text(content)
    
    # 22. Location (localização para mesas presenciais)
    extracted['location'] = extract_location(content)
    
    # 23. Level range (faixa de nível)
    extracted['level_range'] = extract_level_range(content)
    
    # 18. Session duration (duração da sessão)
    extracted['session_duration'] = extract_session_duration(content)
    
    # 19. Campaign length (duração da campanha)
    extracted['campaign_length'] = extract_campaign_length(content)
    
    # 20. Experience required (experiência necessária)
    extracted['experience_required'] = extract_experience_required(content)
    
    # 21. Tags
    extracted['tags'] = extract_tags(content)
    
    # 22. Requires PC
    extracted['requires_pc'] = extract_requires_pc(content)
    
    # 23. External links
    extracted['external_links'] = extract_external_links(content, metadata)
    
    # ========================================================================
    # FASE B: FUNCIONALIDADES AVANÇADAS
    # ========================================================================
    
    # 24. Múltiplos horários (sessões estruturadas)
    extracted['sessions'] = extract_multiple_schedules(content)
    
    # 25. Vagas detalhadas (total, disponíveis, preenchidas)
    slots_detailed = extract_slots_detailed(content)
    extracted['slots_total'] = slots_detailed.get('slots_total')
    extracted['slots_available'] = slots_detailed.get('slots_available')
    extracted['slots_filled'] = slots_detailed.get('slots_filled')
    
    # 26. Classificação de sistema
    system_classification = classify_system(extracted.get('system', ''), content)
    extracted['system_raw'] = system_classification.get('system_raw')
    extracted['system_normalized'] = system_classification.get('system_normalized')
    extracted['system_classification'] = system_classification.get('system_classification')
    extracted['is_homebrew'] = system_classification.get('is_homebrew')
    extracted['is_custom'] = system_classification.get('is_custom')
    
    # 27. Classificação de pagamento
    payment_classification = classify_payment(
        content,
        extracted.get('price_type', ''),
        extracted.get('price_amount')
    )
    extracted['payment_classification'] = payment_classification.get('payment_classification')
    
    # 28. Classificação de tipo de candidato
    candidate_classification = classify_candidate_kind(content, extracted.get('title', ''))
    extracted['candidate_kind'] = candidate_classification.get('candidate_kind')
    
    # 29. Separação mestre vs anunciante
    master_resolution = resolve_master_vs_recruiter(content, metadata)
    extracted['master_display_name'] = master_resolution.get('master_display_name')
    extracted['recruiter_name'] = master_resolution.get('recruiter_name')
    extracted['publisher_role'] = master_resolution.get('publisher_role')
    extracted['is_same_person'] = master_resolution.get('is_same_person')

    
    # 24. Confiança (score baseado em quantos campos foram extraídos)
    confidence_data = calculate_confidence(extracted)
    extracted['confidence'] = confidence_data['overall']
    extracted['confidence_by_field'] = confidence_data['by_field']
    extracted['missingFields'] = confidence_data['missing_fields']
    extracted['reviewFlags'] = confidence_data['review_flags']
    
    # Debug info
    extracted['debug'] = {
        'required_filled': confidence_data['required_filled'],
        'required_total': confidence_data['required_total'],
        'optional_filled': confidence_data['optional_filled'],
        'optional_total': confidence_data['optional_total'],
    }
    
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


def extract_platforms(content: str) -> Optional[str]:
    """Extrai plataformas de jogo (Discord, Roll20, Foundry, etc.)."""
    patterns = [
        r'(?:plataformas?|ferramentas?):\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            platforms = match.group(1).strip()
            platforms = re.sub(r'\*\*|\*|__', '', platforms)
            return platforms if platforms else None
    
    # Detectar plataformas comuns no texto
    detected = []
    content_lower = content.lower()
    
    platform_keywords = {
        'Discord': ['discord'],
        'Roll20': ['roll20', 'roll 20'],
        'Foundry VTT': ['foundry', 'foundry vtt'],
        'Owlbear': ['owlbear'],
        'Alchemy': ['alchemy'],
        'Astral': ['astral'],
        'Fantasy Grounds': ['fantasy grounds'],
        'Tabletop Simulator': ['tabletop simulator', 'tts'],
    }
    
    for platform, keywords in platform_keywords.items():
        if any(keyword in content_lower for keyword in keywords):
            detected.append(platform)
    
    return ', '.join(detected) if detected else None


def extract_age_rating(content: str) -> Optional[str]:
    """Extrai classificação indicativa (+18, +16, etc.)."""
    patterns = [
        r'(?:classificação|idade|faixa etária):\s*(.+?)(?:\n|$)',
        r'(\+\d{2})',
        r'(\d{2}\+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            rating = match.group(1).strip()
            rating = re.sub(r'\*\*|\*|__', '', rating)
            return rating if rating else None
    
    return None


def extract_synopsis(content: str) -> Optional[str]:
    """Extrai sinopse/descrição da mesa."""
    patterns = [
        r'(?:sinopse|sobre|história|resumo|descrição):\s*(.+?)(?:\n\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            synopsis = match.group(1).strip()
            synopsis = re.sub(r'\*\*|\*|__', '', synopsis)
            # Limitar a 500 caracteres
            return synopsis[:500] if synopsis else None
    
    # Fallback: pegar parágrafos longos (> 100 chars)
    lines = content.split('\n')
    for line in lines:
        line = line.strip()
        if len(line) > 100 and not line.startswith('▬') and not line.startswith('-'):
            return line[:500]
    
    return None


def extract_style(content: str) -> Optional[str]:
    """Extrai estilo/temática da mesa (legado - mantido por compatibilidade)."""
    patterns = [
        r'(?:estilo|temática|tema):\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            style = match.group(1).strip()
            style = re.sub(r'\*\*|\*|__', '', style)
            return style if style else None
    
    return None


def extract_setting_name(content: str) -> Optional[str]:
    """Extrai cenário/ambientação da mesa (REQ-28)."""
    # Padrões explícitos
    patterns = [
        r'(?:cenário|ambientação|setting|mundo|universo):\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            setting = match.group(1).strip()
            setting = re.sub(r'\*\*|\*|__', '', setting)
            return setting if setting else None
    
    # Detecção de cenários conhecidos (apenas se mencionados explicitamente no texto)
    known_settings = [
        'Forgotten Realms', 'Reinos Esquecidos', 'Faerûn',
        'Eberron', 'Ravenloft', 'Dark Sun', 'Greyhawk',
        'Golarion', 'Varisia',
        'Arkham', 'Innsmouth',
        'Tormenta', 'Arton'
    ]
    
    for setting in known_settings:
        if setting.lower() in content.lower():
            return setting
    
    return None


def extract_setting_styles(content: str) -> List[str]:
    """Extrai estilos/temáticas da mesa como array (REQ-28)."""
    patterns = [
        r'(?:estilos?|temáticas?|temas?|gêneros?):\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            styles_text = match.group(1).strip()
            styles_text = re.sub(r'\*\*|\*|__', '', styles_text)
            
            # Split por vírgula, ponto-e-vírgula ou barra
            styles = re.split(r'[,;/]', styles_text)
            styles = [s.strip() for s in styles if s.strip()]
            
            # Limitar a 10 estilos
            return styles[:10] if styles else []
    
    return []


def extract_signup_text(content: str) -> Optional[str]:
    """Extrai texto de inscrição (como se inscrever)."""
    patterns = [
        r'(?:inscrição|inscrever|interessados?|contato|como participar):\s*(.+?)(?:\n\n|$)',
        r'(?:mande|envie)\s+(?:dm|mensagem|mp)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
        if match:
            signup = match.group(0).strip()
            signup = re.sub(r'\*\*|\*|__', '', signup)
            return signup[:200] if signup else None
    
    return None


def extract_location(content: str) -> Optional[str]:
    """Extrai localização para mesas presenciais."""
    patterns = [
        r'(?:local|localização|endereço|cidade):\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            location = match.group(1).strip()
            location = re.sub(r'\*\*|\*|__', '', location)
            return location if location else None
    
    # Detectar cidades brasileiras comuns
    cities = [
        'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília',
        'Curitiba', 'Porto Alegre', 'Salvador', 'Fortaleza', 'Recife',
        'Manaus', 'Belém', 'Goiânia', 'Campinas', 'Florianópolis'
    ]
    
    for city in cities:
        if city.lower() in content.lower():
            return city
    
    return None


# ============================================================================
# FASE B: FUNCIONALIDADES AVANÇADAS
# ============================================================================

def extract_multiple_schedules(content: str) -> List[Dict[str, Any]]:
    """
    Extrai múltiplas sessões estruturadas.
    
    Detecta padrões como:
    - "Domingos às 13h"
    - "Sábados 14h-18h (4 vagas)"
    - "Domingos 13h e Quartas 20h"
    """
    sessions = []
    
    # Padrão: Dia + horário com possível faixa
    # "Domingos 13h", "Sábados 14h-18h"
    pattern = r'(segunda|terça|quarta|quinta|sexta|sábado|domingo)s?\s+(?:às\s+)?(\d{1,2})[h:](\d{2})?(?:\s*[-–]\s*(\d{1,2})[h:](\d{2})?)?'
    
    matches = re.finditer(pattern, content, re.IGNORECASE)
    
    for match in matches:
        day = match.group(1).capitalize()
        start_hour = match.group(2)
        start_min = match.group(3) or "00"
        end_hour = match.group(4)
        end_min = match.group(5) or "00" if end_hour else None
        
        session = {
            "day_of_week": day,
            "start_time": f"{start_hour}:{start_min}",
            "end_time": f"{end_hour}:{end_min}" if end_hour else None,
            "frequency": "semanal",  # Padrão
            "slots_total": None,
            "slots_available": None,
            "in_progress": False,
            "notes": None
        }
        
        # Detectar frequência
        if re.search(r'quinzenal', content, re.IGNORECASE):
            session["frequency"] = "quinzenal"
        elif re.search(r'mensal', content, re.IGNORECASE):
            session["frequency"] = "mensal"
        
        # Detectar se está em andamento
        if re.search(r'em\s+andamento|fechada', content, re.IGNORECASE):
            session["in_progress"] = True
        
        sessions.append(session)
    
    return sessions if sessions else []


def extract_slots_detailed(content: str) -> Dict[str, Optional[int]]:
    """
    Extrai vagas totais, disponíveis e preenchidas.
    
    Detecta padrões como:
    - "4 vagas" → total: 4, disponíveis: 4
    - "2/4 vagas" → total: 4, disponíveis: 2
    - "4 vagas (2 preenchidas)" → total: 4, disponíveis: 2
    - "Restam 3 vagas" → disponíveis: 3
    """
    result = {
        "slots_total": None,
        "slots_available": None,
        "slots_filled": None
    }
    
    # Padrão 1: "X/Y vagas"
    pattern1 = r'(\d+)\s*/\s*(\d+)\s+vagas?'
    match = re.search(pattern1, content, re.IGNORECASE)
    if match:
        result["slots_available"] = int(match.group(1))
        result["slots_total"] = int(match.group(2))
        result["slots_filled"] = result["slots_total"] - result["slots_available"]
        return result
    
    # Padrão 2: "X vagas (Y preenchidas)"
    pattern2 = r'(\d+)\s+vagas?\s*\((\d+)\s+preenchidas?\)'
    match = re.search(pattern2, content, re.IGNORECASE)
    if match:
        result["slots_total"] = int(match.group(1))
        result["slots_filled"] = int(match.group(2))
        result["slots_available"] = result["slots_total"] - result["slots_filled"]
        return result
    
    # Padrão 3: "Restam X vagas"
    pattern3 = r'restam?\s+(\d+)\s+vagas?'
    match = re.search(pattern3, content, re.IGNORECASE)
    if match:
        result["slots_available"] = int(match.group(1))
        return result
    
    # Padrão 4: "X vagas" (simples)
    pattern4 = r'(\d+)\s+vagas?'
    match = re.search(pattern4, content, re.IGNORECASE)
    if match:
        result["slots_total"] = int(match.group(1))
        result["slots_available"] = int(match.group(1))
        return result
    
    return result


def classify_system(system_text: str, content: str) -> Dict[str, Any]:
    """
    Classifica o sistema extraído.
    
    Retorna classificação: válido, inválido, revisável
    Detecta homebrew e sistema próprio
    """
    result = {
        "system_raw": system_text,
        "system_normalized": system_text,
        "system_classification": "válido",
        "is_homebrew": False,
        "is_custom": False,
        "confidence": 1.0
    }
    
    if not system_text:
        result["system_classification"] = "inválido"
        result["confidence"] = 0.0
        return result
    
    system_lower = system_text.lower()
    content_lower = content.lower()
    
    # Detectar homebrew
    homebrew_keywords = ['homebrew', 'caseiro', 'próprio', 'autoral', 'adaptado']
    if any(keyword in system_lower or keyword in content_lower for keyword in homebrew_keywords):
        result["is_homebrew"] = True
        result["system_classification"] = "revisável"
        result["confidence"] = 0.6
        
        # Tentar extrair sistema base
        base_systems = {
            'd&d': 'D&D',
            'pathfinder': 'Pathfinder',
            'fate': 'FATE',
            'savage worlds': 'Savage Worlds',
            'gurps': 'GURPS',
            'call of cthulhu': 'Call of Cthulhu',
            'tormenta': 'Tormenta'
        }
        
        for key, value in base_systems.items():
            if key in system_lower:
                result["system_normalized"] = value
                break
    
    # Detectar sistema próprio/experimental
    custom_keywords = ['sistema próprio', 'experimental', 'em desenvolvimento', 'criação própria']
    if any(keyword in system_lower or keyword in content_lower for keyword in custom_keywords):
        result["is_custom"] = True
        result["system_classification"] = "inválido"
        result["confidence"] = 0.3
    
    return result


def classify_payment(content: str, price_type: str, price_amount: Optional[float]) -> Dict[str, Any]:
    """
    Classifica o tipo de pagamento: gratuita, paga, ambígua
    """
    result = {
        "payment_classification": "gratuita",
        "confidence": 0.8
    }
    
    # Se já detectou preço, é paga
    if price_type == "paga" and price_amount and price_amount > 0:
        result["payment_classification"] = "paga"
        result["confidence"] = 0.95
        return result
    
    # Detectar ambiguidade
    content_lower = content.lower()
    ambiguous_keywords = [
        'contribuição voluntária',
        'valor sugerido',
        'pague quanto quiser',
        'sessão zero gratuita',
        'primeira sessão grátis'
    ]
    
    if any(keyword in content_lower for keyword in ambiguous_keywords):
        result["payment_classification"] = "ambígua"
        result["confidence"] = 0.5
    
    return result


def classify_candidate_kind(content: str, title: str) -> Dict[str, Any]:
    """
    Classifica o tipo de candidato: mesa, grupo, anúncio múltiplo, inválido
    """
    result = {
        "candidate_kind": "mesa",
        "confidence": 0.8
    }
    
    content_lower = content.lower()
    title_lower = title.lower() if title else ""
    
    # Detectar grupo/servidor
    group_keywords = [
        'servidor', 'comunidade', 'grupo de rpg',
        'discord de rpg', 'várias mesas', 'múltiplas campanhas',
        'servidor de', 'comunidade de'
    ]
    
    if any(keyword in content_lower or keyword in title_lower for keyword in group_keywords):
        result["candidate_kind"] = "grupo"
        result["confidence"] = 0.85
        return result
    
    # Detectar anúncio múltiplo
    multiple_keywords = [
        'várias vagas', 'múltiplas sessões',
        'diferentes horários', 'escolha seu horário',
        'vários horários'
    ]
    
    if any(keyword in content_lower for keyword in multiple_keywords):
        result["candidate_kind"] = "anúncio múltiplo"
        result["confidence"] = 0.7
        return result
    
    return result


def resolve_master_vs_recruiter(
    content: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Resolve quem é o mestre e quem é o anunciante.
    
    Retorna:
    - master_display_name: Nome do mestre extraído do conteúdo
    - recruiter_name: Nome do autor (quem está publicando)
    - publisher_role: "mestre" ou "anunciante"
    - is_same_person: Se são a mesma pessoa
    """
    result = {
        "master_display_name": None,
        "recruiter_name": None,
        "publisher_role": "mestre",
        "is_same_person": True,
        "confidence": 0.7
    }
    
    # Extrair nome do autor (quem está publicando)
    if metadata:
        author = metadata.get('author', {})
        result["recruiter_name"] = author.get('nickname') or author.get('name')
    
    # Extrair nome do mestre do conteúdo
    master_patterns = [
        r'mestre:\s*(.+?)(?:\n|$)',
        r'mestrado\s+por:\s*(.+?)(?:\n|$)',
        r'narrado\s+por:\s*(.+?)(?:\n|$)',
        r'dm:\s*(.+?)(?:\n|$)',
        r'narrador:\s*(.+?)(?:\n|$)',
    ]
    
    for pattern in master_patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            master_name = match.group(1).strip()
            master_name = re.sub(r'\*\*|\*|__', '', master_name)
            # Remover menções do Discord
            master_name = re.sub(r'<@!?\d+>', '', master_name).strip()
            if master_name:
                result["master_display_name"] = master_name
                result["confidence"] = 0.9
                break
    
    # Se não encontrou mestre explícito, assume que o autor é o mestre
    if not result["master_display_name"]:
        result["master_display_name"] = result["recruiter_name"]
        result["is_same_person"] = True
        result["publisher_role"] = "mestre"
        result["confidence"] = 0.6
        return result
    
    # Comparar nomes para ver se são a mesma pessoa
    if result["master_display_name"] and result["recruiter_name"]:
        master_lower = result["master_display_name"].lower()
        recruiter_lower = result["recruiter_name"].lower()
        
        # Comparação simples
        if master_lower == recruiter_lower or master_lower in recruiter_lower or recruiter_lower in master_lower:
            result["is_same_person"] = True
            result["publisher_role"] = "mestre"
        else:
            result["is_same_person"] = False
            result["publisher_role"] = "anunciante"
            result["confidence"] = 0.95
    
    return result



def extract_level_range(content: str) -> Optional[str]:
    """Extrai faixa de nível (ex: 1-5, 10-20)."""
    patterns = [
        r'(?:nível|level|lvl)s?\s*(?:de\s*)?(\d+)\s*(?:ao|a|até|-)\s*(\d+)',
        r'(?:faixa\s+de\s+)?(?:nível|level):\s*(\d+)\s*-\s*(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return f"{match.group(1)}-{match.group(2)}"
    
    return None


def extract_session_duration(content: str) -> Optional[str]:
    """Extrai duração da sessão (ex: 3h, 4 horas)."""
    patterns = [
        r'(?:duração|sessão\s+de):\s*(\d+)\s*(?:h|horas?)',
        r'(\d+)\s*(?:h|horas?)\s+de\s+(?:jogo|sessão)',
        r'das?\s+\d{1,2}h?\s+(?:às|ate)\s+(\d{1,2})h',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            hours = match.group(1)
            return f"{hours}h"
    
    return None


def extract_campaign_length(content: str) -> Optional[str]:
    """Extrai duração da campanha (ex: 6 meses, 1 ano)."""
    patterns = [
        r'(?:duração|campanha\s+de):\s*(\d+)\s+(meses?|anos?|sessões?)',
        r'(?:campanha\s+)?(curta|média|longa)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(0).strip()
    
    return None


def extract_experience_required(content: str) -> Optional[str]:
    """Extrai experiência necessária (iniciante/intermediário/avançado)."""
    content_lower = content.lower()
    
    if any(word in content_lower for word in ['iniciante', 'novato', 'novo', 'sem experiência', 'novatos']):
        return 'iniciante'
    
    if any(word in content_lower for word in ['intermediário', 'alguma experiência']):
        return 'intermediario'
    
    if any(word in content_lower for word in ['avançado', 'experiente', 'veterano']):
        return 'avancado'
    
    return None


def extract_tags(content: str) -> list:
    """Extrai tags/estilos da mesa."""
    tags = []
    content_lower = content.lower()
    
    # Tags comuns
    tag_keywords = {
        'terror': ['terror', 'horror', 'medo'],
        'investigacao': ['investigação', 'mistério', 'detetive'],
        'combate': ['combate', 'batalha', 'luta'],
        'roleplay': ['roleplay', 'interpretação', 'rp'],
        'exploracao': ['exploração', 'aventura', 'descoberta'],
        'politica': ['política', 'intriga', 'diplomacia'],
        'romance': ['romance', 'romântico', 'amor', 'romantasia'],
        'comedia': ['comédia', 'humor', 'engraçado'],
        'drama': ['drama', 'dramático'],
        'acao': ['ação', 'shounen'],
    }
    
    for tag, keywords in tag_keywords.items():
        if any(keyword in content_lower for keyword in keywords):
            tags.append(tag)
    
    return tags


def extract_requires_pc(content: str) -> bool:
    """Detecta se requer PC."""
    content_lower = content.lower()
    return any(phrase in content_lower for phrase in [
        'necessário ter pc',
        'requer pc',
        'obrigatório pc',
        'precisa de pc',
        'foundry vtt',
        'roll20',
        'necessário pc',
    ])


def extract_external_links(content: str, metadata: Optional[Dict[str, Any]] = None) -> list:
    """Extrai links externos (formulários, sites, etc.)."""
    links = []
    
    # Regex para URLs
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    matches = re.findall(url_pattern, content)
    
    for url in matches:
        # Filtrar apenas links relevantes (formulários, sites, etc.)
        if any(domain in url.lower() for domain in ['forms.gle', 'docs.google.com', 'typeform', 'jotform']):
            links.append(url)
    
    # Extrair de embeds (se metadata fornecido)
    if metadata and 'embeds' in metadata:
        embeds = metadata.get('embeds', [])
        if isinstance(embeds, list):
            for embed in embeds:
                if isinstance(embed, dict) and 'url' in embed:
                    url = embed.get('url')
                    if url and isinstance(url, str):
                        links.append(url)
    
    return list(set(links))  # Remover duplicatas





def calculate_confidence(extracted: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calcula score de confiança baseado em campos extraídos.
    Retorna dict com confidence geral, por campo, e flags de revisão.
    """
    # Campos obrigatórios
    required_fields = [
        'title', 'system', 'schedule', 'slots', 
        'language', 'price_type', 'contacts',
        'modality'
    ]
    
    # Campos opcionais
    optional_fields = [
        'level_range', 'session_duration', 'campaign_length',
        'experience_required', 'tags', 'requires_pc', 'external_links',
        'banner_url', 'avatar_url', 'description', 'rules_notes',
        'actual_gm_name', 'type', 'frequency', 'starts_at'
    ]
    
    # Calcular confidence por campo
    field_confidence = {}
    for field in required_fields + optional_fields:
        value = extracted.get(field)
        
        if value is None or value == [] or value == {}:
            field_confidence[field] = 0.0
        elif field in ['title', 'system'] and value:
            # Campos críticos: confidence alta se preenchidos
            field_confidence[field] = 1.0
        elif isinstance(value, str) and len(value) > 5:
            # Strings longas: confidence alta
            field_confidence[field] = 0.9
        elif isinstance(value, (int, float)) and value > 0:
            # Valores numéricos positivos: confidence alta
            field_confidence[field] = 0.95
        elif isinstance(value, bool):
            # Booleanos: confidence média
            field_confidence[field] = 0.8
        elif isinstance(value, list) and len(value) > 0:
            # Listas não vazias: confidence média
            field_confidence[field] = 0.8
        else:
            # Outros casos: confidence baixa
            field_confidence[field] = 0.5
    
    # Confidence geral (média ponderada)
    required_filled = sum(1 for f in required_fields if extracted.get(f) not in [None, [], {}])
    optional_filled = sum(1 for f in optional_fields if extracted.get(f) not in [None, [], {}])
    
    required_weight = 0.7
    optional_weight = 0.3
    
    required_score = required_filled / len(required_fields) if required_fields else 0
    optional_score = optional_filled / len(optional_fields) if optional_fields else 0
    
    overall_confidence = round(
        required_score * required_weight + optional_score * optional_weight,
        2
    )
    
    # Identificar campos faltantes (apenas obrigatórios)
    missing_fields = [
        field for field in required_fields
        if extracted.get(field) in [None, [], {}]
    ]
    
    # Flags de revisão
    review_flags = []
    if overall_confidence < 0.7:
        review_flags.append('low_confidence')
    if not extracted.get('system'):
        review_flags.append('missing_system')
    if not extracted.get('title'):
        review_flags.append('missing_title')
    if not extracted.get('schedule'):
        review_flags.append('missing_schedule')
    if len(missing_fields) > 3:
        review_flags.append('many_missing_fields')
    
    return {
        'overall': overall_confidence,
        'by_field': field_confidence,
        'required_filled': required_filled,
        'required_total': len(required_fields),
        'optional_filled': optional_filled,
        'optional_total': len(optional_fields),
        'missing_fields': missing_fields,
        'review_flags': review_flags,
    }



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
