-- Migration: Adicionar integração entre Tasks e Finance
-- Data: 2024-11-21
-- Descrição: Permite vincular tasks a documentos financeiros e transações a tasks

-- 1. Adicionar coluna finance_document_id na tabela tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS finance_document_id UUID REFERENCES public.finance_documents(id) ON DELETE SET NULL;

-- 2. Adicionar coluna task_id na tabela finance_transactions
ALTER TABLE public.finance_transactions
ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- 3. Criar índices para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_tasks_finance_document_id ON public.tasks(finance_document_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_task_id ON public.finance_transactions(task_id);

-- 4. Adicionar comentários nas colunas
COMMENT ON COLUMN public.tasks.finance_document_id IS 'ID do documento financeiro relacionado (orçamento, relatório, etc)';
COMMENT ON COLUMN public.finance_transactions.task_id IS 'ID da tarefa relacionada a esta transação';

-- 5. Garantir que as políticas RLS funcionem com as novas colunas
-- (As políticas existentes já devem funcionar, mas vamos verificar)

-- Opcional: Trigger para atualizar updated_at quando finance_document_id mudar
CREATE OR REPLACE FUNCTION update_task_finance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finance_document_id IS DISTINCT FROM OLD.finance_document_id THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_finance
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_finance_updated_at();
