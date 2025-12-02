import { useState, useEffect } from 'react';
import { isIntegrationEnabled, INTEGRATION_CONFIG } from '@/integrations/config';

/**
 * Hook para verificar se uma integração está ativa
 * Atualiza automaticamente quando a config muda
 */
export function useIntegration(integration: keyof typeof INTEGRATION_CONFIG) {
  const [isEnabled, setIsEnabled] = useState(() => {
    const enabled = isIntegrationEnabled(integration);
    console.log(`🔌 [useIntegration] ${String(integration)} = ${enabled}`);
    return enabled;
  });

  useEffect(() => {
    // Atualizar estado inicial
    const enabled = isIntegrationEnabled(integration);
    console.log(`🔌 [useIntegration] useEffect ${String(integration)} = ${enabled}`);
    setIsEnabled(enabled);

    // Listener para mudanças no localStorage (entre abas)
    const handleStorageChange = () => {
      const stored = localStorage.getItem('integration-config');
      if (stored) {
        try {
          const config = JSON.parse(stored);
          const enabled = config.ENABLED && config[integration];
          setIsEnabled(enabled);
        } catch (error) {
          console.error('Error parsing integration config:', error);
        }
      }
    };

    // Listener para mudanças na mesma aba (evento customizado)
    const handleConfigChange = (e: CustomEvent) => {
      try {
        const config = e.detail;
        const enabled = config.ENABLED && config[integration];
        setIsEnabled(enabled);
      } catch (error) {
        console.error('Error handling config change:', error);
      }
    };

    // Escutar ambos os eventos
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('integration-config-changed' as any, handleConfigChange as any);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('integration-config-changed' as any, handleConfigChange as any);
    };
  }, [integration]);

  return isEnabled;
}
