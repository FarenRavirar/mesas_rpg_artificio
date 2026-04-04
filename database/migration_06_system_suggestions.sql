-- =============================================================================
-- migration_06_system_suggestions.sql
-- Sistema de sugestão colaborativa de sistemas de RPG
-- =============================================================================

BEGIN;

-- Tabela de sugestões de sistemas
CREATE TABLE IF NOT EXISTS system_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  node_type TEXT NOT NULL CHECK (node_type IN ('system', 'edition', 'variant', 'subsystem')),
  parent_id UUID REFERENCES systems(id) ON DELETE CASCADE,
  description TEXT,
  aliases TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Log de aprovação/rejeição
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notificação
  user_notified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_system_suggestions_status ON system_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_system_suggestions_user_id ON system_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_system_suggestions_reviewed_at ON system_suggestions(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_system_suggestions_user_notified ON system_suggestions(user_notified) WHERE user_notified = FALSE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_system_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_suggestions_updated_at
  BEFORE UPDATE ON system_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_system_suggestions_updated_at();

COMMIT;
