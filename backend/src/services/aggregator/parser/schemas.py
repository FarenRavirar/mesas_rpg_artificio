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
    
    # Metadados de confiança
    confidence: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)
    
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
