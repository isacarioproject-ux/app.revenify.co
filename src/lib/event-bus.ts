/**
 * EVENT BUS - Sistema de comunicação entre módulos
 * 
 * Este arquivo NÃO modifica nada existente.
 * Apenas permite módulos conversarem entre si.
 */

type EventCallback = (data: any) => void | Promise<void>;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * Registrar listener para um evento
   * @example eventBus.on('task.created', (data) => console.log(data))
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);

    // Retorna função para remover listener
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Disparar evento
   * @example eventBus.emit('task.created', { title: 'Nova tarefa' })
   */
  async emit(event: string, data?: any): Promise<void> {
    const callbacks = this.listeners.get(event);
    if (!callbacks || callbacks.size === 0) {
      // Nenhum listener registrado (não é erro)
      return;
    }

    // Executar todos os listeners
    const promises = Array.from(callbacks).map(callback => {
      try {
        return callback(data);
      } catch (error) {
        console.error(`Error in listener for event "${event}":`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Remover todos os listeners de um evento
   */
  off(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Limpar todos os listeners (útil para testes)
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Singleton - única instância em toda a aplicação
export const eventBus = new EventBus();
