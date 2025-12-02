-- Tabela para gerenciar blocos de documentos financeiros
-- Cada documento pode ter múltiplos blocos ordenados e configuráveis

-- Criar tabela finance_document_blocks
CREATE TABLE IF NOT EXISTS finance_document_blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    finance_document_id UUID NOT NULL REFERENCES finance_documents(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL CHECK (block_type IN (
        'transaction-table',
        'budget-tracker', 
        'category-summary',
        'charts',
        'quick-expense',
        'recurring-bills',
        'calendar',
        'receipts',
        'goals',
        'monthly-report'
    )),
    visible BOOLEAN DEFAULT TRUE,
    block_order INTEGER NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_finance_document_blocks_document_id 
    ON finance_document_blocks(finance_document_id);

CREATE INDEX IF NOT EXISTS idx_finance_document_blocks_order 
    ON finance_document_blocks(finance_document_id, block_order);

CREATE INDEX IF NOT EXISTS idx_finance_document_blocks_type 
    ON finance_document_blocks(block_type);

CREATE INDEX IF NOT EXISTS idx_finance_document_blocks_visible 
    ON finance_document_blocks(finance_document_id, visible);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_finance_document_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER finance_document_blocks_updated_at
    BEFORE UPDATE ON finance_document_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_finance_document_blocks_updated_at();

-- Constraint única para evitar blocos duplicados por documento
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_document_blocks_unique_type
    ON finance_document_blocks(finance_document_id, block_type);

-- RLS (Row Level Security) - mesmo padrão das outras tabelas
ALTER TABLE finance_document_blocks ENABLE ROW LEVEL SECURITY;

-- Policy para usuários verem apenas seus próprios blocos
CREATE POLICY "Users can view their own finance document blocks" ON finance_document_blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM finance_documents 
            WHERE finance_documents.id = finance_document_blocks.finance_document_id 
            AND finance_documents.user_id = auth.uid()
        )
    );

-- Policy para usuários criarem blocos em seus documentos
CREATE POLICY "Users can create blocks in their own finance documents" ON finance_document_blocks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM finance_documents 
            WHERE finance_documents.id = finance_document_blocks.finance_document_id 
            AND finance_documents.user_id = auth.uid()
        )
    );

-- Policy para usuários atualizarem blocos em seus documentos
CREATE POLICY "Users can update blocks in their own finance documents" ON finance_document_blocks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM finance_documents 
            WHERE finance_documents.id = finance_document_blocks.finance_document_id 
            AND finance_documents.user_id = auth.uid()
        )
    );

-- Policy para usuários deletarem blocos em seus documentos
CREATE POLICY "Users can delete blocks in their own finance documents" ON finance_document_blocks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM finance_documents 
            WHERE finance_documents.id = finance_document_blocks.finance_document_id 
            AND finance_documents.user_id = auth.uid()
        )
    );

-- Comentários para documentação
COMMENT ON TABLE finance_document_blocks IS 'Blocos configuráveis dentro de documentos financeiros';
COMMENT ON COLUMN finance_document_blocks.finance_document_id IS 'ID do documento financeiro ao qual o bloco pertence';
COMMENT ON COLUMN finance_document_blocks.block_type IS 'Tipo do bloco (transaction-table, recurring-bills, etc.)';
COMMENT ON COLUMN finance_document_blocks.visible IS 'Se o bloco está visível no documento';
COMMENT ON COLUMN finance_document_blocks.block_order IS 'Ordem do bloco no documento (para drag & drop)';
COMMENT ON COLUMN finance_document_blocks.config IS 'Configurações específicas do bloco em JSON';
