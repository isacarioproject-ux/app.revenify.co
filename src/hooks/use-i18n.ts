import { useState, useEffect, useCallback } from 'react'
import { i18n, type Locale } from '@/lib/i18n'

// Module-level flag: only load from Supabase once per session
let hasLoadedFromSupabase = false

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(i18n.getLocale())
  const [loading, setLoading] = useState(false) // Não bloqueia - sempre false

  useEffect(() => {
    // Load locale from Supabase only ONCE per session
    // Skip if already loaded or if user has a saved locale in localStorage
    if (hasLoadedFromSupabase) return

    const savedLocale = localStorage.getItem('revenify:locale')
    if (savedLocale) {
      // User already has a preference — don't override from Supabase
      hasLoadedFromSupabase = true
      return
    }

    hasLoadedFromSupabase = true
    const loadLocale = async () => {
      try {
        const supabaseLocale = await i18n.loadFromSupabase()
        if (supabaseLocale && supabaseLocale !== locale) {
          i18n.setLocale(supabaseLocale, false)
          setLocaleState(supabaseLocale)
        }
      } catch (error) {
        console.warn('Failed to load locale from Supabase:', error)
      }
    }

    loadLocale()
  }, [])

  // Listen to locale changes from other components
  useEffect(() => {
    const handleLocaleChange = () => {
      setLocaleState(i18n.getLocale())
    }

    window.addEventListener('localechange', handleLocaleChange)
    return () => window.removeEventListener('localechange', handleLocaleChange)
  }, [])

  const changeLocale = useCallback(async (newLocale: Locale) => {
    await i18n.setLocale(newLocale, true) // Save to Supabase
    setLocaleState(newLocale)
  }, [])

  // Alias for changeLocale - used in preferences page
  const setLanguage = useCallback((lang: string) => {
    const localeMap: Record<string, Locale> = {
      'pt': 'pt-BR',
      'pt-BR': 'pt-BR',
      'en': 'en',
      'es': 'es'
    }
    const newLocale = localeMap[lang] || 'en'
    i18n.setLocale(newLocale, true)
    setLocaleState(newLocale)
  }, [])

  const t = (key: string, params?: Record<string, any>) => i18n.translate(key, params)

  return { t, locale, changeLocale, setLanguage, loading }
}
