import { supabase } from '@/lib/supabase'
import { FINANCE_BLOCKS_REGISTRY } from '@/lib/finance-blocks-registry'
import { FinanceBlockType } from '@/types/finance-blocks'

/**
 * Cria blocos padrão (defaultVisible: true) para um documento financeiro
 */
export async function createDefaultBlocksForDocument(documentId: string) {
  try {
    // Buscar blocos que devem ser visíveis por padrão
    const defaultBlocks = FINANCE_BLOCKS_REGISTRY.filter(block => block.defaultVisible)
    
    if (defaultBlocks.length === 0) {
      console.log('Nenhum bloco padrão definido no registry')
      return []
    }

    // Verificar se o documento já tem blocos
    const { data: existingBlocks, error: checkError } = await supabase
      .from('finance_document_blocks')
      .select('id')
      .eq('finance_document_id', documentId)
      .limit(1)

    if (checkError) {
      console.error('Erro ao verificar blocos existentes:', checkError)
      return []
    }

    // Se já tem blocos, não criar novos
    if (existingBlocks && existingBlocks.length > 0) {
      console.log(`Documento ${documentId} já possui blocos`)
      return existingBlocks
    }

    // Preparar dados para inserção
    const blocksToInsert = defaultBlocks.map((blockDef, index) => ({
      finance_document_id: documentId,
      block_type: blockDef.type as FinanceBlockType,
      visible: true,
      block_order: index,
      config: {},
    }))

    // Inserir blocos padrão
    const { data, error } = await supabase
      .from('finance_document_blocks')
      .insert(blocksToInsert)
      .select()

    if (error) {
      // Se for erro 409 (conflito), blocos já existem - não é erro crítico
      if (error.code === '23505') {
        console.log(`ℹ️ Blocos já existem para documento ${documentId}`)
        return []
      }
      console.error('Erro ao criar blocos padrão:', error)
      return []
    }

    console.log(`✅ Criados ${data?.length || 0} blocos padrão:`, 
      defaultBlocks.map(b => b.name).join(', ')
    )
    
    return data || []
  } catch (err: any) {
    console.error('Erro na função createDefaultBlocksForDocument:', err)
    return []
  }
}

/**
 * Garante que um documento tenha pelo menos os blocos padrão
 * Útil para documentos existentes que não foram criados com a nova lógica
 */
export async function ensureDefaultBlocks(documentId: string) {
  return createDefaultBlocksForDocument(documentId)
}
