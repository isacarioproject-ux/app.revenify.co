-- Tornar workspace_id opcional para permitir integrações pessoais
-- Pessoal: workspace_id = NULL
-- Empresa: workspace_id = UUID do workspace

ALTER TABLE google_integrations 
  ALTER COLUMN workspace_id DROP NOT NULL;

-- Adicionar constraint para garantir uniqueness
-- Cada user pode ter UMA integração pessoal (workspace_id = null)
-- E UMA integração por workspace
CREATE UNIQUE INDEX idx_google_integrations_user_personal 
  ON google_integrations(user_id) 
  WHERE workspace_id IS NULL;

CREATE UNIQUE INDEX idx_google_integrations_workspace_unique 
  ON google_integrations(workspace_id) 
  WHERE workspace_id IS NOT NULL;

-- Atualizar comentário da tabela
COMMENT ON COLUMN google_integrations.workspace_id IS 
  'NULL = integração pessoal, UUID = integração do workspace (empresa)';

-- Verificar
SELECT 'workspace_id agora é opcional para integrações pessoais!' as status;
