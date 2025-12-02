import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  FinanceDocumentBlock,
  FinanceBlockType,
} from '@/types/finance-blocks'
import { ensureDefaultBlocks } from '@/lib/finance-blocks-utils'

/**
 * Hook para gerenciar blocos de um documento financeiro
 * Persiste no banco e sincroniza estado
 */
export function useFinanceBlocks(documentId: string) {
  const [blocks, setBlocks] = useState<FinanceDocumentBlock[]>([])
  const [loading, setLoading] = useState(true)

  // Carregar blocos do banco
  const fetchBlocks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('finance_document_blocks')
        .select('*')
        .eq('finance_document_id', documentId)
        .order('block_order', { ascending: true })

      if (error) throw error

      let blocks = data || []

      // Se não há blocos, criar os padrão automaticamente
      if (blocks.length === 0) {
        const defaultBlocks = await ensureDefaultBlocks(documentId)
        blocks = [...blocks, ...(defaultBlocks || [])]
      }

      setBlocks(blocks)
    } catch (err: any) {
      console.error('Erro ao carregar blocos:', err)
      toast.error('Erro ao carregar blocos', {
        description: err.message,
      })
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  // Adicionar bloco
  const addBlock = useCallback(
    async (blockType: FinanceBlockType) => {
      try {
        // Verificar se já existe
        const exists = blocks.find((b) => b.block_type === blockType)
        if (exists) {
          toast.info('Este bloco já está adicionado')
          return
        }

        // Calcular próxima ordem
        const maxOrder = blocks.reduce((max, b) => Math.max(max, b.block_order), 0)

        const { data, error } = await supabase
          .from('finance_document_blocks')
          .insert({
            finance_document_id: documentId,
            block_type: blockType,
            visible: true,
            block_order: maxOrder + 1,
            config: {},
          })
          .select()
          .single()

        if (error) throw error

        setBlocks([...blocks, data])
        toast.success('Bloco adicionado!')
      } catch (err: any) {
        toast.error('Erro ao adicionar bloco', {
          description: err.message,
        })
      }
    },
    [documentId, blocks]
  )

  // Remover bloco
  const removeBlock = useCallback(
    async (blockId: string) => {
      try {
        const { error } = await supabase
          .from('finance_document_blocks')
          .delete()
          .eq('id', blockId)

        if (error) throw error

        setBlocks(blocks.filter((b) => b.id !== blockId))
        toast.success('Bloco removido')
      } catch (err: any) {
        toast.error('Erro ao remover bloco', {
          description: err.message,
        })
      }
    },
    [blocks]
  )

  // Reordenar blocos
  const reorderBlocks = useCallback(
    async (newOrder: FinanceDocumentBlock[]) => {
      try {
        // Atualizar ordem no banco
        const updates = newOrder.map((block, index) => ({
          id: block.id,
          block_order: index,
        }))

        for (const update of updates) {
          await supabase
            .from('finance_document_blocks')
            .update({ block_order: update.block_order })
            .eq('id', update.id)
        }

        setBlocks(newOrder)
      } catch (err: any) {
        toast.error('Erro ao reordenar blocos', {
          description: err.message,
        })
      }
    },
    []
  )

  // Atualizar configuração de um bloco
  const updateBlockConfig = useCallback(
    async (blockId: string, config: Record<string, any>) => {
      try {
        const { error } = await supabase
          .from('finance_document_blocks')
          .update({ config })
          .eq('id', blockId)

        if (error) throw error

        setBlocks(
          blocks.map((b) => (b.id === blockId ? { ...b, config } : b))
        )
      } catch (err: any) {
        toast.error('Erro ao atualizar configuração', {
          description: err.message,
        })
      }
    },
    [blocks]
  )

  // Verificar se um bloco está ativo
  const hasBlock = useCallback(
    (blockType: FinanceBlockType) => {
      return blocks.some((b) => b.block_type === blockType && b.visible)
    },
    [blocks]
  )

  return {
    blocks,
    loading,
    addBlock,
    removeBlock,
    reorderBlocks,
    updateBlockConfig,
    hasBlock,
    refetch: fetchBlocks,
  }
}
