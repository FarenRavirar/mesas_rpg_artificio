"""
Pydantic schemas para validação de dados extraídos de mensagens do Discord.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date


class Contact(BaseModel):
    """Contato de recrutamento."""
    channel: str  # discord, whatsapp, email, telegram
    value: str
    extra_url: Optional[str] = None


class SessionSchedule(BaseModel):
    """Estrutura de uma sessão individual."""
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    frequency: Optional[str] = None  # semanal, quinzenal, mensal
    slots_total: Optional[int] = None
    slots_available: Optional[int] = None
    in_progress: Optional[bool] = False
    notes: Optional[str] = None



class ParsedMessage(BaseModel):
    """
    Schema de validação para mensagem parseada do Discord.
    Todos os campos são opcionais - o parser faz o melhor esforço.
    """
    
    # Campos principais
    title: Optional[str] = None
    system: Optional[str] = None
    type: Optional[str] = None  # campanha, oneshot
    modality: Optional[str] = None  # online, presencial, hibrida
    slots: Optional[int] = None
    language: Optional[str] = None
    
    # Datas e horários
    starts_at: Optional[str] = None  # ISO 8601 date string
    schedule: Optional[str] = None  # Ex: "Sextas-feiras das 21h30 às 00h30"
    frequency: Optional[str] = None  # semanal, quinzenal, mensal
    
    # Preço
    price_type: Optional[str] = None  # gratuita, paga
    price_amount: Optional[float] = None
    
    # Textos longos
    description: Optional[str] = None
    rules_notes: Optional[str] = None
    
    # Mestre
    actual_gm_name: Optional[str] = None
    
    # Contatos
    contacts: List[Contact] = Field(default_factory=list)
    
    # URLs de mídia
    banner_url: Optional[str] = None  # URL da primeira imagem dos attachments
    avatar_url: Optional[str] = None  # URL do avatar do autor
    
    # Campos obrigatórios adicionais
    platforms: Optional[str] = None  # Plataformas de jogo (Discord, Roll20, Foundry, etc.)
    ageRating: Optional[str] = None  # Classificação indicativa (+18, +16, etc.)
    synopsis: Optional[str] = None  # Sinopse/descrição da mesa
    style: Optional[str] = None  # Estilo/temática da mesa (legado)
    
    # REQ-28: Cenário e estilos
    setting_name: Optional[str] = None  # Nome do cenário/ambientação
    setting_styles: List[str] = Field(default_factory=list)  # Estilos como array
    
    signupText: Optional[str] = None  # Texto de inscrição (como se inscrever)
    location: Optional[str] = None  # Localização para mesas presenciais
    
    # Campos opcionais adicionais
    level_range: Optional[str] = None  # Ex: "1-5", "10-20"
    session_duration: Optional[str] = None  # Ex: "3h", "4h"
    campaign_length: Optional[str] = None  # Ex: "6 meses", "1 ano", "curta"
    experience_required: Optional[str] = None  # iniciante, intermediario, avancado
    tags: List[str] = Field(default_factory=list)  # terror, investigacao, combate, etc.
    requires_pc: Optional[bool] = None  # Se requer PC para jogar
    external_links: List[str] = Field(default_factory=list)  # Links de formulários, sites, etc.
    
    # Fase B: Múltiplos horários e vagas detalhadas
    sessions: List[SessionSchedule] = Field(default_factory=list)  # Array de sessões estruturadas
    slots_total: Optional[int] = None  # Total de vagas
    slots_available: Optional[int] = None  # Vagas disponíveis
    slots_filled: Optional[int] = None  # Vagas preenchidas
    
    # Fase B: Sistema de classificação
    system_raw: Optional[str] = None  # Sistema original extraído
    system_normalized: Optional[str] = None  # Sistema normalizado
    system_classification: Optional[str] = None  # válido, inválido, revisável
    is_homebrew: Optional[bool] = False  # Se é homebrew
    is_custom: Optional[bool] = False  # Se é sistema próprio
    payment_classification: Optional[str] = None  # gratuita, paga, ambígua
    candidate_kind: Optional[str] = None  # mesa, grupo, anúncio múltiplo, inválido
    
    # Fase B: Separação mestre vs anunciante
    master_display_name: Optional[str] = None  # Nome do mestre exibido
    recruiter_name: Optional[str] = None  # Nome do anunciante
    publisher_role: Optional[str] = None  # mestre, anunciante
    is_same_person: Optional[bool] = True  # Se mestre = anunciante
    
    # Metadados de confiança
    confidence: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    confidence_by_field: Optional[dict] = None  # Confidence individual por campo
    missingFields: List[str] = Field(default_factory=list)  # Campos obrigatórios faltantes
    reviewFlags: List[str] = Field(default_factory=list)  # Flags de revisão
    debug: Optional[dict] = None  # Informações de debug
    
    @field_validator('price_type')
    @classmethod
    def validate_price_type(cls, v):
        if v and v not in ['gratuita', 'paga']:
            return None  # Retorna None ao invés de erro
        return v
    
    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        if v and v not in ['campanha', 'oneshot']:
            return None
        return v
    
    @field_validator('modality')
    @classmethod
    def validate_modality(cls, v):
        if v and v not in ['online', 'presencial', 'hibrida']:
            return None
        return v
    
    @field_validator('frequency')
    @classmethod
    def validate_frequency(cls, v):
        if v and v not in ['semanal', 'quinzenal', 'mensal', 'unica']:
            return None
        return v


class ParserMetadata(BaseModel):
    """Metadados da mensagem original."""
    author_username: Optional[str] = None
    author_handle: Optional[str] = None
    timestamp: Optional[str] = None
    message_id: Optional[str] = None
