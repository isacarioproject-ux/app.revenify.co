import { useI18n } from '@/hooks/use-i18n'
import { ptBR, enUS, es } from 'date-fns/locale'
import type { Locale as DateFnsLocale } from 'date-fns'

/**
 * Hook que retorna o locale correto do date-fns baseado no idioma atual do i18n
 */
export function useDateFnsLocale(): DateFnsLocale {
  const { locale } = useI18n()
  
  switch (locale) {
    case 'pt-BR':
      return ptBR
    case 'en':
      return enUS
    case 'es':
      return es
    default:
      return ptBR // fallback para português
  }
}
