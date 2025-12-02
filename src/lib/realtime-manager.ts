import { supabase } from './supabase'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Configuração de subscrição para Realtime
 */
interface SubscribeConfig {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  schema: string
  table: string
  filter?: string
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
}

/**
 * Gerenciador centralizado de conexões Realtime
 * 
 * Benefícios:
 * - Evita duplicação de channels
 * - Cleanup automático
 * - Logs centralizados
 * - Performance otimizada
 */
class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private debug = true // Alterar para false em produção

  /**
   * Inscreve em mudanças de uma tabela do Supabase
   */
  subscribe(channelName: string, config: SubscribeConfig): RealtimeChannel {
    // Se já existe um channel com esse nome, retorna o existente
    if (this.channels.has(channelName)) {
      if (this.debug) {
        console.log(`🔄 [Realtime] Channel "${channelName}" já existe, reutilizando`)
      }
      return this.channels.get(channelName)!
    }

    if (this.debug) {
      console.log(`✨ [Realtime] Criando channel "${channelName}"`, {
        table: config.table,
        event: config.event,
        filter: config.filter
      })
    }

    // Criar novo channel
    const channel = supabase
      .channel(channelName)
      .on<any>(
        'postgres_changes' as any,
        {
          event: config.event,
          schema: config.schema,
          table: config.table,
          filter: config.filter,
        } as any,
        (payload: RealtimePostgresChangesPayload<any>) => {
          if (this.debug) {
            console.log(`📨 [Realtime] Evento recebido em "${channelName}"`, {
              eventType: payload.eventType,
              table: payload.table,
              new: payload.new,
              old: payload.old,
            })
          }
          config.callback(payload)
        }
      )
      .subscribe((status: string) => {
        if (this.debug) {
          console.log(`📡 [Realtime] Status do channel "${channelName}":`, status)
        }
      })

    // Armazenar channel
    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Remove subscrição de um channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    
    if (channel) {
      if (this.debug) {
        console.log(`🔌 [Realtime] Removendo channel "${channelName}"`)
      }
      
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    } else {
      if (this.debug) {
        console.warn(`⚠️ [Realtime] Channel "${channelName}" não encontrado`)
      }
    }
  }

  /**
   * Remove todos os channels ativos
   */
  unsubscribeAll(): void {
    if (this.debug) {
      console.log(`🔌 [Realtime] Removendo ${this.channels.size} channels`)
    }

    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel)
    })
    
    this.channels.clear()
  }

  /**
   * Retorna quantidade de channels ativos
   */
  getActiveChannelsCount(): number {
    return this.channels.size
  }

  /**
   * Lista todos os channels ativos
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }

  /**
   * Habilita/desabilita modo debug
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled
  }
}

// Singleton - instância única compartilhada
export const realtimeManager = new RealtimeManager()

// Cleanup global ao fechar a página
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeManager.unsubscribeAll()
  })
}
