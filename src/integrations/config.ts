/**
 * CONFIGURAÇÃO DAS INTEGRAÇÕES
 * 
 * Use este arquivo para ligar/desligar integrações.
 * Se algo der errado, mude para false e a integração para.
 * 
 * AGORA COM SUPORTE A LOCALSTORAGE:
 * - Configurações da interface visual são salvas no localStorage
 * - Se existir config no localStorage, ela tem prioridade
 * - Caso contrário, usa os valores padrão deste arquivo
 */

const DEFAULT_CONFIG = {
  // Master switch - desliga TUDO se false
  ENABLED: true, // ✅ COMEÇA LIGADO

  // Integrações específicas
  WHITEBOARD_TO_TASKS: false,          // DESABILITADO - Whiteboard removido
  WHITEBOARD_TO_GERENCIADOR: false,    // DESABILITADO - Whiteboard removido
  TASKS_TO_FINANCE: true,              // ✅ Criar despesas quando task concluir
  PROJECTS_TO_FINANCE: true,           // ✅ Vincular documentos finance a projetos
  CROSS_MODULE_SYNC: true,             // Sincronização bidirecional

  // Opções de comportamento
  AUTO_CREATE: true,                  // Criar automaticamente ou perguntar?
  SHOW_NOTIFICATIONS: true,           // Mostrar notificações ao criar?
  DEBUG_MODE: false,                  // Logs detalhados no console

  // Delays (ms) para evitar spam
  DEBOUNCE_DELAY: 500,                // Esperar 500ms antes de criar
};

/**
 * Carregar configuração do localStorage ou usar padrão
 */
function loadConfig() {
  try {
    const stored = localStorage.getItem('integration-config');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('✅ [Integration Config] Loaded from localStorage:', parsed);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch (error) {
    console.warn('⚠️ [Integration Config] Error loading from localStorage:', error);
  }
  
  console.log('🔧 [Integration Config] Using default config (ENABLED=true, TASKS_TO_FINANCE=true)');
  return DEFAULT_CONFIG;
}

// Exportar configuração (carregada do localStorage ou padrão)
export const INTEGRATION_CONFIG = loadConfig();

/**
 * Helper para verificar se integração está ativa
 */
export function isIntegrationEnabled(integration: keyof typeof INTEGRATION_CONFIG): boolean {
  if (!INTEGRATION_CONFIG.ENABLED) return false;
  return INTEGRATION_CONFIG[integration] as boolean;
}

/**
 * Atualizar configuração (salva no localStorage e recarrega)
 */
export function updateConfig(newConfig: Partial<typeof DEFAULT_CONFIG>) {
  try {
    const updated = { ...INTEGRATION_CONFIG, ...newConfig };
    localStorage.setItem('integration-config', JSON.stringify(updated));
    console.log('[Integration Config] Saved to localStorage:', updated);
    return true;
  } catch (error) {
    console.error('[Integration Config] Error saving to localStorage:', error);
    return false;
  }
}
