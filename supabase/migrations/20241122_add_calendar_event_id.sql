-- Adicionar coluna calendar_event_id na tabela tasks
-- Isso permite sincronização com Google Calendar

-- Adicionar coluna se não existir
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_tasks_calendar_event_id 
ON tasks(calendar_event_id) 
WHERE calendar_event_id IS NOT NULL;

-- Comentário
COMMENT ON COLUMN tasks.calendar_event_id IS 'ID do evento no Google Calendar quando task está sincronizada';
