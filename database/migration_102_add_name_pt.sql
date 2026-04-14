-- =============================================================================
-- Migration 102: Adicionar campo name_pt para sistemas e cenários
-- Objetivo: Suportar nomes em português para sistemas e cenários
-- =============================================================================

-- Adicionar coluna name_pt na tabela systems
ALTER TABLE systems 
ADD COLUMN IF NOT EXISTS name_pt TEXT;

-- Adicionar coluna name_pt na tabela scenarios  
ALTER TABLE scenarios 
ADD COLUMN IF NOT EXISTS name_pt TEXT;

-- Comentário para documentar o propósito das colunas
COMMENT ON COLUMN systems.name_pt IS 'Nome do sistema em português (alternativo ao name)';
COMMENT ON COLUMN scenarios.name_pt IS 'Nome do cenário em português (alternativo ao name)';

-- =============================================================================
-- Migration aplicada em 14/04/2026
-- =============================================================================